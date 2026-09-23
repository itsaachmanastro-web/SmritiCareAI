import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, ArrowLeft, Volume2, Sparkles, Brain, Clock, ShieldAlert, Eye } from 'lucide-react';
import ElderButton from '../../../components/common/ElderButton';
import ConfettiCelebration from '../../../components/common/ConfettiCelebration';
import VoicePromptCard from '../../../components/common/VoicePromptCard';
import {
  GamosaIcon,
  JaapiIcon,
  XoraiIcon,
  PepaIcon,
  RhinoIcon,
  HornbillIcon,
  BambooIcon,
  TeaLeafIcon,
  DholIcon
} from '../../../components/common/NerIcons';
import { playCardFlipSound, playMatchSuccessSound } from '../../../audio/synthAudio';
import { saveGameSession } from '../../../db/syncService';
import { getNextActivity } from '../../../services/nextActivityService';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import {
  getGameDifficulty,
  recordChallengeResult,
  generateBihuMemoryChallenge,
  scoreToDiscreteLevel
} from '../../../services/games';

const ICON_COMPONENTS = {
  gamosa: GamosaIcon,
  jaapi: JaapiIcon,
  xorai: XoraiIcon,
  pepa: PepaIcon,
  dhol: DholIcon,
  bamboo: BambooIcon,
  rhino: RhinoIcon,
  hornbill: HornbillIcon,
  tealeaf: TeaLeafIcon,
  bamboo_grove: BambooIcon,
  kopou_flower: GamosaIcon,
  river_stream: XoraiIcon,
  muga_silk: GamosaIcon,
  brass_bell: XoraiIcon,
  clay_lamp: JaapiIcon,
  majuli_mask: RhinoIcon,
  tamul_paan: TeaLeafIcon,
  weave_shuttle: PepaIcon
};

