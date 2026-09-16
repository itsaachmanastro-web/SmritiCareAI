import React, { useState, useEffect, useRef } from 'react';
import { X, Send, ShieldAlert, UserX, Flag, Check, Heart, Sparkles } from 'lucide-react';
import { communityService } from '../../services/communityService';
import { subscribeCommunityEvents } from '../../services/supabaseClient';
import { playCardFlipSound, playMatchSuccessSound } from '../../audio/synthAudio';

export default function DirectMessagesModal({
  isOpen,
  onClose,
  currentUser,
  recipient,
  onBlockUser,
  onReportUser
}) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const currentUserId = currentUser?.id ? `user-${currentUser.id}` : (currentUser?.user_id || 'user-guest');
  const recipientId = recipient?.user_id || recipient?.id;

  useEffect(() => {
    if (isOpen && recipientId) {
      loadMessages();

      // Subscribe to realtime message notifications
      const unsubscribe = subscribeCommunityEvents((event) => {
        if (event.type === 'MESSAGE_SENT') {
          const m = event.payload;
          if (
            (m.sender_id === currentUserId && m.recipient_id === recipientId) ||
            (m.sender_id === recipientId && m.recipient_id === currentUserId)
          ) {
            setMessages((prev) => [...prev, m]);
            playMatchSuccessSound();
          }
        }
      });

      return () => unsubscribe();
    }
  }, [isOpen, recipientId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    setIsLoading(true);
    const msgs = await communityService.getMessages(currentUserId, recipientId);
    setMessages(msgs);
    setIsLoading(false);
  };

  const handleSend = async (contentToSend = inputMessage) => {
    if (!contentToSend.trim()) return;

    playCardFlipSound();
    const sent = await communityService.sendMessage(currentUser, recipientId, contentToSend.trim());
    setMessages((prev) => [...prev, sent]);
    setInputMessage('');
  };

  if (!isOpen || !recipient) return null;

  const quickReplies = [
    'Thinking of you and your family today! 🌸',
    'Sending you lots of strength and patience. ❤️',
    'Thank you so much for the gentle advice! 🙏',
    'How did the morning walk go today? ☀️'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131D33] rounded-3xl md:rounded-4xl max-w-xl w-full h-[85vh] shadow-2xl border border-slate-200 dark:border-[#243352] flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 md:p-5 border-b border-slate-100 dark:border-[#243352] flex items-center justify-between bg-slate-50/80 dark:bg-[#1E293B]">
          <div className="flex items-center gap-3">
            <img
              src={recipient.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'}
              alt={recipient.display_name}
              className="w-12 h-12 rounded-full object-cover border-2 border-smriti-teal-500 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight">
                  {recipient.display_name}
                </h3>
                {recipient.show_online_status && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Online" />
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                {recipient.role_badge} {recipient.show_broad_location && recipient.broad_location ? `&bull; 📍 ${recipient.broad_location}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onReportUser('user', recipient.user_id, recipient.display_name)}
              className="p-2 text-slate-400 hover:text-rose-600 rounded-xl"
              title="Report user"
            >
              <Flag className="w-4 h-4" />
            </button>
            <button
              onClick={() => onBlockUser(recipient.user_id, recipient.display_name)}
              className="p-2 text-slate-400 hover:text-rose-600 rounded-xl"
              title="Block user"
            >
              <UserX className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 bg-[#FAF8F5] dark:bg-[#0E172A]">
          <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-3 text-center text-xs text-amber-900 dark:text-amber-200 font-medium">
            🔒 Private conversation. Phone numbers and email addresses are never revealed.
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium">
              Start a warm, supportive conversation with {recipient.display_name}.
            </div>
          ) : (
            messages.map((m) => {
              const isMine = m.sender_id === currentUserId;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-3xl text-sm md:text-base font-medium shadow-xs ${
                      isMine
                        ? 'bg-smriti-teal-600 text-white rounded-br-none'
                        : 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white border border-slate-200 dark:border-[#243352] rounded-bl-none'
                    }`}
                  >
                    {m.content}
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold mt-1 px-1">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Compassionate Reply Chips */}
        <div className="p-2.5 bg-white dark:bg-[#131D33] border-t border-slate-100 dark:border-[#243352] flex items-center gap-1.5 overflow-x-auto text-xs">
          {quickReplies.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(q)}
              className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#1E293B] hover:bg-teal-50 dark:hover:bg-teal-950/60 hover:text-teal-900 dark:hover:text-teal-200 text-slate-700 dark:text-slate-200 whitespace-nowrap font-medium border border-slate-200 dark:border-[#243352] transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Message Input Box */}
        <div className="p-3 md:p-4 bg-white dark:bg-[#131D33] border-t border-slate-200 dark:border-[#243352] flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-smriti-teal-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputMessage.trim()}
            className="bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white font-bold px-5 py-3 rounded-2xl inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
