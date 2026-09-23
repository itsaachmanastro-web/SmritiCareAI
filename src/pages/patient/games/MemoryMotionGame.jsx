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
  Activity,
  Heart,
  HelpCircle
} from 'lucide-react';
import ElderButton from '../../../components/common/ElderButton';
import ConfettiCelebration from '../../../components/common/ConfettiCelebration';
import AiAdaptationCard from '../../../components/common/AiAdaptationCard';
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
import { MEMORY_MOTION_CHALLENGES } from '../../../data/memoryMotionChallenges.js';
import { getScenarioVideo } from '../../../services/games/CognitiveVideoService.js';

const TOTAL_SESSION_ROUNDS = 4;

export default function MemoryMotionGame() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();

  const currentUserId = currentUser?.id || 1;
  const userName = currentUser?.name || 'Amma';

  // Active Step: 1 = Watch Video, 2 = Answer Questions, 3 = See Your Result
  const [activeStep, setActiveStep] = useState(1);

  // Game flow states: 'watching' | 'question' | 'feedback' | 'summary'
  const [gameState, setGameState] = useState('watching');

  // Adaptive Difficulty State (Continuous 1.0 to 10.0)
  const [currentDifficulty, setCurrentDifficulty] = useState(INITIAL_DIFFICULTY);
  const [startDifficulty, setStartDifficulty] = useState(INITIAL_DIFFICULTY);
  const [adaptiveProfile, setAdaptiveProfile] = useState(null);

  // Session Progress
  const [currentRound, setCurrentRound] = useState(1);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [usedChallengeIds, setUsedChallengeIds] = useState([]);
  const [sessionResults, setSessionResults] = useState([]);
  const [replaysRemaining, setReplaysRemaining] = useState(2);

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

  // Load user's adaptive difficulty profile on mount & start round 1
  useEffect(() => {
    async function loadProfileAndStart() {
      sessionStartTimeRef.current = Date.now();
      let diff = INITIAL_DIFFICULTY;
      try {
        const prof = await getMemoryMotionProfile(currentUserId);
        if (prof) {
          setAdaptiveProfile(prof);
          diff = Number(prof.currentDifficulty) || INITIAL_DIFFICULTY;
          setCurrentDifficulty(diff);
          setStartDifficulty(diff);
        }
      } catch (err) {
        console.warn('Could not load Memory Motion profile:', err);
      }
      startRound(diff, [], 1);
    }
    loadProfileAndStart();
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

  const startRound = (targetDifficulty, usedIds, roundNum = 1) => {
    const nextChal = selectNextChallenge({
      currentDifficulty: targetDifficulty,
      roundIndex: roundNum,
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
    setActiveStep(1);
    setGameState('watching');
  };

  const handleVideoEnded = () => {
    // Keep in watching until user clicks Continue After Video
  };

  const handleProceedToQuestions = () => {
    setActiveStep(2);
    setGameState('question');
    setQuestionStartTime(Date.now());
  };

  const handleRewatchVideo = () => {
    if (replaysRemaining <= 0) return;
    handleReplayUsed();
    setActiveStep(1);
    setGameState('watching');
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
        replayCount: (currentChallenge.maxReplays || 2) - replaysRemaining,
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
      startRound(currentDifficulty, usedChallengeIds, nextRoundNum);
    } else {
      // Session Completed!
      await handleCompleteSession();
    }
  };

  const handleCompleteSession = async () => {
    const totalDurationSec = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
    setActiveStep(3);
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

  const handleRestartSession = () => {
    sessionStartTimeRef.current = Date.now();
    setCurrentRound(1);
    setSessionResults([]);
    setUsedChallengeIds([]);
    startRound(currentDifficulty, [], 1);
  };

  // Helper for challenge question text localized
  const getLocalizedText = (textObj) => {
    if (!textObj) return '';
    if (typeof textObj === 'string') return textObj;
    return textObj[language] || textObj.en || '';
  };

  const currentScenario = currentChallenge ? getScenarioVideo(currentChallenge) : null;
  const scenarioTitle = currentScenario ? getLocalizedText(currentScenario.title) : '';

  const tierInfo = getTierInfo(currentDifficulty);
  const tierName = t(tierInfo.labelKey) || tierInfo.defaultLabel;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Top Breadcrumb & Back Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2">
        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/patient/games')}
              className="hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-semibold"
            >
              <span>Cognitive Games</span>
            </button>
            <span>&rsaquo;</span>
            <span className="text-slate-200 font-bold">
              {t('games.memorymotion.title') || 'Memory in Daily Life'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/patient/games')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('common.exit') || 'Exit'}</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-2 space-y-6">
        
        {/* Title & Status Header matching Reference Image */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Brain Icon Square */}
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <Brain className="w-7 h-7" />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
                {t('games.memorymotion.title') || 'Memory in Daily Life'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                {scenarioTitle
                  ? `${t('games.memorymotion.round') || 'Round'} ${currentRound}: ${scenarioTitle} — ${t('games.memorymotion.watchInstruction') || 'Watch the video carefully. Try to remember what happens.'}`
                  : (t('games.memorymotion.watchInstruction') || 'Watch the video carefully. Try to remember what happens.')}
              </p>
            </div>
          </div>

          {/* Status Badges on the right */}
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-900 text-slate-300 border border-slate-800 shadow-xs">
              {t('games.memorymotion.round') || 'Round'} {currentRound} of {TOTAL_SESSION_ROUNDS}
            </span>

            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-teal-950/80 text-teal-300 border border-teal-700/80 shadow-xs flex items-center gap-1.5">
              <span>Level {Math.round(currentDifficulty)} ({tierName.split('&')[0].trim()})</span>
            </span>
          </div>
        </div>

        {/* 2-Column Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================================================================= */}
          {/* LEFT / CENTER COLUMN (Primary Visual Focus: Video or Questions)   */}
          {/* ================================================================= */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* PHASE 1: WATCHING VIDEO */}
            {gameState === 'watching' && currentChallenge && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <MotionVideoPlayer
                  challenge={currentChallenge}
                  onVideoEnded={handleVideoEnded}
                  replaysRemaining={replaysRemaining}
                  onReplayUsed={handleReplayUsed}
                  autoPlay={true}
                />
              </motion.div>
            )}

            {/* PHASE 2: QUESTION */}
            {gameState === 'question' && currentChallenge && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6"
              >
                {/* Header Bar */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-teal-400 bg-teal-950/60 px-3 py-1 rounded-full border border-teal-800/60">
                    <Brain className="w-3.5 h-3.5" />
                    <span>{t('games.memorymotion.questionPrompt') || 'Question on what you saw'}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    {replaysRemaining > 0 && (
                      <button
                        type="button"
                        onClick={handleRewatchVideo}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{t('games.memorymotion.rewatchVideo') || 'Re-watch Video'}</span>
                      </button>
                    )}
                    <span className="text-xs font-bold text-slate-400">
                      {t('games.memorymotion.takeYourTime') || 'Take your time • No rush'}
                    </span>
                  </div>
                </div>

                {/* Big Question Prompt */}
                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-snug">
                  {getLocalizedText(currentChallenge.question)}
                </h2>

                {/* Multiple Choice Options (Large touch targets) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  {currentChallenge.options.map((option, idx) => {
                    const optText = getLocalizedText(option.text);
                    return (
                      <button
                        key={option.id || idx}
                        type="button"
                        onClick={() => handleAnswerSelect(idx)}
                        className="w-full text-left p-4 sm:p-5 rounded-2xl border-2 border-slate-700/80 hover:border-blue-500 bg-slate-800/80 hover:bg-blue-950/40 text-white font-bold text-base sm:text-lg transition-all transform active:scale-[0.99] flex items-center justify-between gap-4 cursor-pointer shadow-md min-h-[64px]"
                      >
                        <div className="flex items-center gap-3.5">
                          <span className="text-2xl shrink-0">{option.icon || '🔹'}</span>
                          <span className="leading-snug">{optText}</span>
                        </div>
                        <span className="w-7 h-7 rounded-full border-2 border-slate-600 flex items-center justify-center text-xs font-mono font-bold text-slate-400 shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Voice Read Aloud Helper */}
                <div className="pt-2">
                  <VoicePromptCard
                    text={getLocalizedText(currentChallenge.question)}
                    label={t('games.memorymotion.listenQuestion') || 'Read Question Aloud'}
                  />
                </div>
              </motion.div>
            )}

            {/* PHASE 2.5: FEEDBACK */}
            {gameState === 'feedback' && currentChallenge && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6"
              >
                {/* Result Status Banner */}
                <div className={`p-5 rounded-2xl border-2 flex items-center gap-4 ${
                  lastChallengeResult?.isCorrect
                    ? 'bg-emerald-950/40 border-emerald-600/80 text-emerald-100'
                    : 'bg-amber-950/40 border-amber-600/80 text-amber-100'
                }`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md ${
                    lastChallengeResult?.isCorrect ? 'bg-emerald-600' : 'bg-amber-600'
                  }`}>
                    {lastChallengeResult?.isCorrect ? <CheckCircle2 className="w-7 h-7" /> : <RotateCcw className="w-7 h-7" />}
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      {lastChallengeResult?.isCorrect
                        ? (t('games.memorymotion.correctTitle') || 'Splendid! You Remembered! 🌟')
                        : (t('games.memorymotion.tryTitle') || 'Good Try! Notice Next Time 🌸')}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-slate-300 mt-0.5">
                      {lastChallengeResult?.isCorrect
                        ? (t('games.memorymotion.correctSubtitle') || 'Your visual memory and observation was spot-on.')
                        : (t('games.memorymotion.trySubtitle') || 'Every gentle attempt strengthens your mind.')}
                    </p>
                  </div>
                </div>

                {/* Explanation */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-sm sm:text-base font-medium text-slate-200">
                  {getLocalizedText(currentChallenge.explanation)}
                </div>

                {/* Micro-Adjustment Notification */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs font-bold text-slate-300">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span>
                      {t('games.memorymotion.currentLevel') || 'Difficulty Adapted'}:{' '}
                      <span className="font-black text-blue-400">
                        Level {currentDifficulty.toFixed(1)}
                      </span>
                      {' '}&bull; {tierName}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Round {currentRound} of {TOTAL_SESSION_ROUNDS}
                  </span>
                </div>

                {/* Action to proceed */}
                <div className="flex justify-end pt-2">
                  <ElderButton
                    variant={lastChallengeResult?.isCorrect ? 'primary' : 'orange'}
                    size="lg"
                    icon={Play}
                    onClick={handleNextRound}
                    className="w-full sm:w-auto px-8 shadow-lg"
                  >
                    {currentRound < TOTAL_SESSION_ROUNDS
                      ? `${t('games.memorymotion.nextRound') || 'Next Round'} (${t('games.memorymotion.round') || 'Round'} ${currentRound + 1} of ${TOTAL_SESSION_ROUNDS}) →`
                      : (t('games.memorymotion.finishSession') || 'View Session Summary →')}
                  </ElderButton>
                </div>
              </motion.div>
            )}

            {/* PHASE 3: SESSION SUMMARY */}
            {gameState === 'summary' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl text-center space-y-6"
              >
                <ConfettiCelebration />

                <div className="w-16 h-16 rounded-3xl bg-teal-600 text-white flex items-center justify-center mx-auto text-3xl shadow-lg">
                  🌟
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                    {t('games.memorymotion.sessionComplete') || 'Session Complete! Wonderful Job!'}
                  </h2>
                  <p className="text-slate-300 text-sm sm:text-base font-semibold">
                    {t('games.memorymotion.sessionEncouragement') || 'You exercised your visual memory, sequence awareness, and reaction focus.'}
                  </p>
                </div>

                {/* Score Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                    <span className="text-xs font-bold text-slate-400 block uppercase">
                      {t('games.score') || 'Accuracy'}
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                      {summaryData?.accuracy ?? 100}%
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                    <span className="text-xs font-bold text-slate-400 block uppercase">
                      {t('games.memorymotion.avgSpeed') || 'Avg Response'}
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-blue-400">
                      {summaryData?.avgResponseTimeMs ? (summaryData.avgResponseTimeMs / 1000).toFixed(1) : '3.2'}s
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                    <span className="text-xs font-bold text-slate-400 block uppercase">
                      {t('games.memorymotion.completedChallenges') || 'Rounds'}
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-white">
                      {TOTAL_SESSION_ROUNDS}/{TOTAL_SESSION_ROUNDS}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                    <span className="text-xs font-bold text-slate-400 block uppercase">
                      {t('games.level') || 'Adapted Level'}
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-teal-400">
                      {currentDifficulty.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* AI Adaptation Status Card */}
                <AiAdaptationCard
                  adaptationData={summaryData?.adaptation}
                  score={summaryData?.accuracy ?? 100}
                  mistakes={TOTAL_SESSION_ROUNDS - (summaryData?.sessionResults?.filter(r => r.correct)?.length || 0)}
                  difficultyLevel={currentDifficulty}
                  className="my-2"
                />

                {/* AI Recommendation Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-blue-950/40 border border-blue-800 text-left space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-black text-blue-300 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span>{t('games.memorymotion.aiNote') || 'SmritiCare Supportive Cognitive Guidance'}</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-200 leading-relaxed">
                    {isGeneratingAi ? (t('common.loading') || 'Synthesizing gentle encouragement...') : aiRecommendation}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <ElderButton
                    variant="orange"
                    size="lg"
                    icon={RotateCcw}
                    onClick={handleRestartSession}
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
              </motion.div>
            )}

          </div>

          {/* ================================================================= */}
          {/* RIGHT SIDEBAR COLUMN (Step Indicators, Memory Tip, Action Button)  */}
          {/* ================================================================= */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* 3-Step Progress Card matching Reference Design */}
            <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-5">
              
              {/* STEP 1: Watch the Video */}
              <div className="space-y-3">
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    activeStep === 1
                      ? 'bg-emerald-950 text-emerald-400 ring-2 ring-emerald-500 shadow-emerald-500/20'
                      : activeStep > 1
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {activeStep > 1 ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                      Step 1 of 3
                    </span>
                    <h3 className={`text-base sm:text-lg font-black ${activeStep === 1 ? 'text-white' : 'text-slate-300'}`}>
                      {t('games.memorymotion.step1Title') || 'Watch the Video'}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5 leading-relaxed">
                      {t('games.memorymotion.step1Desc') || 'A short everyday scenario will play. Pay attention to the details.'}
                    </p>
                  </div>
                </div>

                {/* Tip Box inside Step 1 */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <span>💡</span>
                    <span>{t('games.memorymotion.tipTitle') || 'Tip'}:</span>
                  </div>
                  <p className="text-slate-300 font-medium leading-relaxed">
                    {t('games.memorymotion.tipText') || 'Try to remember the people, objects, colors, and order of actions.'}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-800/80" />

              {/* STEP 2: Answer Questions */}
              <div className="flex items-start gap-3.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                  activeStep === 2
                    ? 'bg-blue-950 text-blue-400 ring-2 ring-blue-500'
                    : activeStep > 2
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {activeStep > 2 ? <CheckCircle2 className="w-5 h-5" /> : '2'}
                </div>

                <div>
                  <h3 className={`text-base font-black ${activeStep === 2 ? 'text-white' : 'text-slate-400'}`}>
                    {t('games.memorymotion.step2Title') || 'Answer Questions'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {t('games.memorymotion.step2Desc') || 'You will be asked a few questions about what you saw.'}
                  </p>
                </div>
              </div>

              {/* STEP 3: See Your Result */}
              <div className="flex items-start gap-3.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                  activeStep === 3
                    ? 'bg-teal-950 text-teal-400 ring-2 ring-teal-500'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  3
                </div>

                <div>
                  <h3 className={`text-base font-black ${activeStep === 3 ? 'text-white' : 'text-slate-400'}`}>
                    {t('games.memorymotion.step3Title') || 'See Your Result'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {t('games.memorymotion.step3Desc') || 'Check your score and see how you did!'}
                  </p>
                </div>
              </div>

              {/* Primary Action Button (Continue to Questions) */}
              {activeStep === 1 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleProceedToQuestions}
                    className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-base transition-all transform active:scale-[0.99] shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{t('games.memorymotion.continueToQuestions') || 'Continue to Questions →'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Supportive Encouragement Card */}
            <div className="bg-slate-900/90 rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-md flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 fill-current" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">
                  {t('games.memorymotion.youAreDoingGreat') || "You're Doing Great!"}
                </h4>
                <p className="text-xs text-slate-400 font-medium">
                  {t('games.memorymotion.smallSteps') || 'Small steps make a big difference 🌿'}
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
