import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Send, ShieldCheck, Heart, Sparkles, Globe, Key } from 'lucide-react';
import VoiceButton from '../../components/ai/VoiceButton';
import StateIndicators from '../../components/ai/StateIndicators';
import SuggestedQuestions from '../../components/ai/SuggestedQuestions';
import LanguageSelector from '../../components/ai/LanguageSelector';
import ChatWindow from '../../components/ai/ChatWindow';
import ApiKeyModal from '../../components/ai/ApiKeyModal';
import AiErrorBoundary from '../../components/ai/AiErrorBoundary';
import { useVoiceAssistant } from '../../hooks/useVoiceAssistant';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export default function AssistantPage() {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { role } = useAuth();
  const [typedInput, setTypedInput] = useState('');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

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
  } = useVoiceAssistant();

  const handleSend = (e) => {
    e.preventDefault();
    if (!typedInput.trim()) return;
    processQuery(typedInput);
    setTypedInput('');
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear your conversation with Smriti?')) {
      clearHistory();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-[#131D33] border border-slate-200 dark:border-[#243352] text-slate-700 dark:text-slate-200 text-sm font-bold shadow-xs hover:bg-slate-50 dark:hover:bg-[#1E293B] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back')}</span>
        </button>

        <div className="flex items-center gap-2">
          <LanguageSelector
            currentLanguage={language}
            onSelectLanguage={(l) => setLanguage(l)}
          />

          {/* AI Engine Settings / Gemini Key Modal */}
          <button
            type="button"
            onClick={() => setIsKeyModalOpen(true)}
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-[#243352] text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
            title="AI Engine & Gemini API Settings"
            aria-label="AI Engine Settings"
          >
            <Key className="w-5 h-5" />
          </button>

          {conversations.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="p-2.5 rounded-2xl border border-slate-200 dark:border-[#243352] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Assistant Card Wrapped in Error Boundary */}
      <AiErrorBoundary>
        <div className="bg-white dark:bg-[#131D33] rounded-3xl md:rounded-4xl p-6 md:p-8 border-2 border-slate-200 dark:border-[#243352] shadow-xl space-y-6">
          {/* Title Header */}
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-[#243352]">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-smriti-teal-600 to-teal-800 text-white flex items-center justify-center text-3xl shadow-lg shrink-0">
              🌸
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-smriti-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-3 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                  {t('assistant.title')}
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  Cognitive Support Companion
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mt-1">
                "{t('assistant.askAnything')}"
              </h1>
            </div>
          </div>

          {/* State Indicators */}
          <StateIndicators
            state={state}
            isSpeaking={isSpeaking}
            onStopSpeaking={stopSpeaking}
          />

          {/* Live Speech Recognition Transcript Pill */}
          {state === 'listening' && liveTranscript && (
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-sm font-semibold text-teal-900 dark:text-teal-200 animate-pulse">
              <span className="text-xs uppercase font-black text-teal-600 block mb-1">Live Voice Input</span>
              "{liveTranscript}"
            </div>
          )}

          {/* Assistant Chat Window */}
          <ChatWindow
            conversations={conversations}
            onReplay={replayMessage}
            onStopSpeaking={stopSpeaking}
            isSpeaking={isSpeaking}
            greeting={currentLangConfig.greeting}
          />

          {/* Big Interactive Voice Button */}
          <div className="py-2 flex justify-center">
            <VoiceButton
              state={state}
              isSpeaking={isSpeaking}
              onStartListening={startVoiceInput}
              onStopListening={stopVoiceInput}
              onStopSpeaking={stopSpeaking}
            />
          </div>

          {/* Suggested Quick Prompts */}
          <SuggestedQuestions
            isCaregiver={role === 'caregiver' || role === 'healthcare'}
            onSelectQuestion={(q) => processQuery(q)}
          />

          {/* Text Input Fallback */}
          <form onSubmit={handleSend} className="pt-4 border-t border-slate-100 dark:border-[#243352] flex items-center gap-3">
            <input
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder={t('assistant.askAnything')}
              className="flex-1 px-4 py-3.5 rounded-2xl border-2 border-slate-200 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-smriti-teal-500"
            />
            <button
              type="submit"
              disabled={!typedInput.trim()}
              className="px-6 py-3.5 rounded-2xl bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-40"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </AiErrorBoundary>

      {/* Safety & Medical Boundaries Footer Note */}
      <div className="p-5 bg-teal-50/60 dark:bg-[#131D33] rounded-3xl border border-teal-200/80 dark:border-[#243352] flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
        <ShieldCheck className="w-5 h-5 text-smriti-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Dementia Care Safety & Privacy Commitment:
          </span>
          <p>
            SmritiCare Assistant is an empathetic cognitive care companion, not a healthcare provider. All conversations are stored privately in your local browser IndexedDB and are never shared publicly. Smriti cannot diagnose medical conditions or alter medication prescriptions.
          </p>
        </div>
      </div>

      {/* Evaluator AI Key & Engine Settings Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
      />
    </div>
  );
}
