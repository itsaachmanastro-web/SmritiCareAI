import React from 'react';
import { Mic, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FloatingAssistantButton({ onClick, hasActiveGame = false }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`fixed z-40 right-4 md:right-8 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 text-white font-black shadow-2xl border-2 border-teal-300/40 hover:shadow-teal-500/50 transition-all cursor-pointer select-none ${
        hasActiveGame ? 'bottom-6 md:bottom-8' : 'bottom-20 md:bottom-24'
      }`}
      aria-label="Open SmritiCare Voice Assistant"
      title="Ask SmritiCare AI Assistant"
    >
      <span className="relative flex h-3.5 w-3.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400"></span>
      </span>

      <span className="text-xl">🌸</span>
      <span className="text-xs md:text-sm font-black tracking-wide">
        {hasActiveGame ? 'Ask Smriti for Help' : 'Ask Smriti'}
      </span>
      <Mic className="w-4 h-4 text-teal-200 ml-0.5" />
    </motion.button>
  );
}
