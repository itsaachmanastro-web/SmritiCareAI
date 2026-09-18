import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mic,
  Send,
  Volume2,
  Globe,
  Sun,
  Moon,
  ChevronDown,
  Check,
  Gamepad2,
  Calendar,
  Heart,
  MessageCircle,
  Leaf,
  CheckCheck,
  Trash2,
  WifiOff,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { SmritiLogo } from "../../components/common/NerIcons";
import SmritiCompanionAvatar from "../../components/common/SmritiCompanionAvatar";
import { useVoiceAssistant } from "../../hooks/useVoiceAssistant";
import { useLanguage, SUPPORTED_LANGUAGES } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { speechService } from "../../services/speech/speechService";
import { ASSISTANT_STATES } from "../../services/voice/voiceAssistantService";

// Robust Message Renderer — handles paragraphs, bullets, numbered lists, multi-script
function MessageContent({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let bulletGroup = [];
  let numberedGroup = [];

  const flushBullets = () => {
    if (bulletGroup.length > 0) {
      elements.push(
        <ul key={"ul-" + elements.length} className="list-disc list-inside space-y-0.5 my-1">
          {bulletGroup.map((item, i) => <li key={i} className="leading-relaxed">{item}</li>)}
        </ul>
      );
      bulletGroup = [];
    }
  };
  const flushNumbered = () => {
    if (numberedGroup.length > 0) {
      elements.push(
        <ol key={"ol-" + elements.length} className="list-decimal list-inside space-y-0.5 my-1">
          {numberedGroup.map((item, i) => <li key={i} className="leading-relaxed">{item}</li>)}
        </ol>
      );
      numberedGroup = [];
    }
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) { flushBullets(); flushNumbered(); return; }
    if (/^[-*]\s+/.test(trimmed)) {
      flushNumbered();
      bulletGroup.push(trimmed.replace(/^[-*]\s+/, ""));
      return;
    }
    if (/^\d+\.\s+/.test(trimmed)) {
      flushBullets();
      numberedGroup.push(trimmed.replace(/^\d+\.\s+/, ""));
      return;
    }
    flushBullets(); flushNumbered();
    elements.push(<p key={"p-" + i} className="leading-relaxed mb-1 last:mb-0">{trimmed}</p>);
  });
  flushBullets(); flushNumbered();
  return <div className="break-words">{elements}</div>;
}

// Animated 3-dot thinking indicator
function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0,1,2].map(i => (
        <span key={i}
          className="w-2 h-2 rounded-full bg-[#0D9488] dark:bg-[#2DD4BF] inline-block animate-bounce"
          style={{ animationDelay: i * 0.15 + "s", animationDuration: "0.9s" }}
        />
      ))}
    </div>
  );
}

// Status badge mapped to real assistant state
function StatusBadge({ state, t, isOnline }) {
  if (!isOnline) return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-500 dark:text-rose-400">
      <WifiOff className="w-3 h-3" />{t("assistant.statusOffline") || "Offline"}
    </span>
  );
  if (state === ASSISTANT_STATES.THINKING || state === ASSISTANT_STATES.UNDERSTANDING) return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 animate-pulse">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
      {t("assistant.statusThinking") || "Thinking..."}
    </span>
  );
  if (state === ASSISTANT_STATES.LISTENING) return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-500 dark:text-rose-400 animate-pulse">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
      {t("assistant.statusListening") || "Listening..."}
    </span>
  );
  if (state === ASSISTANT_STATES.SPEAKING) return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0D9488] dark:text-[#2DD4BF] animate-pulse">
      <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] dark:bg-[#2DD4BF] inline-block" />
      {t("assistant.statusSpeaking") || "Speaking..."}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#22C55E] dark:text-[#4ADE80]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] dark:bg-[#4ADE80] inline-block" />
      {t("assistant.statusReady") || "Ready"}
    </span>
  );
}

