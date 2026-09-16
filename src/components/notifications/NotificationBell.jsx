import React from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';

export default function NotificationBell() {
  const { unreadCount, toggleDrawer, isDrawerOpen } = useNotifications();
  const { t } = useLanguage();

  const titleText = unreadCount > 0 
    ? `${t('notifications.title') || 'Notifications'} (${unreadCount} ${t('notifications.unreadBadge') || 'unread'})`
    : t('notifications.title') || 'Notifications';

  return (
    <button
      type="button"
      onClick={toggleDrawer}
      className={`relative p-2 sm:p-2.5 rounded-2xl transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-smriti-teal-500 cursor-pointer shadow-xs active:scale-95 ${
        isDrawerOpen
          ? 'bg-smriti-teal-600 text-white border border-smriti-teal-700 shadow-sm'
          : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#162238] dark:hover:bg-[#1E293B] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#243352]'
      }`}
      aria-label={titleText}
      aria-expanded={isDrawerOpen}
      title={titleText}
    >
      <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'}`} />

      {/* Unread Counter Badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white font-black text-[11px] flex items-center justify-center shadow-md animate-pulse border-2 border-white dark:border-[#0E172A]">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
