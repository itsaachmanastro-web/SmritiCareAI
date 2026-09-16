import React from 'react';
import { Volume2, VolumeX, Sparkles, Radio, Mic } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSpeech } from '../../context/SpeechContext';
import { useAssistant } from '../../context/AssistantContext';

export default function VoicePromptCard({
  text,
  subtext,
  avatar,
  speakerName = "Smriti AI Companion",
  autoSpeak = false,
  className = ""
}) {
  const { speak, stopSpeaking, isSpeaking } = useSpeech();
  const { openAssistant } = useAssistant();

  React.useEffect(() => {
    if (autoSpeak && text) {
      const timer = setTimeout(() => {
        speak(text);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [text, autoSpeak]);

  const toggleSpeech = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(text);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-gradient-to-br from-teal-50/95 via-emerald-50/70 to-teal-50/90 dark:from-[#131D33] dark:via-[#1A253D] dark:to-[#131D33] border-2 border-teal-200/90 dark:border-[#243352] rounded-3xl p-5 md:p-6 shadow-healthcare ${className}`}
    >
      <div className="flex items-start gap-4 md:gap-5">
        {/* Assistant Avatar with Audio Wave Ring */}
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-smriti-teal-600 to-smriti-teal-800 flex items-center justify-center text-white shadow-md border-2 border-teal-300/40">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <span className="text-3xl">🌸</span>
            )}
          </div>
          {isSpeaking && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-teal-500 items-center justify-center text-white text-[10px]">
                <Radio className="w-3 h-3 animate-spin" />
              </span>
            </span>
          )}
        </div>

        {/* Speech Bubble Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-smriti-teal-800 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                {speakerName}
              </span>
              {isSpeaking && (
                <div className="flex items-center gap-0.5 h-3 ml-1">
                  <span className="w-1 h-3 bg-teal-500 rounded-full animate-pulse"></span>
                  <span className="w-1 h-4 bg-teal-600 rounded-full animate-pulse delay-75"></span>
                  <span className="w-1 h-2 bg-teal-400 rounded-full animate-pulse delay-150"></span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openAssistant({ currentPrompt: text })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs md:text-sm font-extrabold bg-teal-50 dark:bg-teal-950/80 hover:bg-teal-100 dark:hover:bg-teal-900/80 text-smriti-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700 shadow-xs transition-all cursor-pointer"
                title="Talk with Smriti AI"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Ask Smriti</span>
              </button>

              <button
                onClick={toggleSpeech}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs md:text-sm font-extrabold transition-all cursor-pointer ${
                  isSpeaking
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 hover:bg-rose-200 dark:hover:bg-rose-900/60 animate-pulse border border-rose-300 dark:border-rose-700'
                    : 'bg-white dark:bg-[#1E293B] text-smriti-teal-900 dark:text-teal-200 hover:bg-teal-100/60 dark:hover:bg-[#25334D] border border-teal-300 dark:border-[#2E4166] shadow-xs'
                }`}
                title="Hear instruction aloud"
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-4 h-4 text-rose-600 dark:text-rose-400" /> Stop Speaking
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Listen Aloud
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-snug font-display">
            "{text}"
          </p>

          {subtext && (
            <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base mt-1.5 font-semibold">
              {subtext}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
