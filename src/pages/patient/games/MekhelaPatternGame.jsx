import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, ArrowLeft, Brain, HelpCircle, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import ElderButton from '../../../components/common/ElderButton';
import ConfettiCelebration from '../../../components/common/ConfettiCelebration';
import VoicePromptCard from '../../../components/common/VoicePromptCard';
import { playMatchSuccessSound, playCardFlipSound } from '../../../audio/synthAudio';
import { saveGameSession } from '../../../db/syncService';
import { getNextActivity } from '../../../services/nextActivityService';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import {
  getGameDifficulty,
  recordChallengeResult,
  generateMekhelaGameSession,
  scoreToDiscreteLevel
} from '../../../services/games';

// Vector SVG Traditional Weaving Pattern Tiles
function KingkhapDiamond({ className = "w-12 h-12" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="8" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
      <path d="M24 8 L38 24 L24 40 L10 24 Z" fill="#D97706" />
      <circle cx="24" cy="24" r="5" fill="#FEF3C7" />
    </svg>
  );
}

function KesuPeacock({ className = "w-12 h-12" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="8" fill="#FEE2E2" stroke="#DC2626" strokeWidth="2" />
      <circle cx="24" cy="24" r="14" fill="#DC2626" />
      <path d="M24 14 L28 24 L24 34 L20 24 Z" fill="#FFFFFF" />
      <circle cx="24" cy="24" r="3" fill="#DC2626" />
    </svg>
  );
}

function NagaChevron({ className = "w-12 h-12" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="8" fill="#F1F5F9" stroke="#0F172A" strokeWidth="2" />
      <path d="M10 16 L24 28 L38 16" stroke="#DC2626" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 26 L24 38 L38 26" stroke="#0F172A" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MizoLozenge({ className = "w-12 h-12" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="8" fill="#ECFDF5" stroke="#059669" strokeWidth="2" />
      <rect x="12" y="12" width="24" height="24" transform="rotate(45 24 24)" fill="#10B981" />
      <circle cx="24" cy="24" r="4" fill="#F59E0B" />
    </svg>
  );
}

const MOTIFS = [
  { id: 'kingkhap', name: 'Muga Kingkhap (Golden Diamond)', component: KingkhapDiamond },
  { id: 'kesu', name: 'Assam Kesu (Red Motif)', component: KesuPeacock },
  { id: 'naga', name: 'Naga Woven Chevron', component: NagaChevron },
  { id: 'mizo', name: 'Mizo Puan Lozenge', component: MizoLozenge },
];

