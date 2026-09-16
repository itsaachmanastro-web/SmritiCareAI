import React, { useRef, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, User, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ChatWindow({
  conversations = [],
  onReplay,
  onStopSpeaking,
  isSpeaking = false,
  greeting = ''
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversations]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[380px] md:max-h-[440px] rounded-3xl bg-slate-50/60 dark:bg-[#0E172A]/80 border border-slate-200/80 dark:border-[#243352]"
    >
      {/* Welcome Message Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50/70 dark:from-[#131D33] dark:to-[#1A253D] border border-teal-200/80 dark:border-[#243352] flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-smriti-teal-600 to-teal-800 flex items-center justify-center text-white text-lg shrink-0 shadow-sm">
          🌸
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-wider text-smriti-teal-800 dark:text-teal-300">
              Smriti Care Companion
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold">
              Voice-First AI
            </span>
          </div>
          <p className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
            {greeting || 'Hello! I am Smriti, your care companion. Tap the microphone or ask me anything below.'}
          </p>
        </div>
      </div>

      {/* Conversation Thread */}
      {conversations.map((msg, idx) => {
        const isUser = msg.role === 'user';
        return (
          <motion.div
            key={msg.id || idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold shadow-xs ${
                isUser
                  ? 'bg-slate-700 dark:bg-slate-600 text-white'
                  : 'bg-gradient-to-br from-smriti-teal-600 to-teal-800 text-white'
              }`}
            >
              {isUser ? <User className="w-5 h-5" /> : '🌸'}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[82%] rounded-2xl p-4 shadow-sm ${
                isUser
                  ? 'bg-slate-800 text-white dark:bg-teal-900/80 rounded-tr-none'
                  : 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-[#243352] rounded-tl-none'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-black uppercase tracking-wider opacity-75">
                  {isUser ? 'You' : 'Smriti'}
                </span>

                {!isUser && (
                  <div className="flex items-center gap-1">
                    {msg.source && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#131D33] text-slate-500 dark:text-slate-400 font-mono">
                        {msg.source === 'gemini' ? 'Gemini AI' : 'Offline Engine'}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onReplay(msg.message || msg.text, msg.language)}
                      className="p-1 rounded-lg text-slate-500 hover:text-smriti-teal-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="Listen aloud (Replay)"
                      aria-label="Replay response aloud"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-sm md:text-base font-semibold leading-relaxed whitespace-pre-line">
                {msg.message || msg.text}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
