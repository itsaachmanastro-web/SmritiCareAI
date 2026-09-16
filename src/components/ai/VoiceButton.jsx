import React from 'react';
import { Mic, MicOff, Square, Radio, Sparkles, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ASSISTANT_STATES } from '../../services/voice/voiceAssistantService';

export default function VoiceButton({
  state = ASSISTANT_STATES.IDLE,
  onClick,
  onStopSpeaking,
  isSpeaking = false,
  size = 'lg', // 'md' or 'lg'
  className = ''
}) {
  const isListening = state === ASSISTANT_STATES.LISTENING;
  const isThinking = state === ASSISTANT_STATES.THINKING || state === ASSISTANT_STATES.UNDERSTANDING;

  const buttonDimensions = size === 'lg'
    ? 'w-20 h-20 md:w-24 md:h-24'
    : 'w-16 h-16 md:w-18 md:h-18';

  const iconDimensions = size === 'lg'
    ? 'w-10 h-10 md:w-12 md:h-12'
    : 'w-7 h-7 md:w-8 md:h-8';

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Pulsing Ripple Rings when Listening */}
      {isListening && (
        <>
          <motion.div
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full bg-teal-400 dark:bg-teal-500 pointer-events-none"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0.6 }}
            animate={{ scale: 1.3, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.6, delay: 0.3, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full bg-emerald-400 pointer-events-none"
          />
        </>
      )}

      {/* Main Touch Button */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.04 }}
        onClick={isSpeaking ? onStopSpeaking : onClick}
        className={`relative ${buttonDimensions} rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-teal-400 cursor-pointer ${
          isSpeaking
            ? 'bg-gradient-to-br from-rose-500 to-rose-700 shadow-rose-500/40 ring-4 ring-rose-300 dark:ring-rose-900'
            : isListening
            ? 'bg-gradient-to-br from-teal-500 via-emerald-500 to-teal-700 shadow-teal-500/50 ring-4 ring-teal-300 dark:ring-teal-700'
            : isThinking
            ? 'bg-gradient-to-br from-indigo-500 to-teal-600 shadow-indigo-500/40 animate-pulse'
            : 'bg-gradient-to-br from-smriti-teal-600 to-teal-800 hover:from-smriti-teal-500 hover:to-teal-700 shadow-teal-700/40'
        }`}
        aria-label={
          isSpeaking
            ? 'Stop speaking'
            : isListening
            ? 'Listening to your voice. Tap to stop.'
            : 'Tap and speak to SmritiCare Assistant'
        }
      >
        {isSpeaking ? (
          <Square className={`${iconDimensions} fill-current`} />
        ) : isListening ? (
          <Radio className={`${iconDimensions} animate-spin`} />
        ) : isThinking ? (
          <Sparkles className={`${iconDimensions} animate-bounce`} />
        ) : (
          <Mic className={iconDimensions} />
        )}
      </motion.button>

      {/* Subtitle / Direct State Action Instruction */}
      <span className="mt-3 text-sm md:text-base font-black tracking-wide text-slate-700 dark:text-slate-200">
        {isSpeaking
          ? '🔇 Tap to stop speaking'
          : isListening
          ? '🎙️ Listening... Speak now'
          : isThinking
          ? '🧠 Understanding...'
          : '🎙️ Tap & Speak to Smriti'}
      </span>
    </div>
  );
}
