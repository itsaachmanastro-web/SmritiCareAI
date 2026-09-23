import { useNavigate } from 'react-router-dom';
import { X, Trash2, Send, Mic, Radio, Volume2, Sparkles, AlertCircle, PhoneCall, ShieldCheck, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceButton from './VoiceButton';
import StateIndicators from './StateIndicators';
import SuggestedQuestions from './SuggestedQuestions';
import LanguageSelector from './LanguageSelector';
import ChatWindow from './ChatWindow';
import ApiKeyModal from './ApiKeyModal';
import { useVoiceAssistant } from '../../hooks/useVoiceAssistant';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ASSISTANT_STATES } from '../../services/voice/voiceAssistantService';

export default function VoiceAssistantModal({
  isOpen,
  onClose,
  currentGameId = null,
  currentGameName = null,
  currentGameState = null,
  currentScore = undefined,
  onOpenEmergency = null
}) {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
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
    canAccessVoiceAi,
    planCode,
    planName,
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

  if (!isOpen) return null;

  const handleSendText = (e) => {
    e.preventDefault();
    if (!typedInput.trim()) return;
    processQuery(typedInput);
    setTypedInput('');
  };

  const handleClear = () => {
    if (window.confirm('Clear your conversation with Smriti?')) {
      clearHistory();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-[#131D33] rounded-3xl md:rounded-4xl max-w-2xl w-full p-5 md:p-7 border border-slate-200 dark:border-[#243352] shadow-2xl flex flex-col max-h-[92vh] transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#243352] gap-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-smriti-teal-600 to-teal-800 text-white flex items-center justify-center text-2xl shadow-md shrink-0">
              🌸
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                  SmritiCare Assistant
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800">
                  AI Companion
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Voice & Text Cognitive Companion &bull; North East India
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <LanguageSelector
              currentLanguage={language}
              onSelectLanguage={(l) => setLanguage(l)}
            />

            {/* AI Engine / Gemini Key Modal */}
            <button
              type="button"
              onClick={() => setIsKeyModalOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
              title="AI Engine / Gemini API Settings"
              aria-label="AI Engine Settings"
            >
              <Key className="w-5 h-5" />
            </button>

            {/* Clear Conversation */}
            {conversations.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Clear conversation"
                aria-label="Clear chat history"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}

            {/* Close Modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
              aria-label="Close assistant"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Limited Voice Capability Notice if Applicable */}
        {currentLangConfig.limitedNotice && (
          <div className="my-2 p-2.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-2 text-amber-900 dark:text-amber-200 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{currentLangConfig.limitedNotice}</span>
          </div>
        )}

        {/* Premium Entitlement Banner if locked */}
        {!canAccessVoiceAi && (
          <div className="my-2 p-3 bg-gradient-to-r from-amber-500/15 via-teal-500/10 to-emerald-500/15 dark:from-amber-950/40 dark:to-teal-950/40 border border-amber-300 dark:border-amber-700/60 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  Voice AI is a Premium Feature
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Current plan: <span className="font-bold">{planName}</span> &bull; Upgrade to Premium (₹899)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/economy?tab=subscriptions');
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shrink-0 transition-transform active:scale-95 shadow-xs cursor-pointer"
            >
              Upgrade
            </button>
          </div>
        )}

        {/* Context Badge if Inside Game */}
        {currentGameName && (
          <div className="my-1 px-3 py-1.5 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 rounded-xl flex items-center justify-between text-xs font-bold text-smriti-teal-800 dark:text-teal-300">
            <span>🎮 Active Game Context: {currentGameName}</span>
            {currentScore !== undefined && <span>Score: {currentScore}%</span>}
          </div>
        )}

        {/* Central Chat Stream */}
        <div className="flex-1 my-3 overflow-hidden flex flex-col">
          <ChatWindow
            conversations={conversations}
            onReplay={replayMessage}
            onStopSpeaking={stopSpeaking}
            isSpeaking={isSpeaking}
            greeting={currentLangConfig.greeting}
          />
        </div>

        {/* State Indicator Banner */}
        <div className="mb-3">
          <StateIndicators
            state={state}
            liveTranscript={liveTranscript}
            errorMessage={errorMessage}
          />
        </div>

        {/* Large Voice Button Centerpiece */}
        <div className="py-2 flex justify-center">
          <VoiceButton
            state={state}
            isSpeaking={isSpeaking}
            onClick={startVoiceInput}
            onStopSpeaking={stopSpeaking}
            size="lg"
          />
        </div>

        {/* Suggested Quick Questions */}
        <div className="my-2">
          <SuggestedQuestions
            isInGame={!!currentGameId}
            isCaregiver={role === 'caregiver' || role === 'healthcare'}
            onSelectQuestion={(q) => processQuery(q)}
          />
        </div>

        {/* Text Input Fallback Bar */}
        <form onSubmit={handleSendText} className="pt-3 border-t border-slate-100 dark:border-[#243352] flex items-center gap-2">
          <input
            type="text"
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            placeholder={`Type a question in ${currentLangConfig.name} or tap the microphone...`}
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-smriti-teal-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!typedInput.trim()}
            className="p-3 rounded-2xl bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white font-bold transition-colors disabled:opacity-40 cursor-pointer shadow-md"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        {/* Evaluator AI Key & Engine Settings Modal */}
        <ApiKeyModal
          isOpen={isKeyModalOpen}
          onClose={() => setIsKeyModalOpen(false)}
        />
      </div>
    </div>
  );
}
