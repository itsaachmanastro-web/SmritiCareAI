import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Minus,
  Maximize2,
  Sparkles,
  Key,
  Trash2,
  Send,
  Mic,
  MicOff,
  AlertCircle,
  HelpCircle,
  Gamepad2,
  Bell,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import VoiceButton from './VoiceButton';
import StateIndicators from './StateIndicators';
import LanguageSelector from './LanguageSelector';
import ChatWindow from './ChatWindow';
import ApiKeyModal from './ApiKeyModal';
import AiErrorBoundary from './AiErrorBoundary';
import SmritiCompanionAvatar from '../common/SmritiCompanionAvatar';
import { useVoiceAssistant } from '../../hooks/useVoiceAssistant';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ASSISTANT_STATES } from '../../services/voice/voiceAssistantService';

/**
 * AiAssistantDrawer
 * 
 * Unified SmritiCare AI Companion Drawer:
 * - Desktop: Smooth right-side slide-in panel (width: 440px / max-w-lg)
 * - Mobile: Full-screen modal overlay
 * - Error Boundary wrapped with graceful fallback
 * - Initializing skeleton with timeout protection
 * - Voice + Text dual mode
 * - Elder-friendly Quick Action pills mapped to real app features
 */
export default function AiAssistantDrawer({
  isOpen,
  onClose,
  currentGameId = null,
  currentGameName = null,
  currentGameState = null,
  currentScore = undefined,
  onOpenEmergency = null
}) {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { role } = useAuth();

  const [isMinimized, setIsMinimized] = useState(false);
  const [typedInput, setTypedInput] = useState('');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isLoadingReady, setIsLoadingReady] = useState(true);
  const [isLoadTimeout, setIsLoadTimeout] = useState(false);
  const drawerRef = useRef(null);

  const {
    state,
    conversations,
    liveTranscript,
    errorMessage,
    isSpeaking,
    currentLangConfig,
    startVoiceInput,
    stopVoiceInput,
    processQuery,
    replayMessage,
    stopSpeaking,
    clearHistory
  } = useVoiceAssistant({
    currentGameId,
    currentGameName,
    currentGameState,
    currentScore,
    onOpenEmergency
  });

  // Short elder-friendly initialization sequence when drawer opens
  useEffect(() => {
    let timer;
    let timeoutTimer;
    if (isOpen) {
      setIsMinimized(false);
      setIsLoadingReady(true);
      setIsLoadTimeout(false);

      // Brief 300ms smoothing timer to prevent layout flash
      timer = setTimeout(() => {
        setIsLoadingReady(false);
      }, 350);

      // Safeguard: If something hangs for 5 seconds
      timeoutTimer = setTimeout(() => {
        if (isLoadingReady) {
          setIsLoadTimeout(true);
        }
      }, 5000);
    }

    return () => {
      clearTimeout(timer);
      clearTimeout(timeoutTimer);
    };
  }, [isOpen]);

  // Keyboard accessibility: ESC closes drawer or restores from minimized
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (isMinimized) {
          setIsMinimized(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMinimized, onClose]);

  if (!isOpen) return null;

  const handleSendText = (e) => {
    e?.preventDefault();
    if (!typedInput.trim()) return;
    processQuery(typedInput);
    setTypedInput('');
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear your conversation with Smriti?')) {
      clearHistory();
    }
  };

  // Elder-friendly functional quick actions
  const handleQuickAction = (actionKey) => {
    switch (actionKey) {
      case 'understand_app':
        processQuery('Please explain how SmritiCare helps me with my daily routines, memory games, and caregiver support.');
        break;
      case 'memory_game':
        navigate('/patient/games');
        onClose();
        break;
      case 'reminders':
        navigate('/patient/reminders');
        onClose();
        break;
      case 'progress':
        navigate('/patient/progress');
        onClose();
        break;
      default:
        break;
    }
  };

  // Minimized Floating Pill on desktop
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-3 px-5 py-3 rounded-full bg-[#143D30] dark:bg-[#0E2320] text-white font-bold text-sm shadow-2xl hover:scale-105 active:scale-95 transition-all border border-[#1B5E40]/50 dark:border-[#2DD4BF]/20 cursor-pointer"
          aria-label="Expand AI Assistant"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-pulse"></span>
          <SmritiCompanionAvatar className="w-6 h-6" />
          <span>{t('assistant.smriti') || 'Smriti'} &bull; {t('menu.drawerTitle') || 'Care Companion'}</span>
          <Maximize2 className="w-4 h-4 ml-1 opacity-80" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      onClick={(e) => {
        // Close if backdrop is clicked
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t('menu.drawerTitle') || 'SmritiCare AI Assistant'}
    >
      <div
        ref={drawerRef}
        className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10"
      >
        <div className="w-screen sm:max-w-lg bg-[#F7F5F0] dark:bg-[#06110F] border-l border-[#DFEAE2] dark:border-[#183830] shadow-2xl flex flex-col h-full text-[#142823] dark:text-[#F0F6F4] transition-colors duration-200 animate-in slide-in-from-right duration-300 ease-out">
          {/* Drawer Header */}
          <div className="px-5 py-4 border-b border-[#DFEAE2] dark:border-[#183830] flex items-center justify-between gap-3 bg-[#FAFDF9] dark:bg-[#0B1C18] shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#DCF0E4] dark:bg-[#0D2318] border border-[#BAD9C6] dark:border-[#153A28] flex items-center justify-center shadow-xs shrink-0">
                <SmritiCompanionAvatar className="w-7 h-7" isListening={state === ASSISTANT_STATES.LISTENING} isSpeaking={isSpeaking} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-serif font-bold text-[#142823] dark:text-[#F0F6F4] truncate">
                    {t('assistant.smriti') || 'Smriti'}
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#DCF0E4] dark:bg-[#12332A] text-[#143D30] dark:text-[#34D399] font-bold">
                    Care Companion
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#0D9488] dark:text-[#2DD4BF] font-semibold mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
                  <span>
                    {state === ASSISTANT_STATES.LISTENING
                      ? (t('assistant.listening') || 'Listening...')
                      : state === ASSISTANT_STATES.THINKING
                      ? (t('assistant.thinking') || 'Thinking...')
                      : state === ASSISTANT_STATES.SPEAKING
                      ? (t('assistant.speaking') || 'Speaking...')
                      : (t('assistant.statusReady') || 'Ready to help')}
                  </span>
                </div>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Voice toggle trigger */}
              <button
                type="button"
                onClick={state === ASSISTANT_STATES.LISTENING ? stopVoiceInput : startVoiceInput}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  state === ASSISTANT_STATES.LISTENING
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'text-[#5C756D] dark:text-[#7E9C94] hover:text-[#143D30] hover:bg-[#EFF6F1] dark:hover:bg-[#102520]'
                }`}
                title={state === ASSISTANT_STATES.LISTENING ? 'Stop listening' : 'Start voice input'}
                aria-label="Voice input toggle"
              >
                {state === ASSISTANT_STATES.LISTENING ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Language Selector */}
              <LanguageSelector
                currentLanguage={language}
                onSelectLanguage={(l) => setLanguage(l)}
              />

              {/* Gemini / AI Engine Settings */}
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(true)}
                className="p-2 rounded-xl text-[#5C756D] hover:text-[#143D30] dark:text-[#7E9C94] dark:hover:text-white hover:bg-[#EFF6F1] dark:hover:bg-[#102520] transition-colors cursor-pointer"
                title={t('menu.aiSettings') || 'AI Engine Settings'}
                aria-label="AI Engine Settings"
              >
                <Key className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Clear History */}
              {conversations.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-2 rounded-xl text-[#5C756D] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Clear conversation"
                  aria-label="Clear chat history"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              {/* Minimize (Desktop only) */}
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="hidden sm:inline-flex p-2 rounded-xl text-[#5C756D] hover:text-[#142823] dark:text-[#7E9C94] dark:hover:text-white hover:bg-[#EFF6F1] dark:hover:bg-[#102520] transition-colors cursor-pointer"
                title={t('menu.minimize') || 'Minimize to corner'}
                aria-label="Minimize assistant drawer"
              >
                <Minus className="w-5 h-5" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-[#5C756D] hover:text-[#142823] dark:text-[#7E9C94] dark:hover:text-white hover:bg-[#EFF6F1] dark:hover:bg-[#102520] transition-colors cursor-pointer"
                title={t('menu.close') || 'Close'}
                aria-label="Close assistant drawer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Drawer Body Wrapped in Error Boundary */}
          <AiErrorBoundary onClose={onClose}>
            {isLoadingReady ? (
              // Loading Skeleton
              <div className="flex-1 p-6 space-y-6 flex flex-col justify-center items-center text-center">
                <div className="w-16 h-16 rounded-3xl bg-[#DCF0E4] dark:bg-[#0D2318] border border-[#BAD9C6] dark:border-[#153A28] flex items-center justify-center shadow-md animate-bounce">
                  <SmritiCompanionAvatar className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-[#142823] dark:text-[#F0F6F4]">
                    {t('menu.gettingReady') || 'Smriti is getting ready...'}
                  </h3>
                  <div className="w-48 h-2 bg-[#DFEAE2] dark:bg-[#183830] rounded-full mx-auto overflow-hidden">
                    <div className="w-full h-full bg-[#143D30] dark:bg-[#2DD4BF] animate-pulse"></div>
                  </div>
                </div>

                {isLoadTimeout && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 max-w-xs space-y-3">
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                      {t('menu.takingLonger') || 'Taking a little longer than expected.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsLoadingReady(false)}
                      className="px-4 py-1.5 text-xs font-bold rounded-xl bg-amber-600 text-white shadow-xs hover:bg-amber-700 cursor-pointer"
                    >
                      {t('menu.tryAgain') || 'Continue Anyway'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Normal Assistant View
              <div className="flex-1 flex flex-col overflow-hidden px-4 py-3 space-y-3">
                {/* Active Context Banner if inside a Game */}
                {currentGameName && (
                  <div className="px-3 py-2 bg-[#E8F3ED] dark:bg-[#102923] border border-[#BAD9C6] dark:border-[#183830] rounded-2xl flex items-center justify-between text-xs font-bold text-[#143D30] dark:text-[#34D399] shrink-0">
                    <span>🎮 Active Game Context: {currentGameName}</span>
                    {currentScore !== undefined && <span>Score: {currentScore}%</span>}
                  </div>
                )}

                {/* State Indicators (Listening, Thinking, Speaking) */}
                <StateIndicators
                  state={state}
                  liveTranscript={liveTranscript}
                  errorMessage={errorMessage}
                />

                {/* Main Scrollable Conversation Area */}
                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                  <ChatWindow
                    conversations={conversations}
                    onReplay={replayMessage}
                    onStopSpeaking={stopSpeaking}
                    isSpeaking={isSpeaking}
                    greeting={currentLangConfig.greeting}
                  />
                </div>

                {/* Voice Centerpiece Mic */}
                <div className="py-1 flex justify-center shrink-0">
                  <VoiceButton
                    state={state}
                    isSpeaking={isSpeaking}
                    onClick={startVoiceInput}
                    onStopSpeaking={stopSpeaking}
                    size="md"
                  />
                </div>

                {/* Quick Action Navigation Pills */}
                <div className="shrink-0 space-y-1.5 pt-1">
                  <div className="text-[10px] font-black uppercase tracking-wider text-[#5C756D] dark:text-[#7E9C94] px-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>{t('menu.quickActions') || 'Quick Actions'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickAction('understand_app')}
                      className="flex items-center gap-2 p-2.5 rounded-2xl bg-white dark:bg-[#0E221E] hover:bg-[#E8F3ED] dark:hover:bg-[#122E26] border border-[#DFEAE2] dark:border-[#183830] text-left text-xs font-bold text-[#142823] dark:text-[#E2EAE5] transition-all cursor-pointer shadow-xs"
                    >
                      <HelpCircle className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF] shrink-0" />
                      <span className="truncate">{t('menu.understandApp') || 'Help me understand app'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickAction('memory_game')}
                      className="flex items-center gap-2 p-2.5 rounded-2xl bg-white dark:bg-[#0E221E] hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-[#DFEAE2] dark:border-[#183830] text-left text-xs font-bold text-[#142823] dark:text-[#E2EAE5] transition-all cursor-pointer shadow-xs"
                    >
                      <Gamepad2 className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="truncate">{t('menu.startMemoryGame') || 'Start memory game'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickAction('reminders')}
                      className="flex items-center gap-2 p-2.5 rounded-2xl bg-white dark:bg-[#0E221E] hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-[#DFEAE2] dark:border-[#183830] text-left text-xs font-bold text-[#142823] dark:text-[#E2EAE5] transition-all cursor-pointer shadow-xs"
                    >
                      <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="truncate">{t('menu.todayReminders') || "Today's reminders"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickAction('progress')}
                      className="flex items-center gap-2 p-2.5 rounded-2xl bg-white dark:bg-[#0E221E] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-[#DFEAE2] dark:border-[#183830] text-left text-xs font-bold text-[#142823] dark:text-[#E2EAE5] transition-all cursor-pointer shadow-xs"
                    >
                      <TrendingUp className="w-4 h-4 text-[#22C55E] dark:text-[#4ADE80] shrink-0" />
                      <span className="truncate">{t('menu.showProgress') || 'Show my progress'}</span>
                    </button>
                  </div>
                </div>

                {/* Text Input Footer Bar */}
                <form
                  onSubmit={handleSendText}
                  className="pt-2 border-t border-[#DFEAE2] dark:border-[#183830] flex items-center gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={typedInput}
                    onChange={(e) => setTypedInput(e.target.value)}
                    placeholder={t('menu.askPrompt') || 'Ask Smriti anything...'}
                    className="flex-1 px-4 py-3 rounded-full border border-[#DFEAE2] dark:border-[#183830] bg-white dark:bg-[#0E221E] text-[#142823] dark:text-[#F0F6F4] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#143D30] dark:focus:ring-[#2DD4BF] transition-all shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={!typedInput.trim()}
                    className="p-3 rounded-full bg-[#143D30] hover:bg-[#0E2D23] dark:bg-[#2DD4BF] dark:hover:bg-[#20B8A5] text-white dark:text-[#06110F] font-bold transition-all disabled:opacity-40 cursor-pointer shadow-md shrink-0 active:scale-95"
                    aria-label="Send query"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            )}
          </AiErrorBoundary>

          {/* AI Settings Modal */}
          <ApiKeyModal
            isOpen={isKeyModalOpen}
            onClose={() => setIsKeyModalOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}
