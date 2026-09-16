import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { Star, Award, RotateCcw, ArrowRight, Sparkles } from 'lucide-react';
import ElderButton from './ElderButton';
import { playVictorySound } from '../../audio/synthAudio';
import { useLanguage } from '../../context/LanguageContext';
import { useAssistant } from '../../context/AssistantContext';

export default function ConfettiCelebration({
  title,
  subtitle,
  score = 100,
  stars = 3,
  timeTaken = 45,
  mistakes = 0,
  onPlayAgain,
  onNext,
  gameName = ""
}) {
  const { t } = useLanguage();
  const { openAssistant } = useAssistant();
  const [isNavigatingNext, setIsNavigatingNext] = React.useState(false);

  const handleNextClick = async () => {
    if (isNavigatingNext) return;
    setIsNavigatingNext(true);
    try {
      if (onNext) {
        await onNext();
      }
    } catch (err) {
      console.error('Error proceeding to next activity:', err);
      setIsNavigatingNext(false);
    }
  };

  useEffect(() => {
    // Play celebratory victory tones
    playVictorySound();

    // Trigger joyous confetti bursts
    const duration = 2.5 * 1000;
    const animationEnd = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#0d9488', '#ea580c', '#fbbf24', '#f43f5e']
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#0d9488', '#ea580c', '#fbbf24', '#f43f5e']
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="max-w-xl mx-auto bg-white dark:bg-[#131D33] rounded-3xl md:rounded-4xl p-6 md:p-10 shadow-2xl border-4 border-amber-300 dark:border-amber-600/70 text-center"
    >
      {/* Decorative Gold Trophy Icon */}
      <div className="w-24 h-24 mx-auto rounded-3xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner mb-4">
        <Award className="w-14 h-14" />
      </div>

      {/* Main Praise */}
      <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white font-display">
        {title || t('wonderfulJob')}
      </h2>
      <p className="text-xl text-slate-600 dark:text-slate-300 font-medium mt-2">
        {subtitle || t('gameSavedOffline')}
      </p>

      {/* Stars Array */}
      <div className="flex justify-center gap-3 my-6">
        {[1, 2, 3].map((starIdx) => (
          <motion.div
            key={starIdx}
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2 + starIdx * 0.15, type: 'spring' }}
          >
            <Star
              className={`w-14 h-14 ${
                starIdx <= stars
                  ? 'text-amber-400 fill-amber-400 drop-shadow-md'
                  : 'text-slate-200 dark:text-slate-700 fill-slate-100 dark:fill-slate-800'
              }`}
            />
          </motion.div>
        ))}
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-[#1E293B] p-4 rounded-2xl border border-slate-200 dark:border-[#243352] mb-8">
        <div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('score')}</span>
          <p className="text-2xl md:text-3xl font-black text-smriti-teal-700 dark:text-smriti-teal-300">{score}%</p>
        </div>
        <div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Time</span>
          <p className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">{timeTaken}s</p>
        </div>
        <div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('mistakes')}</span>
          <p className="text-2xl md:text-3xl font-black text-amber-600 dark:text-amber-400">{mistakes}</p>
        </div>
      </div>

      {/* Offline Storage confirmation pill */}
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-[#1E293B] border border-emerald-200 dark:border-emerald-800/80 rounded-full text-emerald-800 dark:text-emerald-300 text-sm font-semibold mb-6">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        Saved to IndexedDB &bull; Queued for Cloud Sync
      </div>

      {/* Ask SmritiCare about my result Button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => openAssistant({
            currentGameName: gameName || 'Cognitive Game',
            currentScore: score,
            durationSeconds: timeTaken,
            mistakes
          })}
          className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-3xl bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white font-black text-base shadow-lg hover:shadow-teal-500/40 hover:scale-102 transition-all cursor-pointer border-2 border-teal-300/40"
        >
          <span className="text-2xl">🌸</span>
          <span>Ask SmritiCare about my result</span>
          <Sparkles className="w-5 h-5 text-amber-300" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {onPlayAgain && (
          <ElderButton
            variant="outline"
            size="md"
            icon={RotateCcw}
            onClick={onPlayAgain}
          >
            {t('playAgain')}
          </ElderButton>
        )}
        {onNext && (
          <ElderButton
            variant="primary"
            size="md"
            icon={ArrowRight}
            disabled={isNavigatingNext}
            onClick={handleNextClick}
          >
            {isNavigatingNext ? (t('common.loading') || 'Loading...') : (t('nextActivity') || 'Next Activity')}
          </ElderButton>
        )}
      </div>
    </motion.div>
  );
}
