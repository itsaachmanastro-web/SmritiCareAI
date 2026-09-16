import React, { useState } from 'react';
import { Globe, Check, AlertCircle, ChevronDown } from 'lucide-react';
import { SUPPORTED_LANGUAGES, getLanguage } from '../../services/translation/languageRegistry';

export default function LanguageSelector({ currentLanguage, onSelectLanguage }) {
  const [isOpen, setIsOpen] = useState(false);
  const current = getLanguage(currentLanguage);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#25334D] border border-slate-200 dark:border-[#243352] text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 transition-colors shadow-xs"
        aria-label="Select AI assistant language"
      >
        <Globe className="w-4 h-4 text-smriti-teal-600 dark:text-teal-400 shrink-0" />
        <span>{current.nativeName} ({current.name})</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 md:w-80 bg-white dark:bg-[#131D33] rounded-3xl p-3 border-2 border-slate-200 dark:border-[#243352] shadow-2xl z-50 animate-fade-in max-h-96 overflow-y-auto">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-[#243352] mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              North Eastern & National Languages
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select your preferred language for Smriti
            </p>
          </div>

          <div className="space-y-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLanguage;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    onSelectLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-all ${
                    isSelected
                      ? 'bg-teal-50 dark:bg-teal-950/80 border border-teal-300 dark:border-teal-800 text-smriti-teal-900 dark:text-teal-200 font-black'
                      : 'hover:bg-slate-50 dark:hover:bg-[#1E293B] text-slate-700 dark:text-slate-300 font-bold'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black">{lang.nativeName}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">({lang.name})</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-semibold">{lang.region}</span>
                      {lang.speechRecognitionAvailable ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                          Voice + Text
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                          Text Mode
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-5 h-5 text-smriti-teal-600 dark:text-teal-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
