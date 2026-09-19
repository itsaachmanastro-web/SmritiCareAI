import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Brain,
  Award,
  Volume2,
  Eye,
  Film,
  Zap,
  TrendingUp,
  Activity
} from 'lucide-react';
import ElderButton from '../../../components/common/ElderButton';
import ConfettiCelebration from '../../../components/common/ConfettiCelebration';
import VoicePromptCard from '../../../components/common/VoicePromptCard';
import MotionVideoPlayer from '../../../components/games/MotionVideoPlayer';
import { playMatchSuccessSound, playCardFlipSound, playTokaBambooSound } from '../../../audio/synthAudio';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import {
  INITIAL_DIFFICULTY,
  getTierInfo,
  getDifficultyTier,
  getMemoryMotionProfile,
  selectNextChallenge,
  recordVideoChallengeResult,
  completeMemoryMotionSession,
  generateSessionRecommendation
} from '../../../services/games/MemoryMotionEngine';
import { MEMORY_MOTION_CHALLENGES } from '../../../data/memoryMotionChallenges';

const TOTAL_SESSION_ROUNDS = 5;

export default function MemoryMotionGame() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();

  const currentUserId = currentUser?.id || 1;
  const userName = currentUser?.name || 'Amma';

  // Game flow states: 'intro' | 'watching' | 'question' | 'feedback' | 'summary'
  const [gameState, setGameState] = useState('intro');

  // Adaptive Difficulty State (Continuous 1.0 to 10.0)
  const [currentDifficulty, setCurrentDifficulty] = useState(INITIAL_DIFFICULTY);
  const [startDifficulty, setStartDifficulty] = useState(INITIAL_DIFFICULTY);
  const [adaptiveProfile, setAdaptiveProfile] = useState(null);

  // Session Progress
  const [currentRound, setCurrentRound] = useState(1);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [usedChallengeIds, setUsedChallengeIds] = useState([]);
  const [sessionResults, setSessionResults] = useState([]);
  const [replaysRemaining, setReplaysRemaining] = useState(1);

  // Question & Reaction Time Tracking
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [lastChallengeResult, setLastChallengeResult] = useState(null);
  const [feedbackDelayTimer, setFeedbackDelayTimer] = useState(null);

  // Session Summary Data
  const [summaryData, setSummaryData] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const sessionStartTimeRef = useRef(Date.now());

  // Load user's adaptive difficulty profile on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const prof = await getMemoryMotionProfile(currentUserId);
        if (prof) {
          setAdaptiveProfile(prof);
          const diff = Number(prof.currentDifficulty) || INITIAL_DIFFICULTY;
          setCurrentDifficulty(diff);
          setStartDifficulty(diff);
        }
      } catch (err) {
        console.warn('Could not load Memory Motion profile:', err);
      }
    }
    loadProfile();
  }, [currentUserId]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (feedbackDelayTimer) clearTimeout(feedbackDelayTimer);
    };
  }, [feedbackDelayTimer]);

  // ---------------------------------------------------------------------------
  // Session Flow Handlers
  // ---------------------------------------------------------------------------

  const handleStartSession = () => {
    sessionStartTimeRef.current = Date.now();
    setCurrentRound(1);
    setSessionResults([]);
    setUsedChallengeIds([]);
    startRound(currentDifficulty, []);
  };

  const startRound = (targetDifficulty, usedIds) => {
    const nextChal = selectNextChallenge({
      currentDifficulty: targetDifficulty,
      userSkillScores: adaptiveProfile ? {
        visualMemory: adaptiveProfile.visualMemoryScore,
        attention: adaptiveProfile.attentionScore,
        sequenceMemory: adaptiveProfile.sequenceMemoryScore,
        recall: adaptiveProfile.recallScore
      } : null,
      usedIds,
      challengesPool: MEMORY_MOTION_CHALLENGES
    });

    setCurrentChallenge(nextChal);
    setUsedChallengeIds(prev => [...prev, nextChal.id]);

    // Replay allowance depends on difficulty tier
    const tier = getDifficultyTier(targetDifficulty);
    const replays = tier === 'easy' ? 2 : tier === 'medium' ? 1 : 0;
    setReplaysRemaining(replays);

    setSelectedOptionIndex(null);
    setLastChallengeResult(null);
    setGameState('watching');
  };

  const handleVideoEnded = () => {
    // Transition to question phase
    setGameState('question');
    setQuestionStartTime(Date.now());
  };

  const handleReplayUsed = () => {
    setReplaysRemaining(r => Math.max(0, r - 1));
  };

  const handleAnswerSelect = async (optIndex) => {
    if (gameState !== 'question' || selectedOptionIndex !== null) return;

    playCardFlipSound();
    const responseTimeMs = Math.max(800, Date.now() - questionStartTime);
    setSelectedOptionIndex(optIndex);

    const isCorrect = optIndex === currentChallenge.correctAnswerIndex;

    if (isCorrect) {
      playMatchSuccessSound();
    } else {
      playTokaBambooSound();
    }

    // Record result in adaptive engine
    try {
      const adaptResult = await recordVideoChallengeResult({
        userId: currentUserId,
        sessionId: `session_mm_${sessionStartTimeRef.current}`,
        challenge: currentChallenge,
        correct: isCorrect,
        responseTimeMs,
        replayCount: (currentChallenge.maxReplays || 1) - replaysRemaining,
        currentDifficulty,
        recentSessionResults: sessionResults
      });

      const updatedRecord = {
        round: currentRound,
        challengeId: currentChallenge.id,
        title: currentChallenge.title,
        cognitiveSkill: currentChallenge.cognitiveSkill,
        difficultyBefore: currentDifficulty,
        difficultyAfter: adaptResult.newDifficulty,
        correct: isCorrect,
        responseTimeMs,
        selectedOptionIndex: optIndex
      };

      setSessionResults(prev => [...prev, updatedRecord]);
      setCurrentDifficulty(adaptResult.newDifficulty);
      setLastChallengeResult({
        ...adaptResult,
        isCorrect
      });
    } catch (err) {
      console.warn('Could not record challenge result:', err);
    }

    setGameState('feedback');
  };

  const handleNextRound = async () => {
    if (currentRound < TOTAL_SESSION_ROUNDS) {
      const nextRoundNum = currentRound + 1;
      setCurrentRound(nextRoundNum);
      startRound(currentDifficulty, usedChallengeIds);
    } else {
      // Session Completed!
      await handleCompleteSession();
    }
  };

  const handleCompleteSession = async () => {
    const totalDurationSec = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
    setGameState('summary');
    setIsGeneratingAi(true);

    try {
      const summary = await completeMemoryMotionSession({
        userId: currentUserId,
        patientId: currentUserId,
        sessionResults,
        startDifficulty,
        finalDifficulty: currentDifficulty,
        totalDurationSeconds: totalDurationSec
      });
      setSummaryData(summary);

      // Generate dementia-friendly recommendation (local + optional Gemini)
      const rec = await generateSessionRecommendation({
        accuracy: summary.accuracy,
        avgResponseTimeMs: summary.avgResponseTimeMs,
        finalDifficulty: currentDifficulty,
        skillsPracticed: ['Visual Memory', 'Sequence Timing', 'Object Recall'],
        userName,
        language
      });
      setAiRecommendation(rec);
    } catch (err) {
      console.warn('Could not finish Memory Motion session:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Helper for challenge question text localized
  const getLocalizedText = (textObj) => {
    if (!textObj) return '';
    if (typeof textObj === 'string') return textObj;
    return textObj[language] || textObj.en || '';
  };

  const tierInfo = getTierInfo(currentDifficulty);

  // ---------------------------------------------------------------------------
  // RENDER: Phase 1 — INTRO
  // ---------------------------------------------------------------------------
  if (gameState === 'intro') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 space-y-6 animate-fade-in">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/patient/games')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#131D33] hover:bg-slate-100 dark:hover:bg-[#1E293B] border border-slate-200 dark:border-[#243352] text-slate-700 dark:text-slate-200 font-bold text-base min-h-[48px] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('common.back') || 'Back'}</span>
          </button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-100 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('games.memorymotion.aiAdaptiveBadge') || 'AI-Adaptive Video Training'}</span>
          </span>
        </div>

        {/* Hero Card */}
        <div className="bg-gradient-to-br from-indigo-50 via-teal-50 to-emerald-50 dark:from-[#131D33] dark:via-[#19243E] dark:to-[#131D33] rounded-3xl md:rounded-4xl p-6 md:p-8 border-3 border-indigo-200 dark:border-indigo-800/80 shadow-lg text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
            <Film className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white font-display">
              {t('games.memorymotion.title') || 'Memory Motion'}
            </h1>
            <p className="text-base md:text-lg font-bold text-indigo-800 dark:text-indigo-300">
              {t('games.memorymotion.subtitle') || 'Watch • Remember • Respond'}
            </p>
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base max-w-xl mx-auto font-medium">
            {t('games.memorymotion.introDesc') || 'Watch short, peaceful everyday scenes. Notice the actions, colors, and objects, then answer simple questions to keep your memory sharp and active.'}
          </p>

          {/* Current Adaptive Difficulty Pill */}
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white dark:bg-[#1E293B] border-2 border-indigo-200 dark:border-indigo-700 shadow-xs">
            <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div className="text-left">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
                {t('games.memorymotion.currentLevel') || 'Current Adapted Level'}
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                Level {currentDifficulty.toFixed(1)} &bull; {t(tierInfo.labelKey) || tierInfo.defaultLabel}
              </span>
            </div>
          </div>

          {/* Start Action */}
          <div className="pt-2">
            <ElderButton
              variant="primary"
              size="lg"
              icon={Play}
              onClick={handleStartSession}
              className="w-full sm:w-auto px-10 shadow-lg"
            >
              {t('games.memorymotion.startSession') || 'Start Memory Session (5 Rounds)'}
            </ElderButton>
          </div>
        </div>

        {/* Voice Prompt Instructions */}
        <VoicePromptCard
          text={t('games.memorymotion.voicePrompt') || 'Welcome to Memory Motion. Watch each short video carefully. When it finishes, choose the correct answer at your own peaceful pace.'}
          label={t('games.memorymotion.listenGuide') || 'Listen to Instructions'}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: Phase 2 — WATCHING VIDEO
  // ---------------------------------------------------------------------------
  if (gameState === 'watching' && currentChallenge) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-5 animate-fade-in">
        {/* Round Progress Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/patient/games')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#131D33] hover:bg-slate-100 dark:hover:bg-[#1E293B] border border-slate-200 dark:border-[#243352] text-slate-700 dark:text-slate-200 font-bold text-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('common.exit') || 'Exit'}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#131D33] px-3 py-1 rounded-full border border-slate-200 dark:border-[#243352]">
              {t('games.memorymotion.round') || 'Round'} {currentRound} / {TOTAL_SESSION_ROUNDS}
            </span>
            <span className="text-xs font-black text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
              Level {currentDifficulty.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Video Player Component */}
        <MotionVideoPlayer
          challenge={currentChallenge}
          onVideoEnded={handleVideoEnded}
          replaysRemaining={replaysRemaining}
          onReplayUsed={handleReplayUsed}
          autoPlay={true}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: Phase 3 — QUESTION
  // ---------------------------------------------------------------------------
  if (gameState === 'question' && currentChallenge) {
    const questionText = getLocalizedText(currentChallenge.question);

    return (
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6 animate-fade-in">
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {t('games.memorymotion.round') || 'Round'} {currentRound} of {TOTAL_SESSION_ROUNDS}
          </span>
          <span className="text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800">
            {t('games.memorymotion.takeYourTime') || 'Take your time • No rush'}
          </span>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-[#131D33] rounded-3xl p-6 md:p-8 border-3 border-slate-200 dark:border-[#243352] shadow-xl space-y-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-teal-100 dark:bg-teal-950 text-teal-900 dark:text-teal-300">
              <Brain className="w-3.5 h-3.5" />
              <span>{t('games.memorymotion.questionPrompt') || 'Question on what you saw'}</span>
            </span>

            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-snug">
              {questionText}
            </h2>
          </div>

          {/* Multiple Choice Options (Large touch targets for elderly fingers) */}
          <div className="grid grid-cols-1 gap-3.5 pt-2">
            {currentChallenge.options.map((option, idx) => {
              const optText = getLocalizedText(option.text);
              return (
                <button
                  key={option.id || idx}
                  type="button"
                  onClick={() => handleAnswerSelect(idx)}
                  className="w-full text-left p-4 md:p-5 rounded-2xl border-2 border-slate-300 dark:border-[#243352] hover:border-teal-500 dark:hover:border-teal-400 bg-slate-50 hover:bg-teal-50/70 dark:bg-slate-800/60 dark:hover:bg-teal-950/40 text-slate-900 dark:text-white font-bold text-base md:text-lg transition-all transform active:scale-[0.99] flex items-center justify-between gap-4 cursor-pointer shadow-xs min-h-[64px]"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-2xl shrink-0">{option.icon || '🔹'}</span>
                    <span className="leading-snug">{optText}</span>
                  </div>
                  <span className="w-7 h-7 rounded-full border-2 border-slate-400 dark:border-slate-600 flex items-center justify-center text-xs font-mono font-bold text-slate-500 shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Read aloud helper */}
        <VoicePromptCard
          text={questionText}
          label={t('games.memorymotion.listenQuestion') || 'Read Question Aloud'}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: Phase 4 — FEEDBACK
  // ---------------------------------------------------------------------------
  if (gameState === 'feedback' && currentChallenge) {
    const isCorrect = lastChallengeResult?.isCorrect;
    const explanationText = getLocalizedText(currentChallenge.explanation);

    return (
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6 animate-fade-in">
        {/* Feedback Card */}
        <div className={`rounded-3xl p-6 md:p-8 border-3 shadow-xl space-y-5 ${
          isCorrect
            ? 'bg-emerald-50/90 dark:bg-[#131D33] border-emerald-300 dark:border-emerald-800/90 text-emerald-950 dark:text-emerald-100'
            : 'bg-amber-50/90 dark:bg-[#131D33] border-amber-300 dark:border-amber-800/90 text-amber-950 dark:text-amber-100'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md ${
              isCorrect ? 'bg-emerald-600' : 'bg-amber-600'
            }`}>
              {isCorrect ? <CheckCircle2 className="w-8 h-8" /> : <RotateCcw className="w-8 h-8" />}
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
                {isCorrect
                  ? (t('games.memorymotion.correctTitle') || 'Splendid! You Remembered! 🌟')
                  : (t('games.memorymotion.tryTitle') || 'Good Try! Notice Next Time 🌸')}
              </h2>
              <p className="text-sm md:text-base font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                {isCorrect
                  ? (t('games.memorymotion.correctSubtitle') || 'Your visual attention was spot-on.')
                  : (t('games.memorymotion.trySubtitle') || 'Every gentle attempt strengthens your mind.')}
              </p>
            </div>
          </div>

          {/* Explanation Box */}
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm md:text-base font-medium text-slate-800 dark:text-slate-200">
            {explanationText}
          </div>

          {/* Adaptive Engine Micro-Adjustment Notification */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/90 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>
                {t('games.memorymotion.adaptedTo') || 'Difficulty Adapted'}:{' '}
                <span className="font-black text-indigo-600 dark:text-indigo-400">
                  Level {currentDifficulty.toFixed(1)}
                </span>
                {' '}&bull; {t(tierInfo.labelKey) || tierInfo.defaultLabel}
              </span>
            </div>

            <span className="text-[11px] text-slate-500">
              Round {currentRound} of {TOTAL_SESSION_ROUNDS}
            </span>
          </div>

          {/* Continue Action */}
          <div className="pt-2 flex justify-end">
            <ElderButton
              variant={isCorrect ? 'primary' : 'orange'}
              size="lg"
              icon={Play}
              onClick={handleNextRound}
              className="w-full sm:w-auto px-8 shadow-md"
            >
              {currentRound < TOTAL_SESSION_ROUNDS
                ? (t('games.memorymotion.nextRound') || 'Next Challenge →')
                : (t('games.memorymotion.finishSession') || 'View Session Summary →')}
            </ElderButton>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: Phase 5 — SESSION SUMMARY
  // ---------------------------------------------------------------------------
  if (gameState === 'summary') {
    const accuracy = summaryData?.accuracy ?? 100;
    const avgSec = summaryData?.avgResponseTimeMs ? (summaryData.avgResponseTimeMs / 1000).toFixed(1) : '3.2';
    const finalDiff = summaryData?.finalDifficulty ?? currentDifficulty;
    const diffDelta = summaryData?.difficultyDelta ?? 0;

    return (
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 space-y-6 animate-fade-in">
        <ConfettiCelebration />

        {/* Summary Hero */}
        <div className="bg-gradient-to-br from-indigo-50 via-teal-50 to-emerald-50 dark:from-[#131D33] dark:via-[#19243E] dark:to-[#131D33] rounded-3xl md:rounded-4xl p-6 md:p-8 border-3 border-teal-300 dark:border-teal-800/80 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-teal-600 text-white flex items-center justify-center mx-auto text-3xl shadow-md">
            🌟
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white font-display">
              {t('games.memorymotion.sessionComplete') || 'Session Complete! Wonderful Job!'}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-base md:text-lg font-bold">
              {t('games.memorymotion.sessionEncouragement') || 'You exercised your visual memory, sequence awareness, and reaction focus.'}
            </p>
          </div>

          {/* Primary Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/80 text-center shadow-xs">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase">
                {t('games.score') || 'Accuracy'}
              </span>
              <span className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {accuracy}%
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/80 text-center shadow-xs">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase">
                {t('games.memorymotion.avgSpeed') || 'Avg Response'}
              </span>
              <span className="text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400">
                {avgSec}s
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/80 text-center shadow-xs">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase">
                {t('games.memorymotion.completedChallenges') || 'Rounds'}
              </span>
              <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                {TOTAL_SESSION_ROUNDS}/{TOTAL_SESSION_ROUNDS}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/80 text-center shadow-xs">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase">
                {t('games.level') || 'Adapted Level'}
              </span>
              <span className="text-2xl md:text-3xl font-black text-teal-600 dark:text-teal-400">
                {finalDiff.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Difficulty Progression Indicator */}
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center justify-between text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <span>{t('games.memorymotion.levelProgress') || 'Difficulty Progression'}:</span>
            </span>
            <span>
              Level {startDifficulty.toFixed(1)} &rarr;{' '}
              <span className="text-teal-700 dark:text-teal-400 font-black">
                Level {finalDiff.toFixed(1)} ({diffDelta >= 0 ? `+${diffDelta}` : diffDelta})
              </span>
            </span>
          </div>

          {/* AI / Supportive Care Recommendation */}
          <div className="p-4 md:p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-left space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>{t('games.memorymotion.aiNote') || 'SmritiCare Supportive Recommendation'}</span>
            </div>
            <p className="text-sm md:text-base font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
              {isGeneratingAi ? (t('common.loading') || 'Synthesizing gentle encouragement...') : aiRecommendation}
            </p>
          </div>

          {/* Action Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <ElderButton
              variant="orange"
              size="lg"
              icon={RotateCcw}
              onClick={handleStartSession}
            >
              {t('games.playAgain') || 'Play Another Session'}
            </ElderButton>

            <ElderButton
              variant="secondary"
              size="lg"
              icon={ArrowLeft}
              onClick={() => navigate('/patient/games')}
            >
              {t('games.exitGame') || 'Back to Games'}
            </ElderButton>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
