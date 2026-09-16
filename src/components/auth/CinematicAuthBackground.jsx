import React, { useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import CinematicNeuralCanvas from './CinematicNeuralCanvas';

/**
 * CinematicAuthBackground
 * 
 * Futuristic AI / neural-network environment background:
 * - 100% Programmatic HTML5 2D Canvas replicating the reference design.
 * - Glowing cyan/turquoise network with radiant golden hubs and flowing energy trails.
 * - Floating geometric wireframe elements and multi-plane atmospheric particles.
 * - Grounding digital neural terrain wave mesh along the bottom.
 * - Zero external video streaming.
 * - Ambient motion controls respecting prefers-reduced-motion.
 */
export default function CinematicAuthBackground() {
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const [isPaused, setIsPaused] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  const togglePlayPause = () => {
    setIsPaused((prev) => !prev);
  };

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 select-none">
      {/* 1. Underlying Solid Dark Theme Base */}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${
          isDark ? 'bg-[#01040a]' : 'bg-[#FAF8F5]'
        }`}
      />

      {/* 2. Cinematic Futuristic AI Neural Network Canvas */}
      <CinematicNeuralCanvas isPaused={isPaused} />

      {/* 3. Subtle Contrast Balancing Veils for Accessibility & Text Clarity */}
      {isDark ? (
        <div className="absolute inset-0 bg-[#01040a]/20 pointer-events-none" />
      ) : (
        <div className="absolute inset-0 bg-[#FAF8F5]/80 backdrop-blur-[1px] pointer-events-none" />
      )}

      {/* 4. Subtle Ambient Motion Toggle (Accessibility Control) */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto">
        <button
          type="button"
          onClick={togglePlayPause}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-white/80 dark:bg-[#131D33]/80 hover:bg-white dark:hover:bg-[#1E293B] border border-slate-200/80 dark:border-[#243352] text-slate-700 dark:text-slate-300 shadow-sm backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          title={isPaused ? (t('auth.resumeMotion') || 'Play background animation') : (t('auth.pauseMotion') || 'Pause background animation')}
          aria-label={isPaused ? (t('auth.resumeMotion') || 'Play background animation') : (t('auth.pauseMotion') || 'Pause background animation')}
        >
          {isPaused ? (
            <>
              <Play className="w-3 h-3 text-smriti-teal-600 dark:text-teal-400" />
              <span>{t('auth.resumeMotion') || 'Play'}</span>
            </>
          ) : (
            <>
              <Pause className="w-3 h-3 text-slate-500" />
              <span>{t('auth.pauseMotion') || 'Pause'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
