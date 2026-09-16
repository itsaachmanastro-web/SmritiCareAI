import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, CheckCircle2, Clock, Volume2, Sparkles, Bell, Heart, Pill, Droplet, Utensils, Stethoscope } from 'lucide-react';
import confetti from 'canvas-confetti';
import ElderButton from '../../components/common/ElderButton';
import VoicePromptCard from '../../components/common/VoicePromptCard';
import { db } from '../../db/dexie';
import { toggleReminder } from '../../db/syncService';
import { playMatchSuccessSound, playTokaBambooSound, playVictorySound } from '../../audio/synthAudio';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export default function PatientReminders() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { openDrawer, unreadCount } = useNotifications();
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed'

  const currentUserId = currentUser?.id;

  // Read real live reminders from Dexie IndexedDB scoped to authenticated patient
  const reminders = useLiveQuery(
    async () => {
      if (!currentUserId) return [];
      const all = await db.reminders.toArray();
      return all.filter(r => Number(r.targetUserId) === Number(currentUserId) || Number(r.userId) === Number(currentUserId) || Number(r.patientId) === Number(currentUserId));
    },
    [currentUserId]
  ) || [];

  const handleToggle = async (id, currentDone) => {
    const newStatus = !currentDone;
    if (newStatus) {
      playMatchSuccessSound();
      // Check if this was the last remaining pending reminder
      const pendingCount = reminders.filter(r => !r.done && r.id !== id).length;
      if (pendingCount === 0) {
        playVictorySound();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#0d9488', '#ea580c', '#10b981', '#f59e0b']
        });
      }
    } else {
      playTokaBambooSound();
    }
    await toggleReminder(id, newStatus);
    if (newStatus) {
      try {
        const notifs = await db.notifications.where('reminderId').equals(Number(id)).toArray();
        for (const n of notifs) {
          if (!n.isRead) {
            await db.notifications.update(n.id, { isRead: true, readAt: new Date().toISOString() });
          }
        }
      } catch (e) {
        console.warn('Could not sync notification read status:', e);
      }
    }
  };

  const typeConfig = {
    medicine: {
      icon: '💊',
      label: 'Medicine',
      bgBadge: 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/80'
    },
    water: {
      icon: '💧',
      label: 'Hydration',
      bgBadge: 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/80'
    },
    routine: {
      icon: '🍲',
      label: 'Daily Care',
      bgBadge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/80'
    },
    appointment: {
      icon: '🩺',
      label: 'PHC Checkup',
      bgBadge: 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/80'
    }
  };

  // Find the next pending reminder to highlight in the voice card
  const nextPending = reminders.find((r) => !r.done);
  const completedCount = reminders.filter((r) => r.done).length;
  const totalCount = reminders.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

  const filteredReminders = reminders.filter((r) => {
    if (filter === 'pending') return !r.done;
    if (filter === 'completed') return r.done;
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
      {/* Navigation Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={() => navigate('/patient/home')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-100 dark:bg-[#131D33] dark:hover:bg-[#1E293B] border border-slate-200 dark:border-[#243352] text-slate-800 dark:text-slate-100 font-bold text-base md:text-lg min-h-[52px] shadow-xs active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          <span>{t('common.back')}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Notification Center Quick Access */}
          <button
            type="button"
            onClick={() => openDrawer('reminders')}
            className="inline-flex items-center gap-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-3.5 py-2 rounded-2xl font-black text-xs md:text-sm shadow-xs transition-colors cursor-pointer min-h-[48px]"
            title={t('notifications.title') || 'Alerts'}
          >
            <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">{t('notifications.title') || 'Alerts'}</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Adherence Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-4 py-2 rounded-2xl font-black text-sm md:text-base shadow-xs min-h-[48px]">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>{t('dashboard.remindersProgressBadge', { done: completedCount, total: totalCount })}</span>
          </div>
        </div>
      </div>

      {/* Title & Encouragement */}
      <div className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white font-display tracking-tight">
          {t('reminders.title')}
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-base md:text-lg font-medium mt-1.5">
          {t('reminders.subtitle')}
        </p>

        {/* Adherence Progress Bar */}
        <div className="mt-4 max-w-md mx-auto">
          <div className="w-full bg-slate-200 dark:bg-[#1E293B] h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-300/60 dark:border-[#243352] shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-smriti-teal-500 via-emerald-500 to-teal-600 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Next Pending Voice Alert Card */}
      {nextPending ? (
        <div className="mb-6">
          <VoicePromptCard
            text={`Amma, your ${nextPending.label} is scheduled at ${nextPending.time}.`}
            subtext={t('dashboard.promptListenAloud')}
            autoSpeak={false}
          />
        </div>
      ) : (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 dark:from-emerald-950/70 dark:via-[#131D33] dark:to-teal-950/70 border-2 border-emerald-300 dark:border-emerald-700 p-6 md:p-8 rounded-3xl text-center shadow-md"
        >
          <span className="text-5xl block animate-bounce">🌟</span>
          <h3 className="text-2xl md:text-3xl font-black text-emerald-950 dark:text-emerald-100 mt-2">
            {t('reminders.completedBadge')}
          </h3>
          <p className="text-emerald-800 dark:text-emerald-300 text-base md:text-lg font-bold mt-1 max-w-md mx-auto">
            {t('dashboard.peacefulWish')}
          </p>
        </motion.div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-5 p-1 bg-slate-100 dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-[#243352]">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm md:text-base transition-all ${
            filter === 'all'
              ? 'bg-white dark:bg-[#25334D] text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          {t('common.all')} ({totalCount})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm md:text-base transition-all ${
            filter === 'pending'
              ? 'bg-white dark:bg-[#25334D] text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          {t('common.pending')} ({totalCount - completedCount})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm md:text-base transition-all ${
            filter === 'completed'
              ? 'bg-white dark:bg-[#25334D] text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          {t('common.completed')} ({completedCount})
        </button>
      </div>

      {/* Reminder Cards List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredReminders.map((reminder) => {
            const isDone = reminder.done;
            const config = typeConfig[reminder.type] || {
              icon: '🔔',
              label: t('reminders.title'),
              bgBadge: 'bg-slate-100 dark:bg-[#1E293B] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-[#243352]'
            };

            return (
              <motion.div
                key={reminder.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-5 md:p-6 rounded-3xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isDone
                    ? 'bg-slate-50/90 dark:bg-[#131D33]/70 border-slate-200 dark:border-[#243352] opacity-80'
                    : 'bg-white dark:bg-[#131D33] border-smriti-teal-300 dark:border-teal-700/80 shadow-healthcare hover:border-smriti-teal-500'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 shadow-xs ${
                    isDone ? 'bg-slate-200 dark:bg-[#1E293B] text-slate-500 dark:text-slate-400' : 'bg-teal-50 dark:bg-teal-950/80 text-smriti-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                  }`}>
                    {config.icon}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs font-black text-smriti-teal-900 dark:text-teal-200 bg-teal-100/90 dark:bg-teal-950 px-3 py-0.5 rounded-full border border-teal-300 dark:border-teal-700">
                        <Clock className="w-3.5 h-3.5 text-smriti-teal-700 dark:text-teal-400" />
                        {reminder.time}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${config.bgBadge}`}>
                        {config.label}
                      </span>
                      {isDone && (
                        <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                          {t('common.done')}
                        </span>
                      )}
                    </div>

                    <h3 className={`text-xl md:text-2xl font-black mt-1.5 leading-snug ${
                      isDone ? 'line-through text-slate-500 dark:text-slate-500' : 'text-slate-900 dark:text-white'
                    }`}>
                      {reminder.label}
                    </h3>
                  </div>
                </div>

                {/* Big Done Button (min 56px height for elder accessibility) */}
                <div className="sm:flex-shrink-0 pt-2 sm:pt-0">
                  <ElderButton
                    variant={isDone ? 'outline' : 'primary'}
                    size="md"
                    icon={Check}
                    onClick={() => handleToggle(reminder.id, isDone)}
                    className={`w-full sm:w-auto min-h-[56px] text-base md:text-lg font-black ${
                      isDone ? 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#25334D] border-slate-300 dark:border-[#243352]' : ''
                    }`}
                  >
                    {isDone ? t('reminders.completedBadge') : t('common.done')}
                  </ElderButton>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredReminders.length === 0 && (
          <div className="text-center py-10 bg-white dark:bg-[#131D33] rounded-3xl border border-slate-200 dark:border-[#243352] text-slate-500 dark:text-slate-400 font-medium">
            {t('reminders.noReminders')}
          </div>
        )}
      </div>
    </div>
  );
}

