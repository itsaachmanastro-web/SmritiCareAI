import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, ArrowLeft, CheckCircle2, Sparkles, Clock, Brain } from 'lucide-react';
import ElderButton from '../../../components/common/ElderButton';
import ConfettiCelebration from '../../../components/common/ConfettiCelebration';
import VoicePromptCard from '../../../components/common/VoicePromptCard';
import { playMatchSuccessSound, playCardFlipSound, playTokaBambooSound } from '../../../audio/synthAudio';
import { saveGameSession } from '../../../db/syncService';
import { getNextActivity } from '../../../services/nextActivityService';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import {
  getGameDifficulty,
  recordChallengeResult,
  generateRoutineChallenge,
  scoreToDiscreteLevel
} from '../../../services/games';

export default function TeaGardenRoutineGame() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const storedUserId = (typeof window !== 'undefined' && window.localStorage)
    ? window.localStorage.getItem('smriti_user_id')
    : null;
  const currentUserId = currentUser?.id || (storedUserId ? Number(storedUserId) : null);

  const handleNextActivity = async () => {
    try {
      const nextAct = await getNextActivity({
        userId: currentUserId,
        currentGameId: 'teagarden',
        currentDomain: 'routine'
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
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [availableCards, setAvailableCards] = useState([]);
  const [placedSlots, setPlacedSlots] = useState([]);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch continuous difficulty from Adaptive Engine
  useEffect(() => {
    async function loadAdaptive() {
      if (!currentUserId) return;
      try {
        const diffData = await getGameDifficulty(currentUserId, 'sequenceMemory');
        setContinuousDiff(diffData.continuous);
        setDifficulty(diffData.discrete);
      } catch (err) {
        console.warn('Could not load adaptive sequence difficulty:', err);
      }
    }
    loadAdaptive();
  }, [currentUserId]);

  useEffect(() => {
    let interval = null;
    if (gameState === 'playing') {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  const startGame = () => {
    // Generate multi-scenario procedural routine challenge
    const challenge = generateRoutineChallenge({
      difficulty,
      seed: `${currentUserId}_routine_${Date.now()}`,
      userId: currentUserId
    });

    setCurrentChallenge(challenge);
    setAvailableCards(challenge.shuffledCards);
    setPlacedSlots([]);
    setMistakes(0);
    setTimerSeconds(0);
    setErrorMessage('');
    setAdaptiveSupport('');
    setGameState('playing');
  };

  const handleCardSelect = async (card) => {
    playCardFlipSound();
    setErrorMessage('');

    // Check if this is the correct next step in order
    const nextExpectedStep = placedSlots.length + 1;

    if (card.step === nextExpectedStep) {
      // Correct step placed!
      playTokaBambooSound();
      const newPlaced = [...placedSlots, card];
      const newAvailable = availableCards.filter((c) => c.id !== card.id);

      setPlacedSlots(newPlaced);
      setAvailableCards(newAvailable);

      // Check if finished
      const totalSteps = currentChallenge?.stepCount || (difficulty === 'easy' ? 4 : 5);
      if (newPlaced.length === totalSteps) {
        playMatchSuccessSound();
        const finalScore = Math.max(50, 100 - mistakes * 10);

        // Record in Adaptive Difficulty Engine
        try {
          const result = await recordChallengeResult({
            userId: currentUserId,
            sessionId: `session_${currentUserId}_${Date.now()}`,
            gameType: 'sequenceMemory',
            templateId: currentChallenge?.scenario?.id || 'routine_morning',
            difficultyBefore: continuousDiff,
            questionId: currentChallenge?.questionId,
            contentHash: currentChallenge?.fingerprint,
            correct: finalScore >= 70,
            responseTimeMs: timerSeconds * 1000,
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
              gameName: 'Morning at the Tea Garden',
              gameType: 'routine',
              domain: 'routine',
              score: finalScore,
              difficultyLevel: difficulty,
              durationSeconds: timerSeconds,
              correctCount: totalSteps,
              mistakeCount: mistakes
            });
          } catch (err) {
            console.warn('Could not save game session in Dexie:', err);
          }
        }

        setTimeout(() => setGameState('won'), 600);
      }
    } else {
      // Out of sequence
      setMistakes((m) => {
        const next = m + 1;
        if (next >= 2) {
          setAdaptiveSupport(t('games.adaptive.takeYourTime') || "Take your time, Amma. Think about what naturally comes next 🌸");
        }
        return next;
      });
      setErrorMessage(`Hint: What naturally happens next after Step ${placedSlots.length || 0}? Take your time.`);
    }
  };

  const scenarioTitle = currentChallenge?.scenario?.title || t('games.teagarden.title');
  const scenarioDesc = currentChallenge?.scenario?.description || t('games.teagarden.desc');

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
              <Clock className="w-5 h-5 text-smriti-teal-600 dark:text-teal-400" />
              <span>{timerSeconds}s</span>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-white dark:bg-[#131D33] border border-slate-200 dark:border-[#243352] font-bold text-amber-700 dark:text-amber-400 shadow-xs">
              {t('games.mistakes')}: {mistakes}
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
          <div className="w-20 h-20 mx-auto rounded-3xl bg-teal-50 dark:bg-teal-950/50 border-2 border-teal-200 dark:border-teal-700/60 flex items-center justify-center text-4xl mb-4">
            🍵
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white font-display">
            {scenarioTitle}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 font-medium max-w-xl mx-auto mt-2">
            {scenarioDesc}
          </p>

          <VoicePromptCard
            className="my-6 max-w-lg mx-auto"
            text={t('games.teagarden.instructions')}
            autoSpeak={true}
          />

          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-[#243352] text-slate-700 dark:text-slate-300 text-sm font-bold mb-8">
            <Brain className="w-4 h-4 text-smriti-teal-600 dark:text-teal-400" />
            <span>{t('games.level')}:</span>
            <span className="uppercase text-smriti-teal-700 dark:text-teal-300 font-extrabold">{difficulty}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({difficulty === 'easy' ? '4 Steps' : difficulty === 'hard' ? '6 Steps' : '5 Steps'})
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
          {/* Supportive feedback */}
          {adaptiveSupport && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto p-3 rounded-2xl bg-teal-50 dark:bg-[#1E293B] border border-teal-200 dark:border-teal-800 text-center text-sm font-semibold text-teal-900 dark:text-teal-200 shadow-xs"
            >
              {adaptiveSupport}
            </motion.div>
          )}

          {/* Completed Timeline Slots */}
          <div className="bg-white dark:bg-[#131D33] rounded-3xl p-5 md:p-7 border-2 border-smriti-teal-200 dark:border-teal-800/80 shadow-sm">
            <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              {scenarioTitle}
            </h3>

            <div className="space-y-3">
              {placedSlots.length === 0 ? (
                <div className="p-6 border-2 border-dashed border-slate-200 dark:border-[#243352] rounded-2xl text-center text-slate-400 dark:text-slate-500 font-bold text-lg">
                  {t('games.teagarden.stepOrderPrompt')} ☀️
                </div>
              ) : (
                placedSlots.map((card, i) => (
                  <motion.div
                    key={card.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 ${card.bgColor} shadow-sm`}
                  >
                    <span className="w-9 h-9 rounded-full bg-white dark:bg-[#1E293B] flex items-center justify-center font-black text-slate-800 dark:text-slate-200 shadow-xs">
                      {i + 1}
                    </span>
                    <span className="text-3xl">{card.emoji}</span>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">{card.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{card.assamese || card.subtitle}</p>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </motion.div>
                ))
              )}
            </div>

            {errorMessage && (
              <p className="text-amber-700 dark:text-amber-300 font-bold text-sm mt-3 bg-amber-50 dark:bg-amber-950/60 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/60">
                ⚠️ {errorMessage}
              </p>
            )}
          </div>

          {/* Cards to choose from */}
          <div className="bg-white dark:bg-[#131D33] rounded-3xl p-5 md:p-7 border border-slate-200 dark:border-[#243352] shadow-md">
            <h4 className="text-base font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">
              {t('games.teagarden.stepOrderPrompt')}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {availableCards.map((card) => (
                <motion.button
                  key={card.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleCardSelect(card)}
                  className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-200 dark:border-[#243352] hover:border-smriti-teal-500 bg-slate-50 dark:bg-[#1E293B] hover:bg-teal-50/50 dark:hover:bg-[#25334D] text-left transition-all min-h-[70px] cursor-pointer"
                >
                  <span className="text-3xl p-2 bg-white dark:bg-[#131D33] rounded-xl shadow-xs border border-slate-100 dark:border-[#243352]">
                    {card.emoji}
                  </span>
                  <div>
                    <h5 className="font-extrabold text-slate-800 dark:text-white text-base md:text-lg leading-snug">
                      {card.title.replace(/^\d+\.\s*/, '')}
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{card.assamese || card.subtitle}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. WON SCREEN */}
      {gameState === 'won' && (
        <ConfettiCelebration
          title={t('games.wellDone')}
          subtitle={adaptiveSupport || scenarioDesc}
          score={Math.max(60, 100 - mistakes * 10)}
          stars={mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1}
          timeTaken={timerSeconds}
          mistakes={mistakes}
          onPlayAgain={startGame}
          onNext={handleNextActivity}
          gameName="Morning at the Tea Garden"
        />
      )}
    </div>
  );
}
