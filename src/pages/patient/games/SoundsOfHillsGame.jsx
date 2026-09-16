import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, ArrowLeft, Volume2, Sparkles, Brain, Clock, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import ElderButton from '../../../components/common/ElderButton';
import ConfettiCelebration from '../../../components/common/ConfettiCelebration';
import VoicePromptCard from '../../../components/common/VoicePromptCard';
import { PepaIcon, DholIcon, HornbillIcon, BambooIcon } from '../../../components/common/NerIcons';
import {
  playPepaSound,
  playDholSound,
  playTokaBambooSound,
  playBirdCallSound,
  playMatchSuccessSound,
  playCardFlipSound
} from '../../../audio/synthAudio';
import { saveGameSession } from '../../../db/syncService';
import { getNextActivity } from '../../../services/nextActivityService';
import { useSpeech } from '../../../context/SpeechContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import {
  getGameDifficulty,
  recordChallengeResult,
  generateSoundsOfHillsSession,
  scoreToDiscreteLevel
} from '../../../services/games';

const INSTRUMENT_ICONS = {
  pepa: PepaIcon,
  dhol: DholIcon,
  toka: BambooIcon,
  hornbill: HornbillIcon
};

const INSTRUMENT_SOUNDS = {
  pepa: playPepaSound,
  dhol: playDholSound,
  toka: playTokaBambooSound,
  hornbill: playBirdCallSound
};

