import React from 'react';
import { Mic, Sparkles } from 'lucide-react';
import SmritiCompanionAvatar from '../common/SmritiCompanionAvatar';
import { useEntitlements } from '../../hooks/useEntitlements';

export default function FloatingAssistantButton({ onClick, hasActiveGame = false }) {
  const { canAccessVoiceAi } = useEntitlements();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`fixed z-40 right-4 md:right-6 flex items-center gap-2.5 pl-2 pr-4 py-2.5 rounded-full bg-[#143D30] dark:bg-[#0E2320] hover:bg-[#0E2D23] dark:hover:bg-[#122C27] text-white font-bold shadow-2xl border border-[#1B5E40]/50 dark:border-[#2DD4BF]/20 hover:shadow-[#143D30]/40 dark:hover:shadow-[#2DD4BF]/20 transition-all cursor-pointer select-none active:scale-95 ${
        hasActiveGame ? 'bottom-6 md:bottom-8' : 'bottom-20 md:bottom-24 lg:bottom-6'
      }`}
      aria-label="Open SmritiCare Voice Assistant"
      title={canAccessVoiceAi ? 'Ask Smriti — Your AI Care Companion' : 'Smriti Voice AI Companion (Premium)'}
    >
      {/* Live status dot */}
      <span className="relative flex h-3 w-3 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ADE80] opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#22C55E]" />
      </span>

      {/* Smriti mini avatar */}
      <SmritiCompanionAvatar className="w-7 h-7 shrink-0" />

      {/* Label */}
      <span className="text-xs md:text-sm font-bold tracking-wide whitespace-nowrap">
        {hasActiveGame ? 'Ask Smriti' : 'Ask Smriti'}
      </span>

      {/* Mic icon or Pro badge */}
      {canAccessVoiceAi ? (
        <Mic className="w-4 h-4 text-[#86EFAC] shrink-0" />
      ) : (
        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-black flex items-center gap-0.5">
          <Sparkles className="w-2.5 h-2.5 text-amber-300" />
          <span>PRO</span>
        </span>
      )}
    </button>
  );
}

