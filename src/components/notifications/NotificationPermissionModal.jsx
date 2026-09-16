import React from 'react';
import ReactDOM from 'react-dom';
import { Bell, ShieldCheck, X } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';

export default function NotificationPermissionModal() {
  const { showPermissionModal, setShowPermissionModal, requestPermission } = useNotifications();
  const { t } = useLanguage();

  if (!showPermissionModal) return null;

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={() => setShowPermissionModal(false)}
    >
      <div
        className="bg-white dark:bg-[#131D33] rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-[#243352] shadow-2xl space-y-4 text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#243352]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xl shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">
                {t('notifications.permissionTitle') || 'Enable Timely Care Reminders'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                SmritiCare Health & Routine Alerts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPermissionModal(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            {t('notifications.permissionDesc') || 'Allow SmritiCare to send gentle notifications so Amma never misses daily medicines, scheduled hydration, and care routines even when this browser tab is minimized.'}
          </p>
          <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-2xl border border-teal-200 dark:border-teal-800 flex items-center gap-2.5 text-xs font-semibold text-smriti-teal-900 dark:text-teal-200">
            <ShieldCheck className="w-5 h-5 text-smriti-teal-600 dark:text-teal-400 shrink-0" />
            <span>Zero spam. Only your scheduled reminders and caregiver health alerts are notified.</span>
          </div>
        </div>

        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={requestPermission}
            className="flex-1 py-3 px-4 rounded-2xl bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            {t('notifications.enableNotifications') || 'Allow Reminders'}
          </button>
          <button
            type="button"
            onClick={() => setShowPermissionModal(false)}
            className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm transition-all cursor-pointer"
          >
            {t('notifications.maybeLater') || 'Maybe Later'}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? ReactDOM.createPortal(content, document.body)
    : null;
}