export default function BihuMemoryGame() {
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
        currentGameId: 'bihu',
        currentDomain: 'memory'
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
  const [difficulty, setDifficulty] = useState('medium'); // 'easy' (4 pairs), 'medium' (6 pairs), 'hard' (8 pairs)
  const [continuousDiff, setContinuousDiff] = useState(0.50);
  const [adaptiveSupport, setAdaptiveSupport] = useState('');
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [consecutiveMistakes, setConsecutiveMistakes] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [finalScore, setFinalScore] = useState(100);
  const [adaptationData, setAdaptationData] = useState(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewCount, setPreviewCount] = useState(0);

  const previewTimerRef = useRef(null);

  // 1. Fetch real continuous difficulty from AdaptiveDifficultyEngine
  useEffect(() => {
    async function loadAdaptiveProfile() {
      if (!currentUserId) return;
      try {
        const diffData = await getGameDifficulty(currentUserId, 'memoryMatch');
        setContinuousDiff(diffData.continuous);
        setDifficulty(diffData.discrete);
      } catch (err) {
        console.warn('Could not load adaptive difficulty:', err);
      }
    }
    loadAdaptiveProfile();
  }, [currentUserId]);

  // Timer while playing
  useEffect(() => {
    let interval = null;
    if (gameState === 'playing' && !isPreviewing) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, isPreviewing]);

  // Cleanup preview timers
  useEffect(() => {
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, []);

  // Setup game board based on procedural generator and adaptive difficulty
  const startNewGame = (chosenDiff = difficulty) => {
    setDifficulty(chosenDiff);
    const challenge = generateBihuMemoryChallenge({
      difficulty: chosenDiff,
      userId: currentUserId,
      seed: `${currentUserId}_bihu_${Date.now()}`
    });

    setCurrentChallenge(challenge);
    setCards(challenge.cards);
    setFlippedIndices([]);
    setMatchedIds([]);
    setMistakes(0);
    setConsecutiveMistakes(0);
    setTimerSeconds(0);
    setAdaptiveSupport('');
    setGameState('playing');

    // Initial card preview (gentle memory priming for elders)
    if (challenge.previewSeconds > 0) {
      setIsPreviewing(true);
      setPreviewCount(Math.ceil(challenge.previewSeconds));

      const startTime = Date.now();
      const previewDurationMs = challenge.previewSeconds * 1000;

      const countdownInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, Math.ceil((previewDurationMs - elapsed) / 1000));
        setPreviewCount(remaining);
        if (remaining <= 0) {
          clearInterval(countdownInterval);
        }
      }, 500);

      previewTimerRef.current = setTimeout(() => {
        setIsPreviewing(false);
        clearInterval(countdownInterval);
      }, previewDurationMs);
    } else {
      setIsPreviewing(false);
    }
  };

  const handleCardClick = (index) => {
    if (isPreviewing) return;
    if (flippedIndices.length === 2 || flippedIndices.includes(index) || matchedIds.includes(cards[index].iconKey)) {
      return;
    }

    playCardFlipSound();
    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      const firstCard = cards[newFlipped[0]];
      const secondCard = cards[newFlipped[1]];

      if (firstCard.iconKey === secondCard.iconKey) {
        // Matched!
        setTimeout(() => {
          playMatchSuccessSound();
          const newMatched = [...matchedIds, firstCard.iconKey];
          setMatchedIds(newMatched);
          setFlippedIndices([]);
          setConsecutiveMistakes(0);

          // Check if won
          const targetPairs = currentChallenge?.pairCount || (difficulty === 'easy' ? 4 : difficulty === 'hard' ? 8 : 6);
          if (newMatched.length === targetPairs) {
            handleVictory(mistakes, timerSeconds);
          }
        }, 400);
      } else {
        // Not a match
        setTimeout(() => {
          setMistakes((prev) => prev + 1);
          setConsecutiveMistakes((prev) => {
            const next = prev + 1;
            if (next >= 3) {
              setAdaptiveSupport(t('games.adaptive.takeYourTime') || 'Take your time, Amma. There is no rush 🌸');
            }
            return next;
          });
          setFlippedIndices([]);
        }, 1100);
      }
    }
  };

  const handleVictory = async (finalMistakes, duration) => {
    const targetPairs = currentChallenge?.pairCount || (difficulty === 'easy' ? 4 : difficulty === 'hard' ? 8 : 6);
    // Base 100 minus mistakes penalty (comfortably weighted)
    const penalty = finalMistakes * 5 + Math.floor(duration / 15) * 2;
    const computedScore = Math.max(50, Math.min(100, 100 - penalty));
    setFinalScore(computedScore);

    // 1. Record challenge in Adaptive Engine & update profile
    try {
      const result = await recordChallengeResult({
        userId: currentUserId,
        sessionId: `session_${currentUserId}_${Date.now()}`,
        gameType: 'memoryMatch',
        templateId: `bihu_${difficulty}`,
        difficultyBefore: continuousDiff,
        questionId: currentChallenge?.questionId,
        contentHash: currentChallenge?.fingerprint,
        correct: true,
        responseTimeMs: duration * 1000,
        score: computedScore
      });

      if (result) {
        setContinuousDiff(result.newDifficulty);
        setDifficulty(result.discreteLevel);
        if (result.adaptation) {
          setAdaptationData(result.adaptation);
        }
        if (result.encouragementMessage) {
          setAdaptiveSupport(result.encouragementMessage);
        }
      }
    } catch (err) {
      console.warn('Could not record challenge result in adaptive engine:', err);
    }

    // 2. Backward compatibility: Save to Dexie gameSessions & award economy credits
    if (currentUserId) {
      try {
        await saveGameSession({
          userId: currentUserId,
          patientId: currentUserId,
          gameName: 'Bihu Memory Bihu',
          gameType: 'memory',
          domain: 'memory',
          score: computedScore,
          difficultyLevel: difficulty,
          durationSeconds: duration,
          correctCount: targetPairs,
          mistakeCount: finalMistakes
        });
      } catch (err) {
        console.warn('Could not save game session in Dexie:', err);
      }
    }

    setGameState('won');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      {/* Top Breadcrumb & Controls */}
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
          <div className="w-20 h-20 mx-auto rounded-3xl bg-teal-50 dark:bg-teal-950/60 border-2 border-teal-200 dark:border-teal-700 flex items-center justify-center text-4xl mb-4">
            🥁
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white font-display">
            {t('games.bihu.title')}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 font-medium max-w-xl mx-auto mt-2">
            {t('games.bihu.desc')}
          </p>

          <VoicePromptCard
            className="my-6 max-w-lg mx-auto"
            text={t('games.bihu.instructions')}
            subtext={t('games.bihu.matchAllPrompt', { total: difficulty === 'easy' ? 4 : difficulty === 'hard' ? 8 : 6 })}
            autoSpeak={true}
          />

          {/* Adaptive Difficulty Level Indicator */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-[#243352] text-slate-700 dark:text-slate-200 text-sm font-bold mb-8">
            <Brain className="w-4 h-4 text-smriti-teal-600 dark:text-teal-400" />
            <span>{t('games.level')}:</span>
            <span className="uppercase text-smriti-teal-700 dark:text-teal-400 font-extrabold">{difficulty}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({difficulty === 'easy' ? '4 pairs • 8 cards' : difficulty === 'hard' ? '8 pairs • 16 cards' : '6 pairs • 12 cards'})
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
              onClick={() => startNewGame(difficulty)}
            >
              {t('games.playNow')}
            </ElderButton>
          </div>
        </motion.div>
      )}

      {/* 2. PLAYING BOARD */}
      {gameState === 'playing' && (
        <div>
          {/* Header Status with Preview Alert */}
          <div className="mb-4 text-center">
            {isPreviewing ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300 font-bold text-sm sm:text-base animate-pulse">
                <Eye className="w-5 h-5 text-amber-600" />
                <span>Memorize the cards! ({previewCount}s)</span>
              </div>
            ) : (
              <span className="text-lg font-extrabold text-slate-800 dark:text-white">
                {matchedIds.length} / {currentChallenge?.pairCount || (difficulty === 'easy' ? 4 : difficulty === 'hard' ? 8 : 6)}
              </span>
            )}
          </div>

          {/* Supportive in-game feedback if user is struggling */}
          {adaptiveSupport && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 max-w-md mx-auto p-3 rounded-2xl bg-teal-50 dark:bg-[#1E293B] border border-teal-200 dark:border-teal-800/80 text-center text-sm font-semibold text-teal-900 dark:text-teal-200 shadow-xs"
            >
              {adaptiveSupport}
            </motion.div>
          )}

          <div
            className={`grid gap-3 md:gap-4 mx-auto ${
              difficulty === 'easy'
                ? 'grid-cols-2 sm:grid-cols-4 max-w-2xl'
                : difficulty === 'hard'
                ? 'grid-cols-4 max-w-3xl'
                : 'grid-cols-3 sm:grid-cols-4 max-w-3xl'
            }`}
          >
            {cards.map((card, idx) => {
              const isFlipped = isPreviewing || flippedIndices.includes(idx) || matchedIds.includes(card.iconKey);
              const isMatched = matchedIds.includes(card.iconKey);
              const IconComp = ICON_COMPONENTS[card.iconKey] || card.component || Sparkles;

              return (
                <motion.div
                  key={card.uid}
                  whileTap={{ scale: isPreviewing ? 1 : 0.95 }}
                  onClick={() => handleCardClick(idx)}
                  className={`
                    relative aspect-square rounded-2xl md:rounded-3xl cursor-pointer select-none
                    flex flex-col items-center justify-center p-3 border-4 transition-all duration-300
                    min-h-[90px] md:min-h-[120px]
                    ${
                      isMatched
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-600 opacity-90 shadow-sm'
                        : isFlipped
                        ? 'bg-white dark:bg-[#1E293B] border-smriti-teal-500 shadow-lg'
                        : 'bg-gradient-to-br from-teal-700 to-teal-800 border-teal-900 shadow-md hover:brightness-105'
                    }
                  `}
                >
                  {isFlipped ? (
                    <motion.div
                      initial={{ rotateY: 90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      transition={{ duration: 0.25 }}
                      className="flex flex-col items-center justify-center text-center w-full h-full"
                    >
                      {IconComp ? (
                        <IconComp className="w-14 h-14 md:w-18 md:h-18 drop-shadow-md" />
                      ) : (
                        <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-2xl">🌸</div>
                      )}
                      <span className="text-xs md:text-sm font-black text-slate-900 dark:text-white mt-1.5 line-clamp-1">
                        {card.name}
                      </span>
                    </motion.div>
                  ) : (
                    /* Authentic Assamese Woven Motif Card Back */
                    <div className="flex flex-col items-center justify-center relative w-full h-full p-2">
                      <div className="w-full h-full rounded-xl border-2 border-amber-300/40 bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-950 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                        {/* Decorative woven corner motifs */}
                        <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-amber-300/60" />
                        <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-amber-300/60" />
                        <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-amber-300/60" />
                        <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-amber-300/60" />

                        {/* Center Assamese Gamosa Diamond */}
                        <svg className="w-8 h-8 md:w-10 md:h-10 opacity-80" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2 L22 12 L12 22 L2 12 Z" stroke="#FDE047" strokeWidth="2" fill="rgba(234, 88, 12, 0.25)" />
                          <circle cx="12" cy="12" r="3" fill="#FDE047" />
                        </svg>

                        <span className="text-[10px] md:text-xs font-black text-amber-200 uppercase tracking-widest mt-1">
                          বিহু
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. WON CELEBRATION */}
      {gameState === 'won' && (
        <ConfettiCelebration
          title={t('games.wellDone')}
          subtitle={adaptiveSupport || t('games.bihu.foundMatch')}
          score={finalScore}
          stars={finalScore >= 85 ? 3 : finalScore >= 65 ? 2 : 1}
          timeTaken={timerSeconds}
          mistakes={mistakes}
          adaptationData={adaptationData}
          difficultyLevel={difficulty}
          onPlayAgain={() => startNewGame(difficulty)}
          onNext={handleNextActivity}
          gameName="Bihu Memory Pairs"
        />
      )}
    </div>
  );
}
