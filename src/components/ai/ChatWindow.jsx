import React, { useRef, useEffect } from 'react';
import { Volume2, User } from 'lucide-react';
import SmritiCompanionAvatar from '../common/SmritiCompanionAvatar';

// Robust message renderer — paragraphs, bullets, numbered lists, multi-script safe
function MessageContent({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let bulletGroup = [];
  let numberedGroup = [];

  const flushBullets = () => {
    if (bulletGroup.length > 0) {
      elements.push(
        <ul key={'ul-' + elements.length} className="list-disc list-inside space-y-0.5 my-1">
          {bulletGroup.map((item, i) => <li key={i} className="leading-relaxed">{item}</li>)}
        </ul>
      );
      bulletGroup = [];
    }
  };
  const flushNumbered = () => {
    if (numberedGroup.length > 0) {
      elements.push(
        <ol key={'ol-' + elements.length} className="list-decimal list-inside space-y-0.5 my-1">
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
      bulletGroup.push(trimmed.replace(/^[-*]\s+/, ''));
      return;
    }
    if (/^\d+\.\s+/.test(trimmed)) {
      flushBullets();
      numberedGroup.push(trimmed.replace(/^\d+\.\s+/, ''));
      return;
    }
    flushBullets(); flushNumbered();
    elements.push(<p key={'p-' + i} className="leading-relaxed mb-1 last:mb-0">{trimmed}</p>);
  });
  flushBullets(); flushNumbered();
  return <div className="break-words text-sm leading-relaxed">{elements}</div>;
}

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
      className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[380px] md:max-h-[440px] rounded-2xl bg-[#F5FAF7]/80 dark:bg-[#0D1C19]/80 border border-[#C8DFCE] dark:border-[#172E28]"
    >
      {/* Welcome card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0F221D] border border-[#D5E8DC] dark:border-[#1B3530] flex items-start gap-3 shadow-sm">
        <div className="shrink-0">
          <SmritiCompanionAvatar className="w-10 h-10" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#0D9488] dark:text-[#2DD4BF]">
              Smriti · Care Companion
            </span>
          </div>
          <p className="text-sm font-medium text-[#192320] dark:text-[#E2F5EC] leading-relaxed">
            {greeting || 'Hello! I am Smriti, your care companion. Tap the microphone or ask me anything below.'}
          </p>
        </div>
      </div>

      {/* Conversation thread */}
      {conversations.map((msg, idx) => {
        const isUser = msg.role === 'user';
        return (
          <div
            key={msg.id || idx}
            className={'flex items-end gap-2.5 ' + (isUser ? 'flex-row-reverse' : 'flex-row')}
          >
            {/* Avatar */}
            <div className={
              'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-0.5 ' +
              (isUser
                ? 'bg-[#143D30] dark:bg-[#1B5E40] text-white'
                : 'bg-[#DCF0E4] dark:bg-[#0D2318] border border-[#BAD9C6] dark:border-[#153A28]')
            }>
              {isUser
                ? <User className="w-4 h-4" />
                : <SmritiCompanionAvatar className="w-6 h-6" />
              }
            </div>

            {/* Bubble */}
            <div className={'max-w-[80%] flex flex-col ' + (isUser ? 'items-end' : 'items-start')}>
              <div className={'flex items-center gap-1.5 px-1 mb-1 text-[10px] text-[#6E7D76] dark:text-[#889B95] ' + (isUser ? 'flex-row-reverse' : '')}>
                <span className="font-bold text-[#192320] dark:text-[#E2F5EC]">{isUser ? 'You' : 'Smriti'}</span>
                {!isUser && msg.source && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#E8F0EB] dark:bg-[#0D2318] text-[#6E7D76] dark:text-[#889B95]">
                    {msg.source === 'gemini' ? 'Gemini AI' : 'Offline'}
                  </span>
                )}
                {!isUser && (
                  <button
                    type="button"
                    onClick={() => onReplay(msg.message || msg.text, msg.language)}
                    className="p-0.5 rounded-full hover:bg-[#E8F0EB] dark:hover:bg-[#172E28] text-[#0D9488] dark:text-[#2DD4BF] transition-colors cursor-pointer"
                    title="Listen aloud"
                    aria-label="Replay response aloud"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className={
                'px-3.5 py-3 shadow-sm ' +
                (isUser
                  ? 'bg-[#143D30] text-white rounded-2xl rounded-br-sm dark:bg-[#1B5E40] dark:text-[#E2F5EC]'
                  : 'bg-white text-[#192320] rounded-2xl rounded-bl-sm border border-[#D5E8DC] dark:bg-[#0F221D] dark:text-[#E2F5EC] dark:border-[#1B3530]')
              }>
                <MessageContent text={msg.message || msg.text} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