export default function AssistantPage() {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { currentUser } = useAuth();
  const [typedInput, setTypedInput] = useState("");
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const langDropdownRef = useRef(null);

  // All existing hook calls preserved exactly
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
  } = useVoiceAssistant({ autoGreet: false });

  const isListening = state === ASSISTANT_STATES.LISTENING;
  const isThinking = state === ASSISTANT_STATES.THINKING || state === ASSISTANT_STATES.UNDERSTANDING;

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  useEffect(() => {
    const handle = (e) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Seeded default conversation
  const defaultConversation = [
    { id: "seed-1", role: "user", text: "\u092E\u0947\u0930\u0940 \u0926\u0935\u093E\u0908 \u0915\u092C \u0932\u0947\u0928\u0940 \u0939\u0948?", time: "10:24 AM", lang: "hi" },
    { id: "seed-2", role: "assistant", text: "\u0906\u092A\u0915\u0940 \u0905\u0917\u0932\u0940 \u0926\u0935\u093E\u0908 \u0906\u091C \u0936\u093E\u092E 6:30 \u092C\u091C\u0947 \u0939\u0948\u0964\n\u092E\u0948\u0902 \u0906\u092A\u0915\u094B \u0938\u092E\u092F \u092A\u0930 \u092F\u093E\u0926 \u0926\u093F\u0932\u093E\u090A\u0901\u0917\u0940\u0964\n\u0915\u094D\u092F\u093E \u0906\u092A \u0926\u0935\u093E\u0908 \u0915\u093E \u0928\u093E\u092E \u0926\u0947\u0916\u0928\u093E \u091A\u093E\u0939\u0947\u0902\u0917\u0947?", time: "10:24 AM", lang: "hi", chips: ["\u0939\u093E\u0901, \u0926\u093F\u0916\u093E\u0907\u090F", "\u0928\u0939\u0940\u0902, \u0927\u0928\u094D\u092F\u0935\u093E\u0926"] },
    { id: "seed-3", role: "user", text: "\u0906\u091C \u092E\u0941\u091D\u0947 \u0925\u094B\u0921\u093C\u093E \u0925\u0915\u093E\u0928 \u092E\u0939\u0938\u0942\u0938 \u0939\u094B \u0930\u0939\u093E \u0939\u0948\u0964", time: "10:26 AM", lang: "hi" },
    { id: "seed-4", role: "assistant", text: "\u092E\u0948\u0902 \u0938\u092E\u091D \u0938\u0915\u0924\u0940 \u0939\u0942\u0901\u0964\n\u0915\u094D\u092F\u093E \u0906\u092A \u0925\u094B\u0921\u093C\u093E \u0906\u0930\u093E\u092E \u0915\u0930\u0928\u093E \u091A\u093E\u0939\u0947\u0902\u0917\u0947?\n\u0905\u0917\u0930 \u0925\u0915\u093E\u0928 \u091C\u093C\u094D\u092F\u093E\u0926\u093E \u0939\u0948 \u0924\u094B \u092E\u0948\u0902 \u0906\u092A\u0915\u0947 \u0915\u0947\u092F\u0930\u0917\u093F\u0935\u0930 \u0915\u094B \u092D\u0940 \u0938\u0942\u091A\u093F\u0924 \u0915\u0930 \u0938\u0915\u0924\u0940 \u0939\u0942\u0901\u0964", time: "10:26 AM", lang: "hi", chips: ["\u0920\u0940\u0915 \u0939\u0948", "\u092A\u093E\u0928\u0940 \u092A\u0940 \u0932\u093F\u092F\u093E \u0939\u0948", "\u0915\u0947\u092F\u0930\u0917\u093F\u0935\u0930 \u0915\u094B \u092C\u0924\u093E\u0907\u090F"] }
  ];

  const displayMessages = conversations && conversations.length > 0
    ? conversations.map((c, i) => ({
        id: c.id || "live-" + i,
        role: c.sender === "user" ? "user" : "assistant",
        text: c.text || c.message || "",
        time: c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now",
        chips: c.quickReplies || []
      }))
    : defaultConversation;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, liveTranscript, isThinking]);

  // All original handlers preserved exactly
  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!typedInput.trim()) return;
    processQuery(typedInput.trim());
    setTypedInput("");
  };
  const handleChipClick = (chipText) => processQuery(chipText);
  const handleMicToggle = () => isListening ? stopVoiceInput() : startVoiceInput();
  const handlePlayAudio = (text) => isSpeaking ? stopSpeaking() : speechService.speak(text, language);
  const handleFocusInput = useCallback(() => inputRef.current?.focus(), []);

  const regionalLanguages = [
    { code: "en", label: "English", flag: "\uD83C\uDDEC\uD83C\uDDE7" },
    { code: "hi", label: "\u0939\u093F\u0902\u0926\u0940", flag: "\uD83C\uDDEE\uD83C\uDDF3" },
    { code: "as", label: "\u0985\u09B8\u09AE\u09C0\u09AF\u09BC\u09BE", flag: "\uD83C\uDF3A" },
    { code: "bn", label: "\u09AC\u09BE\u0982\u09B2\u09BE", flag: "\uD83C\uDDE7\uD83C\uDDE9" },
    { code: "mni", label: "\u09AE\u09C8\u09A4\u09C8\u09B2\u09CB\u09A8\u09CD", flag: "\uD83D\uDEE1\uFE0F" }
  ];
  const currentLangObj = regionalLanguages.find(l => l.code === language) || regionalLanguages[0];
  const userName = currentUser?.name?.split(" ")[0] || "Amma";
  const userPhoto = currentUser?.photoUrl || "/assets/images/auth-patient.jpg";

  return (
    <div className="min-h-screen bg-[#F0F7F2] dark:bg-[#060F0D] text-[#192320] dark:text-[#F1F5F5] font-sans antialiased transition-colors duration-300 flex flex-col">

      {!isOnline && (
        <div className="w-full bg-rose-600 text-white text-xs font-medium py-2 px-4 flex items-center justify-center gap-2 z-50">
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>{t("assistant.offlineBanner") || "You are offline. Responses may be limited."}</span>
        </div>
      )}

      {/* STICKY HEADER */}
      <header className="sticky top-0 z-30 w-full bg-[#F0F7F2]/95 dark:bg-[#060F0D]/95 backdrop-blur-md border-b border-[#C8DFCE] dark:border-[#122520] px-4 md:px-8 py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2.5 group cursor-pointer" aria-label="SmritiCare Home">
            <div className="w-9 h-9 rounded-xl bg-[#DCF0E4] dark:bg-[#0D2318] flex items-center justify-center p-1.5 border border-[#BAD9C6] dark:border-[#153A28] group-hover:scale-105 transition-transform shadow-sm">
              <SmritiLogo className="w-full h-full text-[#143D30] dark:text-[#2DD4BF]" showText={false} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-serif font-bold text-lg tracking-tight text-[#192320] dark:text-[#F1F5F5]">SmritiCare</span>
              <span className="text-[10px] text-[#6E7D76] dark:text-[#7A938C] tracking-wide font-medium mt-0.5">AI Care Companion</span>
            </div>
          </button>

          {/* Smriti status pill */}
          <div className="hidden sm:flex items-center gap-2 bg-white/70 dark:bg-[#0E1A17]/70 border border-[#C8DFCE] dark:border-[#1B3530] rounded-full px-3 py-1.5 shadow-sm">
            <SmritiCompanionAvatar className="w-6 h-6" isListening={isListening} isSpeaking={isSpeaking} />
            <span className="text-xs font-semibold text-[#192320] dark:text-[#E2F5EC]">{t("assistant.smriti") || "Smriti"}</span>
            <span className="w-px h-3.5 bg-[#C8DFCE] dark:bg-[#1B3530]" />
            <StatusBadge state={state} t={t} isOnline={isOnline} />
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/80 dark:bg-[#0E1A17]/80 border border-[#C8DFCE] dark:border-[#1B3530] text-xs font-medium text-[#4A5954] dark:text-[#94A3B8] hover:bg-white dark:hover:bg-[#0E1A17] transition-all cursor-pointer shadow-sm"
              aria-label="Toggle Theme">
              {isDark ? <Moon className="w-3.5 h-3.5 text-[#2DD4BF]" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
              <span className="hidden sm:inline">{isDark ? "Dark" : "Light"}</span>
            </button>

            <div className="relative" ref={langDropdownRef}>
              <button type="button" onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/80 dark:bg-[#0E1A17]/80 border border-[#C8DFCE] dark:border-[#1B3530] text-xs font-medium text-[#192320] dark:text-[#CBD5E1] hover:border-[#143D30] dark:hover:border-[#2DD4BF] transition-all cursor-pointer shadow-sm"
                aria-label="Select Language">
                <Globe className="w-3.5 h-3.5 text-[#0D9488] dark:text-[#2DD4BF]" />
                <span className="hidden sm:inline">{currentLangObj.flag} {currentLangObj.label}</span>
                <span className="sm:hidden">{currentLangObj.flag}</span>
                <ChevronDown className={"w-3 h-3 text-[#8C9B95] transition-transform duration-200 " + (langDropdownOpen ? "rotate-180" : "")} />
              </button>
              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#0E1A17] border border-[#C8DFCE] dark:border-[#1B3530] rounded-2xl shadow-2xl py-1.5 z-50 overflow-hidden">
                  {regionalLanguages.map(l => (
                    <button key={l.code} type="button" onClick={() => { setLanguage(l.code); setLangDropdownOpen(false); }}
                      className={"w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left transition-colors cursor-pointer " + (language === l.code ? "bg-[#DCF0E4] dark:bg-[#0D2318] text-[#143D30] dark:text-[#4ADE80] font-bold" : "text-[#4A5954] dark:text-[#94A3B8] hover:bg-black/5 dark:hover:bg-white/5")}>
                      <span className="flex items-center gap-2.5"><span className="text-sm">{l.flag}</span><span>{l.label}</span></span>
                      {language === l.code && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pl-2 border-l border-[#C8DFCE] dark:border-[#1B3530]">
              <img src={userPhoto} alt={userName} className="w-8 h-8 rounded-full object-cover border-2 border-[#A8D5B4] dark:border-[#1B5E40] shadow-sm" />
              <div className="hidden md:flex flex-col leading-tight">
                <span className="text-xs font-bold text-[#192320] dark:text-white">{userName}</span>
                <span className="text-[10px] text-[#6E7D76] dark:text-[#7A938C]">Good to see you!</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 md:px-8 py-5 flex flex-col gap-5">

        {/* WELCOME HERO */}
        <section className="bg-white/80 dark:bg-[#0D1C19]/80 border border-[#C8DFCE] dark:border-[#172E28] rounded-2xl md:rounded-3xl px-5 py-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <SmritiCompanionAvatar className="w-16 h-16 sm:w-20 sm:h-20" isAnimated={true} isListening={isListening} isSpeaking={isSpeaking} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#192320] dark:text-white leading-tight">{t("assistant.welcome") || "Namaste! \uD83D\uDC4B"}</h1>
              <p className="text-sm font-semibold text-[#0D9488] dark:text-[#2DD4BF] mt-0.5">{t("assistant.careCompanion") || "I am Smriti, your care companion."}</p>
              <p className="text-xs text-[#6E7D76] dark:text-[#889B95] mt-1 max-w-md leading-relaxed">{t("assistant.heroDesc") || "I am here to listen, answer your questions, give reminders, play cognitive games and support you."}</p>
              <div className="sm:hidden mt-2"><StatusBadge state={state} t={t} isOnline={isOnline} /></div>
            </div>
          </div>
          <div className="hidden lg:flex flex-col items-end text-right shrink-0 pl-4">
            <p className="font-serif italic text-xl xl:text-2xl text-[#143D30] dark:text-[#86EFAC] leading-none transform -rotate-1 select-none">
              {t("assistant.smallerSteps") || "Smaller Steps."}<br />
              <span className="text-base xl:text-lg text-[#3A4742] dark:text-[#CBD5E1] not-italic font-medium">{t("assistant.brighterTomorrows") || "Brighter Tomorrows."}</span>
            </p>
            <div className="flex items-center gap-1 text-[#22C55E] mt-1.5 opacity-60">
              <Leaf className="w-3.5 h-3.5" /><Leaf className="w-4 h-4 transform rotate-45" />
            </div>
          </div>
        </section>

        {/* TWO-COLUMN GRID */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">

          {/* LEFT: CHAT PANEL */}
          <div className="lg:col-span-8 bg-white dark:bg-[#0D1C19] border border-[#C8DFCE] dark:border-[#172E28] rounded-2xl md:rounded-3xl shadow-sm flex flex-col overflow-hidden min-h-[480px] md:min-h-[520px]">

            {/* Chat header strip */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[#E8F0EB] dark:border-[#172E28]">
              <div className="flex items-center gap-2">
                <SmritiCompanionAvatar className="w-7 h-7" isListening={isListening} isSpeaking={isSpeaking} />
                <span className="text-sm font-bold text-[#192320] dark:text-white">{t("assistant.smriti") || "Smriti"}</span>
                <StatusBadge state={state} t={t} isOnline={isOnline} />
              </div>
              <button type="button" onClick={clearHistory}
                className="flex items-center gap-1.5 text-[11px] text-[#8C9B95] dark:text-[#4A6860] hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20"
                title={t("assistant.clearHistory") || "Clear History"}>
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t("assistant.clearHistory") || "Clear"}</span>
              </button>
            </div>

            {/* Messages thread */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-4">
              {displayMessages.map((msg, idx) => (
                <div key={msg.id || idx} className={"flex items-end gap-2.5 " + (msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role !== "user" && (
                    <div className="w-8 h-8 rounded-full bg-[#DCF0E4] dark:bg-[#0D2318] flex items-center justify-center shrink-0 border border-[#BAD9C6] dark:border-[#153A28] mb-0.5">
                      <SmritiCompanionAvatar className="w-6 h-6" />
                    </div>
                  )}
                  <div className={"max-w-[80%] sm:max-w-[72%] flex flex-col " + (msg.role === "user" ? "items-end" : "items-start")}>
                    <div className={"flex items-center gap-1.5 px-1 mb-1.5 text-[10px] text-[#6E7D76] dark:text-[#889B95] " + (msg.role === "user" ? "flex-row-reverse" : "")}>
                      <span className="font-bold text-[#192320] dark:text-[#E2F5EC]">{msg.role === "user" ? (t("assistant.you") || "You") : (t("assistant.smriti") || "Smriti")}</span>
                      <span>·</span>
                      <span>{msg.time}</span>
                      {msg.role === "user" && <CheckCheck className="w-3 h-3 text-[#0D9488] dark:text-[#2DD4BF]" />}
                      {msg.role !== "user" && (
                        <button type="button" onClick={() => handlePlayAudio(msg.text)}
                          className="p-0.5 rounded-full hover:bg-[#E8F0EB] dark:hover:bg-[#172E28] text-[#0D9488] dark:text-[#2DD4BF] transition-colors cursor-pointer"
                          title={t("assistant.listenToResponse") || "Listen"} aria-label="Play audio">
                          <Volume2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className={"px-3.5 sm:px-4 py-3 text-xs sm:text-sm shadow-sm " + (msg.role === "user" ? "bg-[#143D30] text-white rounded-2xl rounded-br-sm dark:bg-[#1B5E40] dark:text-[#E2F5EC]" : "bg-[#F5FAF7] text-[#192320] rounded-2xl rounded-bl-sm border border-[#D5E8DC] dark:bg-[#0F221D] dark:text-[#E2F5EC] dark:border-[#1B3530]")}>
                      <MessageContent text={msg.text} />
                    </div>
                    {msg.role !== "user" && msg.chips && msg.chips.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2.5">
                        {msg.chips.map((chip, cIdx) => (
                          <button key={cIdx} type="button" onClick={() => handleChipClick(chip)}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-[#0F221D] border border-[#C8DFCE] dark:border-[#1B3530] text-[#143D30] dark:text-[#86EFAC] hover:bg-[#DCF0E4] dark:hover:bg-[#172E28] hover:border-[#143D30] dark:hover:border-[#2DD4BF] transition-all cursor-pointer active:scale-95 shadow-sm">{chip}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 border-[#A8D5B4] dark:border-[#1B5E40] mb-0.5">
                      <img src={userPhoto} alt={t("assistant.you") || "You"} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              ))}

              {isListening && liveTranscript && (
                <div className="flex items-start gap-2.5 mx-2">
                  <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
                    <Mic className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                  </div>
                  <div className="flex-1 px-4 py-2.5 rounded-2xl rounded-bl-sm bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 italic animate-pulse">"{liveTranscript}"</div>
                </div>
              )}

              {isThinking && (
                <div className="flex items-end gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#DCF0E4] dark:bg-[#0D2318] flex items-center justify-center shrink-0 border border-[#BAD9C6] dark:border-[#153A28]">
                    <SmritiCompanionAvatar className="w-6 h-6" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-[#F5FAF7] dark:bg-[#0F221D] border border-[#D5E8DC] dark:border-[#1B3530] shadow-sm">
                    <ThinkingDots />
                    <p className="text-[10px] text-[#6E7D76] dark:text-[#889B95] mt-1">{t("assistant.thinking") || "Smriti is thinking..."}</p>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 mx-1">
                  <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">{t("assistant.errorTitle") || "Oops! Something went wrong."}</p>
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">{errorMessage}</p>
                  </div>
                  <button type="button" onClick={() => processQuery("")}
                    className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 cursor-pointer px-2 py-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors">
                    <RefreshCw className="w-3 h-3" />{t("assistant.errorRetry") || "Retry"}
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* INPUT BAR */}
            <div className="px-3 sm:px-5 py-3.5 border-t border-[#E8F0EB] dark:border-[#172E28] bg-white/80 dark:bg-[#0D1C19]/80">
              <form onSubmit={handleSend} className="flex items-center gap-2 sm:gap-3">
                <button type="button" onClick={handleMicToggle}
                  className={"w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-md " + (isListening ? "bg-rose-500 hover:bg-rose-600 text-white ring-4 ring-rose-300 dark:ring-rose-900 animate-pulse" : "bg-[#143D30] hover:bg-[#0E2D23] dark:bg-[#2DD4BF] dark:hover:bg-[#20B8A5] text-white dark:text-[#060F0D]")}
                  title={isListening ? (t("assistant.stopListening") || "Stop listening") : (t("assistant.startSpeaking") || "Start speaking")}
                  aria-label="Toggle Voice Input">
                  <Mic className="w-5 h-5" />
                </button>
                <div className="relative flex-1">
                  <input ref={inputRef} type="text" value={typedInput} onChange={(e) => setTypedInput(e.target.value)}
                    placeholder={isListening ? (t("assistant.listening") || "Listening... speak now") : (t("assistant.askPlaceholder") || "Ask Smriti anything...")}
                    className="w-full bg-[#F5FAF7] dark:bg-[#0B1815] text-sm text-[#192320] dark:text-white placeholder-[#8C9B95] dark:placeholder-[#4A6860] rounded-full px-5 py-3 border border-[#C8DFCE] dark:border-[#1B3530] focus:border-[#143D30] dark:focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#143D30]/10 dark:focus:ring-[#2DD4BF]/10 outline-none transition-all shadow-inner"
                    aria-label="Type your message" />
                </div>
                <button type="submit" disabled={!typedInput.trim()}
                  className="w-12 h-12 rounded-full bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-sm active:scale-95"
                  aria-label="Send message">
                  <Send className="w-5 h-5 transform -rotate-12" />
                </button>
              </form>
              <p className="text-[11px] text-center text-[#8C9B95] dark:text-[#4A6860] mt-2 font-medium select-none">{t("assistant.micTapPrompt") || "Or tap the mic to speak"}</p>
            </div>
          </div>

          {/* RIGHT: SIDEBAR */}
          <div className="lg:col-span-4 flex flex-col gap-4">

            {/* Language selector card */}
            <div className="bg-white dark:bg-[#0D1C19] border border-[#C8DFCE] dark:border-[#172E28] rounded-2xl md:rounded-3xl p-4 shadow-sm">
              <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-[#E8F0EB] dark:border-[#172E28]">
                <div className="w-8 h-8 rounded-xl bg-[#DCF0E4] dark:bg-[#0D2318] text-[#143D30] dark:text-[#2DD4BF] flex items-center justify-center border border-[#BAD9C6] dark:border-[#153A28]">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#192320] dark:text-white leading-tight">{t("assistant.chooseLanguage") || "Choose Language"}</h3>
                  <span className="text-[10px] text-[#6E7D76] dark:text-[#7A938C]">{t("assistant.voiceEnabled") || "(Voice Enabled)"}</span>
                </div>
              </div>
              <div className="space-y-2">
                {regionalLanguages.map((l) => {
                  const isActive = language === l.code;
                  return (
                    <button key={l.code} type="button" onClick={() => setLanguage(l.code)}
                      className={"w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer " + (isActive ? "bg-[#DCF0E4] border-[#143D30] text-[#143D30] dark:bg-[#0D2318] dark:border-[#2DD4BF] dark:text-[#86EFAC] shadow-sm" : "bg-[#F5FAF7] dark:bg-[#0B1815] border-[#C8DFCE] dark:border-[#1B3530] text-[#4A5954] dark:text-[#889B95] hover:border-[#143D30]/50 dark:hover:border-[#2DD4BF]/40")}>
                      <div className="flex items-center gap-2.5"><span className="text-base">{l.flag}</span><span>{l.label}</span></div>
                      {isActive && <div className="w-5 h-5 rounded-full bg-[#143D30] dark:bg-[#2DD4BF] text-white dark:text-[#060F0D] flex items-center justify-center"><Check className="w-3 h-3" /></div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Care / support card */}
            <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-[#C8DFCE] dark:border-[#172E28] shadow-sm flex-1 min-h-[140px]">
              {isDark ? (
                <div className="h-full bg-[#0D1C19] p-4 sm:p-5 flex flex-col justify-center items-start">
                  <div className="w-8 h-8 rounded-xl bg-[#0D2318] border border-[#153A28] flex items-center justify-center text-[#2DD4BF] mb-3">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <p className="font-serif italic text-sm text-[#E2F5EC] leading-snug">{t("assistant.botanicalQuoteDark") || "\u201CA kinder tomorrow for every generation.\u201D"}</p>
                  <span className="text-[10px] text-[#4A6860] mt-2 font-medium">{t("assistant.sanctuary") || "SmritiCare Cognitive Sanctuary"}</span>
                </div>
              ) : (
                <div className="h-full bg-[#F5FAF7] p-4 sm:p-5 flex items-center gap-3.5">
                  <img src="/assets/images/auth-patient.jpg" alt="Care" className="w-16 h-16 rounded-2xl object-cover border border-[#BAD9C6] shadow-sm shrink-0" />
                  <div>
                    <p className="font-serif italic text-sm text-[#192320] leading-snug">{t("assistant.botanicalQuoteLight") || "\u201CYou\u2019re not alone. We\u2019re here with you.\u201D"}</p>
                    <div className="w-8 h-px bg-[#143D30]/30 mt-2" />
                    <span className="text-[10px] text-[#6E7D76] mt-1.5 inline-block font-medium">{t("assistant.sanctuary") || "SmritiCare"}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* FOUR QUICK ACTION CARDS */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button type="button" onClick={() => navigate("/patient/games")} className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0D1C19] border border-[#C8DFCE] dark:border-[#172E28] hover:border-[#143D30] dark:hover:border-[#2DD4BF] hover:shadow-md flex flex-col items-center justify-center text-center transition-all cursor-pointer group shadow-sm active:scale-97">
            <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] dark:bg-[#0A2016] text-[#1B5E20] dark:text-[#4ADE80] flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform"><Gamepad2 className="w-5 h-5" /></div>
            <span className="text-xs sm:text-sm font-bold text-[#192320] dark:text-white leading-tight">{t("assistant.quickActions.game") || "Play a Memory Game"}</span>
          </button>
          <button type="button" onClick={() => processQuery("What are my reminders for today?")} className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0D1C19] border border-[#C8DFCE] dark:border-[#172E28] hover:border-amber-500 dark:hover:border-amber-400 hover:shadow-md flex flex-col items-center justify-center text-center transition-all cursor-pointer group shadow-sm active:scale-97">
            <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] dark:bg-[#2A1E08] text-[#B45309] dark:text-[#FCD34D] flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform"><Calendar className="w-5 h-5" /></div>
            <span className="text-xs sm:text-sm font-bold text-[#192320] dark:text-white leading-tight">{t("assistant.quickActions.reminders") || "Today's Reminders"}</span>
          </button>
          <button type="button" onClick={() => processQuery("How are you feeling today?")} className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0D1C19] border border-[#C8DFCE] dark:border-[#172E28] hover:border-pink-500 dark:hover:border-pink-400 hover:shadow-md flex flex-col items-center justify-center text-center transition-all cursor-pointer group shadow-sm active:scale-97">
            <div className="w-10 h-10 rounded-xl bg-[#FCE7F3] dark:bg-[#2C1220] text-[#BE185D] dark:text-[#F472B6] flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform"><Heart className="w-5 h-5" /></div>
            <span className="text-xs sm:text-sm font-bold text-[#192320] dark:text-white leading-tight">{t("assistant.quickActions.feeling") || "How are You Feeling?"}</span>
          </button>
          <button type="button" onClick={handleFocusInput} className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0D1C19] border border-[#C8DFCE] dark:border-[#172E28] hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md flex flex-col items-center justify-center text-center transition-all cursor-pointer group shadow-sm active:scale-97">
            <div className="w-10 h-10 rounded-xl bg-[#DBEAFE] dark:bg-[#0E1E38] text-[#1D4ED8] dark:text-[#60A5FA] flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform"><MessageCircle className="w-5 h-5" /></div>
            <span className="text-xs sm:text-sm font-bold text-[#192320] dark:text-white leading-tight">{t("assistant.quickActions.askAnything") || "Ask Anything"}</span>
          </button>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-[#C8DFCE] dark:border-[#122520] py-4 px-4 md:px-8 mt-2 transition-colors bg-white/60 dark:bg-[#060F0D]/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6E7D76] dark:text-[#7A938C]">
          <div className="flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5 text-[#22C55E]" />
            <span className="font-semibold text-[#192320] dark:text-[#CBD5E1]">{t("common.footerTagline") || "Healthier Minds. Happier Tomorrows."}</span>
          </div>
          <span>{t("common.footerSub") || "Designed for a kinder, brighter tomorrow."}</span>
        </div>
      </footer>
    </div>
  );
}