export default function MekhelaPatternGame() {
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
        currentGameId: 'mekhela',
        currentDomain: 'pattern'
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
  const [currentRound, setCurrentRound] = useState(0);
  const [roundsTotal] = useState(4);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(0);
  const [feedback, setFeedback] = useState(null); // { correct: bool, selectedId }
  const [roundConfigs, setRoundConfigs] = useState([]);

  // Fetch true continuous difficulty
  useEffect(() => {
    async function loadAdaptive() {
      if (!currentUserId) return;
      try {
        const diffData = await getGameDifficulty(currentUserId, 'patternRecognition');
        setContinuousDiff(diffData.continuous);
        setDifficulty(diffData.discrete);
      } catch (err) {
        console.warn('Could not fetch adaptive difficulty:', err);
      }
    }
    loadAdaptive();
  }, [currentUserId]);

  const startGame = () => {
    // Generate procedural non-repeating pattern session
    const configs = generateMekhelaGameSession({
      difficulty,
      seed: `${currentUserId}_mekhela_${Date.now()}`,
      roundsTotal
    });

    setRoundConfigs(configs);
    setCurrentRound(0);
    setScore(0);
    setMistakes(0);
    setStartTime(Date.now());
    setFeedback(null);
    setAdaptiveSupport('');
    setGameState('playing');
  };

  const handlePickOption = async (chosenId) => {
    if (feedback) return; // ignore during feedback delay

    const activeConfig = roundConfigs[currentRound];
    const isCorrect = chosenId === activeConfig.correct;

    if (isCorrect) {
      playMatchSuccessSound();
      setFeedback({ correct: true, selectedId: chosenId });
      setScore((s) => s + 25);
    } else {
      playCardFlipSound();
      setFeedback({ correct: false, selectedId: chosenId });
      setMistakes((m) => {
        const next = m + 1;
        if (next >= 2) {
          setAdaptiveSupport(t('games.adaptive.simplerChallenge') || "Take your time! Look closely at the repeating colors 🌸");
        }
        return next;
      });
    }

    setTimeout(async () => {
      setFeedback(null);
      if (currentRound + 1 < roundsTotal) {
        setCurrentRound((r) => r + 1);
      } else {
        // Completed all rounds
        const totalDuration = Math.round((Date.now() - startTime) / 1000);
        setDuration(totalDuration);

        const computedScore = Math.max(50, Math.min(100, Math.round(((score + (isCorrect ? 25 : 0)) / 100) * 100)));

        // Record in Adaptive Difficulty Engine
        try {
          const result = await recordChallengeResult({
            userId: currentUserId,
            sessionId: `session_${currentUserId}_${Date.now()}`,
            gameType: 'patternRecognition',
            templateId: activeConfig?.ruleId || 'mekhela_pattern',
            difficultyBefore: continuousDiff,
            questionId: activeConfig?.questionId,
            contentHash: activeConfig?.fingerprint,
            correct: computedScore >= 75,
            responseTimeMs: totalDuration * 1000,
            score: computedScore
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
              gameName: 'Mekhela Pattern Match',
              gameType: 'pattern',
              domain: 'pattern',
              score: computedScore,
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

  const activeRoundConfig = roundConfigs[currentRound];
  const currentPattern = activeRoundConfig?.pattern || [];
  const currentOptions = activeRoundConfig?.options || AVAILABLE_MOTIFS;

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
            <div className="px-4 py-2 rounded-2xl bg-white dark:bg-[#131D33] border border-slate-200 dark:border-[#243352] font-bold text-slate-800 dark:text-slate-200 shadow-xs">
              {currentRound + 1} / {roundsTotal}
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
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-4xl mb-4">
            🧵
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white font-display">
            {t('games.mekhela.title')}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 font-medium max-w-xl mx-auto mt-2">
            {t('games.mekhela.desc')}
          </p>

          <VoicePromptCard
            className="my-6 max-w-lg mx-auto"
            text={t('games.mekhela.instructions')}
            autoSpeak={true}
          />

          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-[#243352] text-slate-700 dark:text-slate-300 text-sm font-bold mb-8">
            <Brain className="w-4 h-4 text-smriti-teal-600 dark:text-smriti-teal-400" />
            <span>{t('games.level')}:</span>
            <span className="uppercase text-smriti-teal-700 dark:text-smriti-teal-300 font-extrabold">{difficulty}</span>
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
        <div className="space-y-8">
          {/* Supportive in-game feedback if user struggles */}
          {adaptiveSupport && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto p-3 rounded-2xl bg-amber-50 dark:bg-[#1E293B] border border-amber-200 dark:border-amber-800 text-center text-sm font-semibold text-amber-900 dark:text-amber-200 shadow-xs"
            >
              {adaptiveSupport}
            </motion.div>
          )}

          {/* Weaving Border Strip Card */}
          <div className="bg-white dark:bg-[#131D33] rounded-3xl p-6 md:p-8 border-4 border-amber-200 dark:border-amber-800/80 shadow-lg text-center">
            <div className="inline-flex items-center gap-2">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider bg-amber-100 dark:bg-amber-950 px-3 py-1 rounded-full">
                {activeRoundConfig?.ruleName || t('games.mekhela.title')}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-5 mt-6 py-4 bg-amber-50/50 dark:bg-[#0E172A] rounded-2xl border border-amber-200/60 dark:border-amber-900/50">
              {currentPattern.map((motifKey, i) => {
                if (motifKey === null) {
                  return (
                    <motion.div
                      key="missing-slot"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-dashed border-amber-500 dark:border-amber-500/80 bg-amber-100 dark:bg-amber-950/60 flex flex-col items-center justify-center shadow-inner"
                    >
                      <HelpCircle className="w-10 h-10 text-amber-700 dark:text-amber-400" />
                      <span className="text-xs font-extrabold text-amber-800 dark:text-amber-300 mt-1">?</span>
                    </motion.div>
                  );
                }

                const motifObj = MOTIFS.find((m) => m.id === motifKey);
                const Comp = motifObj ? motifObj.component : KingkhapDiamond;

                return (
                  <div
                    key={i}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white dark:bg-[#1E293B] border-2 border-slate-200 dark:border-[#243352] flex items-center justify-center shadow-sm"
                  >
                    <Comp className="w-14 h-14 md:w-16 md:h-16" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Options to Choose From */}
          <div className="bg-white dark:bg-[#131D33] rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-[#243352] shadow-md text-center">
            <h3 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white mb-6">
              {t('games.mekhela.whichMissing')}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {currentOptions.map((optId) => {
                const motif = MOTIFS.find((m) => m.id === optId) || MOTIFS[0];
                const Comp = motif.component;
                const isSelected = feedback?.selectedId === motif.id;
                const isCorrect = feedback?.correct;

                return (
                  <motion.button
                    key={motif.id}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => handlePickOption(motif.id)}
                    disabled={feedback !== null}
                    className={`p-4 rounded-3xl border-4 flex flex-col items-center justify-center min-h-[110px] transition-all cursor-pointer ${
                      isSelected && isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 shadow-lg'
                        : isSelected && !isCorrect
                        ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 shadow-lg'
                        : 'bg-white dark:bg-[#1E293B] border-slate-200 dark:border-[#243352] hover:border-amber-400 dark:hover:border-amber-500 shadow-sm'
                    }`}
                  >
                    <Comp className="w-14 h-14 md:w-16 md:h-16" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-2 text-center line-clamp-1">
                      {motif.name.split(' (')[0]}
                    </span>

                    {isSelected && (
                      <div className="mt-1">
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                        )}
                      </div>
                    )}
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
          subtitle={adaptiveSupport || t('games.mekhela.correctPattern')}
          score={score}
          stars={score >= 75 ? 3 : score >= 50 ? 2 : 1}
          timeTaken={duration}
          mistakes={mistakes}
          onPlayAgain={startGame}
          onNext={handleNextActivity}
          gameName="Mekhela Pattern Match"
        />
      )}
    </div>
  );
}
