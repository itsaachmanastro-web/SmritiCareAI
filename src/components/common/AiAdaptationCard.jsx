import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, ShieldCheck, CheckCircle2, ArrowRight, Brain } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { evaluateAdaptationResult } from '../../services/games/AdaptiveDifficultyEngine';

/**
 * AiAdaptationCard
 * 
 * Elegant, subtle, and elderly-friendly status card displayed after cognitive game completion.
 * Shows:
 * - Previous difficulty
 * - New difficulty
 * - Accuracy / Performance
 * - A short human-readable reason for the adjustment
 * 
 * Example:
 * "Difficulty increased: Level 2 → Level 3"
 * "Reason: High accuracy across recent activities."
 */
export default function AiAdaptationCard({
  adaptationData = null,
  score = 100,
  mistakes = 0,
  difficultyLevel = 'medium',
  className = ''
}) {
  const { t } = useLanguage();

  // If adaptationData is not passed explicitly, evaluate it from session performance
  const data = adaptationData || evaluateAdaptationResult({
    difficultyBefore: difficultyLevel,
    difficultyAfter: score >= 85 ? 'hard' : score < 60 ? 'easy' : difficultyLevel,
    accuracy: score,
    mistakes
  });

  const {
    direction = 'maintained',
    previousDifficulty = 'Level 2',
    newDifficulty = 'Level 2',
    previousDifficultyFull,
    newDifficultyFull,
    accuracy = score,
    reason = 'Steady consistency maintaining optimal cognitive engagement.'
  } = data;

  // Direction specific configuration
  const isIncreased = direction === 'increased';
  const isDecreased = direction === 'decreased';

  const badgeConfig = isIncreased
    ? {
        label: t('games.adaptive.difficultyIncreased') || 'Difficulty Increased',
        icon: TrendingUp,
        badgeClass: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/80',
        flowTextClass: 'text-emerald-700 dark:text-emerald-300'
      }
    : isDecreased
    ? {
        label: t('games.adaptive.difficultyDecreased') || 'Supportive Easing',
        icon: ShieldCheck,
        badgeClass: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/80',
        flowTextClass: 'text-amber-700 dark:text-amber-300'
      }
    : {
        label: t('games.adaptive.difficultyMaintained') || 'Difficulty Maintained',
        icon: CheckCircle2,
        badgeClass: 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-700/80',
        flowTextClass: 'text-teal-700 dark:text-teal-300'
      };

  const DirectionIcon = badgeConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
      className={`w-full rounded-2xl md:rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-teal-50/90 via-emerald-50/60 to-slate-50 dark:from-[#0E1B24] dark:via-[#11242B] dark:to-[#0C171F] border-2 border-teal-200 dark:border-teal-800/70 shadow-sm text-left ${className}`}
      aria-label="AI Cognitive Adaptation Status"
    >
      {/* Top Row: AI Engine Tag & Direction Status Badge */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-teal-100 dark:border-teal-900/60">
        <div className="inline-flex items-center gap-1.5 text-xs font-black text-teal-800 dark:text-teal-300 uppercase tracking-wider">
          <div className="w-6 h-6 rounded-lg bg-teal-600/10 dark:bg-teal-400/10 flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          </div>
          <span>{t('games.adaptive.title') || 'AI Adaptation'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
        </div>

        <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${badgeConfig.badgeClass}`}>
          <DirectionIcon className="w-3 h-3" />
          <span>{badgeConfig.label}</span>
        </div>
      </div>

      {/* Main Adaptation Content */}
      <div className="pt-3 space-y-3">
        {/* Difficulty Transition Flow */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm md:text-base font-bold text-slate-800 dark:text-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">
              {t('games.adaptive.adjustment') || 'Progression'}:
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#1A2E38] border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-200 shadow-2xs">
              {previousDifficultyFull || previousDifficulty}
            </span>
            <ArrowRight className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className={`px-2.5 py-1 rounded-xl bg-white dark:bg-[#1A2E38] border border-teal-300 dark:border-teal-600 font-extrabold text-xs sm:text-sm shadow-2xs ${badgeConfig.flowTextClass}`}>
              {newDifficultyFull || newDifficulty}
            </span>
          </div>

          <div className="text-xs md:text-sm font-bold text-slate-600 dark:text-slate-300">
            <span className="text-slate-400 dark:text-slate-500 font-normal">{t('score') || 'Accuracy'}: </span>
            <span className="font-extrabold text-emerald-700 dark:text-emerald-400">{accuracy}%</span>
          </div>
        </div>

        {/* Human-readable Reason Callout */}
        <div className="p-3 rounded-xl bg-white/80 dark:bg-[#14262F]/90 border border-teal-100 dark:border-teal-900/50 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-snug">
            <strong className="font-bold text-slate-900 dark:text-white">
              {t('games.adaptive.reason') || 'Reason'}:
            </strong>{' '}
            <span className="font-medium text-slate-700 dark:text-slate-300">{reason}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
