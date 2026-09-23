import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Send,
  Sparkles,
  CheckCircle2,
  Heart,
  Clock,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../db/dexie';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { playNotificationChime } from '../../audio/synthAudio';

export default function CaregiverMessageModal({ isOpen, onClose, patient, onMessageSent = () => {} }) {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const patientName = patient?.displayName || patient?.name || 'Amma';
  const patientId = patient?.id || 1;

  const quickTemplates = [
    `Namaste ${patientName}, please remember to drink water and take your evening walk.`,
    `I am on my way home, see you in 15 minutes!`,
    `Please rest now, I have scheduled your reminder.`,
    `Hope you had a wonderful afternoon! Call me if you need anything.`
  ];

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!messageText.trim()) return;

    setIsSending(true);
    try {
      // Save notification to Dexie for the patient
      await db.notifications.add({
        userId: Number(patientId),
        title: `Message from ${currentUser?.name || 'Priya'}`,
        message: messageText.trim(),
        type: 'caregiver_message',
        priority: 'high',
        read: false,
        createdAt: new Date().toISOString()
      });

      try {
        playNotificationChime();
      } catch (err) {}

      setIsSending(false);
      setSentSuccess(true);
      onMessageSent(messageText.trim());

      setTimeout(() => {
        setSentSuccess(false);
        setMessageText('');
        onClose();
      }, 1800);
    } catch (err) {
      console.error('Failed to dispatch message:', err);
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-[#0E1719] rounded-3xl p-6 md:p-7 max-w-lg w-full shadow-2xl border border-[#ECE7DE] dark:border-[#18292D] space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#ECE7DE] dark:border-[#18292D]">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-[#0E1E2E] text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#192320] dark:text-white leading-tight">
                  {t('location.sendMessageTitle') || `Send Message to ${patientName}`}
                </h3>
                <p className="text-[11px] text-[#6E7D76] dark:text-[#889B95] font-medium">
                  {t('location.sendMessageSub') || 'Your message will appear prominently on your loved one’s screen.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {sentSuccess ? (
            <div className="py-8 text-center space-y-2 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-[#192320] dark:text-white">
                {t('location.messageDelivered') || 'Message Delivered!'}
              </h4>
              <p className="text-xs text-[#6E7D76] dark:text-[#889B95]">
                {patientName} will be notified with a gentle audio chime.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-4">
              {/* Text Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#192320] dark:text-white">
                  {t('location.messagePrompt') || 'Compose Note / Message:'}
                </label>
                <textarea
                  rows={3}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Write a gentle message for ${patientName}...`}
                  className="w-full bg-[#FAF8F5] dark:bg-[#121E22] text-xs text-[#192320] dark:text-white placeholder-[#8C9B95] dark:placeholder-[#64748B] rounded-2xl p-3.5 border border-[#ECE7DE] dark:border-[#18292D] focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all resize-none shadow-2xs"
                  autoFocus
                />
              </div>

              {/* Quick Template Pills */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#6E7D76] dark:text-[#889B95] block">
                  {t('location.quickTemplates') || 'Quick Suggestions:'}
                </span>
                <div className="space-y-1.5">
                  {quickTemplates.map((template, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMessageText(template)}
                      className="w-full p-2 rounded-xl bg-[#FAF8F5] dark:bg-[#121E22] hover:bg-blue-50 dark:hover:bg-[#0E1E2E] border border-[#ECE7DE] dark:border-[#18292D] text-left text-[11px] text-[#4A5954] dark:text-[#CBD5E1] transition-colors cursor-pointer truncate"
                    >
                      “{template}”
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#ECE7DE] dark:border-[#18292D]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-full text-xs font-bold text-[#6E7D76] dark:text-[#CBD5E1] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSending || !messageText.trim()}
                  className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? (t('common.sending') || 'Sending...') : (t('location.sendMessage') || 'Send Message')}</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
