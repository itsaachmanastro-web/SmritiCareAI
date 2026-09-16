import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Bell, Check, Clock, X } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';

export default function NotificationToast() {
  const { activeToast, dismissToast, confirmReminder, snoozeNotification } = useNotifications();
  const { t } = useLanguage();

  // Auto-dismiss toast after 25 seconds if not acted on
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      dismissToast();
    }, 25000);
    return () => clearTimeout(timer);
  }, [activeToast, dismissToast]);

  if (!activeToast) return null;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'medicine':
        return '💊';
      case 'water':
        return '💧';
      case 'routine':
        return '🍲';
      case 'appointment':
        return '🩺';
      default:
        return '⏰';
    }
  };

  const content = (
    <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 max-w-md w-full px-4 pointer-events-none animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="pointer-events-auto bg-white dark:bg-[#131D33] border-2 border-smriti-teal-500/80 rounded-3xl shadow-2xl p-4 sm:p-5 text-slate-900 dark:text-white flex flex-col gap-3">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-2xl shadow-xs shrink-0 animate-bounce">
              {getTypeIcon(activeToast.type)}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                <Bell className="w-3 h-3 text-amber-600 animate-spin" />
                <span>{t('notifications.reminderAlert') || 'Care Reminder Due'}</span>
              </div>
              <h3 className="text-base sm:text-lg font-black mt-1 leading-snug">
                {activeToast.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={dismissToast}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={t('common.close') || 'Dismiss'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message / Time */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-semibold pl-1">
          {activeToast.message || `Scheduled for ${activeToast.time}`}
        </p>

        {/* Action Buttons: Big Touch-Friendly Targets for Elders */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => confirmReminder(activeToast.notificationId, activeToast.reminderId)}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
          >
            <Check className="w-5 h-5" />
            <span>{t('notifications.takeNow') || 'Take / Done'}</span>
          </button>

          <button
            type="button"
            onClick={() => snoozeNotification(activeToast.notificationId, 10)}
            className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#253759] text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm border border-slate-200 dark:border-[#2E4369] transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[48px]"
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>{t('notifications.snooze10m') || 'Snooze 10m'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? ReactDOM.createPortal(content, document.body)
    : null;
}