export default function SoundsOfHillsGame() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { speak } = useSpeech();

  const storedUserId = (typeof window !== 'undefined' && window.localStorage)
    ? window.localStorage.getItem('smriti_user_id')
    : null;
  const currentUserId = currentUser?.id || (storedUserId ? Number(storedUserId) : null);

  const handleNextActivity = async () => {
    try {
      const nextAct = await getNextActivity({
        userId: currentUserId,
        currentGameId: 'soundshills',
        currentDomain: 'attention'
      });
      if (nextAct?.path) {
        navigate(nextAct.path);
      } else {
        navigate('/patient/games');
      }
    } catch (err) {
      console.warn('Next activity transition fallback:', err);
      navigate('/patient/games');
    }
  };

  const [gameState, setGameState] = useState('intro'); // 'intro', 'playing', 'won'
  const [difficulty, setDifficulty] = useState('medium');
  const [continuousDiff, setContinuousDiff] = useState(0.50);
  const [adaptiveSupport, setAdaptiveSupport] = useState('');
  const [sessionRounds, setSessionRounds] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [roundsTotal] = useState(4);
  const [targetItem, setTargetItem] = useState(null);
  const [displayOptions, setDisplayOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [startTime, setStartTime] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const roundTimerRef = useRef(null);

  // Fetch continuous difficulty from Adaptive Engine
  useEffect(() => {
    async function loadAdaptive() {
      if (!currentUserId) return;
      try {
        const diffData = await getGameDifficulty(currentUserId, 'auditoryAttention');
        setContinuousDiff(diffData.continuous);
        setDifficulty(diffData.discrete);
      } catch (err) {
        console.warn('Could not load auditory difficulty:', err);
      }
    }
    loadAdaptive();
  }, [currentUserId]);

  // Start round
  const setupRound = (roundIdx, roundsArray = sessionRounds) => {
    const roundData = roundsArray[roundIdx];
    if (!roundData) return;

    setTargetItem(roundData.target);
    setDisplayOptions(roundData.displayOptions);
    setTimeLeft(15); // Comfortable leisurely elderly window
    setFeedback(null);

    // Play target instrument sound + voice announcement
    setTimeout(() => {
      const soundFn = INSTRUMENT_SOUNDS[roundData.target.id] || roundData.target.soundFn;
      if (typeof soundFn === 'function') {
        try { soundFn(); } catch (e) { console.warn(e); }
      }
      speak(roundData.target.prompt);
    }, 450);
  };

  const startGame = () => {
    // Generate procedural acoustic session with zero hardcoded orders
    const generatedRounds = generateSoundsOfHillsSession({
      difficulty,
      seed: `${currentUserId}_sound_${Date.now()}`,
      roundsTotal
    });

    setSessionRounds(generatedRounds);
    setCurrentRound(0);
    setScore(0);
    setMistakes(0);
    setStartTime(Date.now());
    setAdaptiveSupport('');
    setGameState('playing');
    setupRound(0, generatedRounds);
  };

  // Replay current sound on demand
  const handleReplaySound = () => {
    if (targetItem) {
      const soundFn = INSTRUMENT_SOUNDS[targetItem.id] || targetItem.soundFn;
      if (typeof soundFn === 'function') {
        try { soundFn(); } catch (e) { console.warn(e); }
      }
      speak(targetItem.prompt);
    }
  };

  // Comfortable countdown timer for each round
  useEffect(() => {
    if (gameState !== 'playing' || feedback !== null) return;

    roundTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(roundTimerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(roundTimerRef.current);
  }, [gameState, currentRound, feedback]);

  const handleTimeout = () => {
    playCardFlipSound();
    setMistakes((m) => m + 1);
    setFeedback({ correct: false, reason: 'Take your time! Tap the speaker to listen once more.' });
    advanceAfterDelay(false);
  };

  const handleSelectOption = (item) => {
    if (feedback !== null) return;
    clearInterval(roundTimerRef.current);

    item.soundFn();

    const isCorrect = item.id === targetItem.id;

    if (isCorrect) {
      playMatchSuccessSound();
      setScore((s) => s + 25);
      setFeedback({ correct: true, reason: 'Splendid focus! That is the right instrument.' });
    } else {
      setMistakes((m) => {
        const next = m + 1;
        if (next >= 2) {
          setAdaptiveSupport(t('games.adaptive.simplerChallenge') || "Listen gently to the rhythm. Take all the time you need 🌸");
        }
        return next;
      });
      setFeedback({ correct: false, reason: `That was the ${item.name}. Listen closely for the next one!` });
    }

    advanceAfterDelay(isCorrect);
  };

  const advanceAfterDelay = (isCorrect) => {
    setTimeout(async () => {
      if (currentRound + 1 < roundsTotal) {
        const nextRound = currentRound + 1;
        setCurrentRound(nextRound);
        setupRound(nextRound);
      } else {
        // End game
        const totalDuration = Math.round((Date.now() - startTime) / 1000);
        const finalScore = Math.max(50, Math.min(100, Math.round(((score + (isCorrect ? 25 : 0)) / 100) * 100)));

        const activeRound = sessionRounds[currentRound];

        // Record in Adaptive Difficulty Engine
        try {
          const result = await recordChallengeResult({
            userId: currentUserId,
            sessionId: `session_${currentUserId}_${Date.now()}`,
            gameType: 'auditoryAttention',
            templateId: `sound_${difficulty}`,
            difficultyBefore: continuousDiff,
            questionId: activeRound?.questionId,
            contentHash: activeRound?.fingerprint,
            correct: finalScore >= 75,
            responseTimeMs: totalDuration * 1000,
            score: finalScore
          });

          if (result) {
            setContinuousDiff(result.newDifficulty);
            setDifficulty(result.discreteLevel);
            if (result.encouragementMessage) {
              setAdaptiveSupport(result.encouragementMessage);
            }
          }
        } catch (err) {
          console.warn('Could not record challenge in adaptive engine:', err);
        }

        // Backward compatibility: Save to Dexie gameSessions
        if (currentUserId) {
          try {
            await saveGameSession({
              userId: currentUserId,
              patientId: currentUserId,
              gameName: 'Sounds of the Hills',
              gameType: 'attention',
              domain: 'attention',
              score: finalScore,
              difficultyLevel: difficulty,
              durationSeconds: totalDuration,
              correctCount: roundsTotal - mistakes - (isCorrect ? 0 : 1),
              mistakeCount: mistakes + (isCorrect ? 0 : 1)
            });
          } catch (err) {
            console.warn('Could not save game session in Dexie:', err);
          }
        }

        setGameState('won');
      }
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      {/* Top Controls */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={() => navigate('/patient/home')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-[#131D33] hover:bg-slate-100 dark:hover:bg-[#1E293B] border border-slate-200 dark:border-[#243352] text-slate-700 dark:text-slate-200 font-bold text-base md:text-lg min-h-[48px] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('common.back')}</span>
        </button>

        {gameState === 'playing' && (
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-white dark:bg-[#131D33] border border-slate-200 dark:border-[#243352] flex items-center gap-2 font-bold text-slate-800 dark:text-white shadow-xs">
              <Clock className="w-5 h-5 text-smriti-orange-600 dark:text-amber-400" />
              <span>{timeLeft}s</span>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-white dark:bg-[#131D33] border border-slate-200 dark:border-[#243352] font-bold text-amber-700 dark:text-amber-400 shadow-xs">
              {t('games.score')}: {score}
            </div>
          </div>
        )}
      </div>

      {/* 1. INTRO SCREEN */}
      {gameState === 'intro' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-[#131D33] rounded-3xl md:rounded-4xl p-6 md:p-10 border border-slate-200 dark:border-[#243352] shadow-xl text-center"
        >
          <div className="w-20 h-20 mx-auto rounded-3xl bg-orange-50 dark:bg-orange-950/40 border-2 border-orange-200 dark:border-orange-800/60 flex items-center justify-center text-4xl mb-4">
            🎺
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white font-display">
            {t('games.soundshills.title')}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 font-medium max-w-xl mx-auto mt-2">
            {t('games.soundshills.desc')}
          </p>

          <VoicePromptCard
            className="my-6 max-w-lg mx-auto"
            text={t('games.soundshills.instructions')}
            autoSpeak={true}
          />

          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-[#243352] text-slate-700 dark:text-slate-300 text-sm font-bold mb-8">
            <Brain className="w-4 h-4 text-smriti-teal-600 dark:text-smriti-teal-400" />
            <span>{t('games.level')}:</span>
            <span className="uppercase text-smriti-teal-700 dark:text-smriti-teal-300 font-extrabold">{difficulty}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({difficulty === 'easy' ? '2 Options • Focused' : '4 Options • Rich Soundscape'})
            </span>
            <span className="ml-1 text-[11px] bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 px-2 py-0.5 rounded-full uppercase tracking-wider font-black">
              {t('games.adaptive.badge') || 'Adaptive'}
            </span>
          </div>

          <div>
            <ElderButton
              variant="orange"
              size="xl"
              icon={Play}
              onClick={startGame}
            >
              {t('games.playNow')}
            </ElderButton>
          </div>
        </motion.div>
      )}

      {/* 2. PLAYING SCREEN */}
      {gameState === 'playing' && (
        <div className="space-y-6">
          {/* Supportive in-game feedback if user struggles */}
          {adaptiveSupport && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto p-3 rounded-2xl bg-orange-50 dark:bg-[#1E293B] border border-orange-200 dark:border-amber-800 text-center text-sm font-semibold text-orange-900 dark:text-amber-200 shadow-xs"
            >
              {adaptiveSupport}
            </motion.div>
          )}

          {/* Sound listening prompt with Replay button */}
          <div className="bg-white dark:bg-[#131D33] rounded-3xl p-6 md:p-8 border-4 border-orange-200 dark:border-orange-800/80 shadow-lg text-center">
            <span className="text-xs font-bold text-orange-900 dark:text-amber-300 uppercase tracking-wider bg-orange-100 dark:bg-orange-950 px-3 py-1 rounded-full">
              Round {currentRound + 1} of {roundsTotal}
            </span>

            <div className="my-6 flex flex-col items-center">
              <button
                type="button"
                onClick={handleReplaySound}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer animate-pulse"
                title="Tap to listen again"
                aria-label="Tap to listen again"
              >
                <Volume2 className="w-12 h-12" />
              </button>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-3">
                Tap the speaker to listen again
              </p>
            </div>

            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-2xl font-bold text-sm sm:text-base inline-flex items-center gap-2 ${
                  feedback.correct
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300'
                    : 'bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300'
                }`}
              >
                {feedback.correct ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                <span>{feedback.reason}</span>
              </motion.div>
            )}
          </div>

          {/* Picture options */}
          <div className="bg-white dark:bg-[#131D33] rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-[#243352] shadow-md text-center">
            <h3 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white mb-6">
              {t('games.soundshills.playingPrompt')}
            </h3>

            <div className={`grid gap-4 max-w-2xl mx-auto ${displayOptions.length === 2 ? 'grid-cols-2 max-w-lg' : 'grid-cols-2 sm:grid-cols-4'}`}>
              {displayOptions.map((item) => {
                const IconComp = INSTRUMENT_ICONS[item.id] || item.icon || Volume2;
                return (
                  <motion.button
                    key={item.id}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => handleSelectOption(item)}
                    disabled={feedback !== null}
                    className="p-4 rounded-3xl border-3 border-slate-200 dark:border-[#243352] hover:border-orange-500 bg-slate-50 dark:bg-[#1E293B] hover:bg-orange-50/40 dark:hover:bg-[#25334D] flex flex-col items-center justify-center min-h-[120px] transition-all cursor-pointer shadow-xs"
                  >
                    <IconComp className="w-14 h-14 md:w-16 md:h-16" />
                    <span className="text-sm font-black text-slate-800 dark:text-white mt-2 leading-tight">
                      {item.name.split(' (')[0]}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.assamese}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. WON SCREEN */}
      {gameState === 'won' && (
        <ConfettiCelebration
          title={t('games.wellDone')}
          subtitle={adaptiveSupport || t('games.soundshills.desc')}
          score={score}
          stars={score >= 75 ? 3 : score >= 50 ? 2 : 1}
          timeTaken={15}
          mistakes={mistakes}
          onPlayAgain={startGame}
          onNext={handleNextActivity}
          gameName="Sounds of the Hills"
        />
      )}
    </div>
  );
}
