import React from 'react';
import { Radio, Brain, Volume2, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ASSISTANT_STATES } from '../../services/voice/voiceAssistantService';
import { useLanguage } from '../../context/LanguageContext';

export default function StateIndicators({
  state = ASSISTANT_STATES.IDLE,
  liveTranscript = '',
  errorMessage = null
}) {
  const { t } = useLanguage();

  if (errorMessage) {
    return (
      <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-rose-800 dark:text-rose-200 text-sm font-bold">
        <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
        <span>{errorMessage}</span>
      </div>
    );
  }

  if (state === ASSISTANT_STATES.IDLE) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {state === ASSISTANT_STATES.LISTENING && (
        <motion.div
          key="listening"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="p-4 bg-teal-50/90 dark:bg-teal-950/70 border-2 border-teal-300 dark:border-teal-800 rounded-2xl flex flex-col items-center gap-2 text-center"
        >
          <div className="flex items-center gap-2 text-smriti-teal-800 dark:text-teal-200 font-black text-base">
            <Radio className="w-5 h-5 text-teal-600 animate-spin" />
            <span>{t('assistant.listening')}</span>
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 italic min-h-[20px]">
            {liveTranscript ? `"${liveTranscript}"` : t('assistant.pressToSpeak')}
          </p>
        </motion.div>
      )}

      {state === ASSISTANT_STATES.UNDERSTANDING && (
        <motion.div
          key="understanding"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="p-4 bg-emerald-50/90 dark:bg-emerald-950/70 border-2 border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center justify-center gap-2 text-emerald-800 dark:text-emerald-200 font-black text-base text-center"
        >
          <Sparkles className="w-5 h-5 text-emerald-600 animate-bounce" />
          <span>{t('assistant.thinking')}</span>
        </motion.div>
      )}

      {state === ASSISTANT_STATES.THINKING && (
        <motion.div
          key="thinking"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="p-4 bg-indigo-50/90 dark:bg-indigo-950/70 border-2 border-indigo-300 dark:border-indigo-800 rounded-2xl flex items-center justify-center gap-2 text-indigo-800 dark:text-indigo-200 font-black text-base text-center"
        >
          <Brain className="w-5 h-5 text-indigo-600 animate-pulse" />
          <span>{t('assistant.thinking')}</span>
        </motion.div>
      )}

      {state === ASSISTANT_STATES.SPEAKING && (
        <motion.div
          key="speaking"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="p-4 bg-amber-50/90 dark:bg-amber-950/70 border-2 border-amber-300 dark:border-amber-800 rounded-2xl flex items-center justify-center gap-2 text-amber-900 dark:text-amber-200 font-black text-base text-center"
        >
          <Volume2 className="w-5 h-5 text-amber-600 animate-pulse" />
          <span>{t('assistant.speaking')}</span>
        </motion.div>
      )}

      {state === ASSISTANT_STATES.DONE && (
        <motion.div
          key="done"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-sm text-center"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{t('common.done')} &bull; {t('assistant.pressToSpeak')}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
