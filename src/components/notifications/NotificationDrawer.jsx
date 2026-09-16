import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  X,
  Check,
  Clock,
  AlertTriangle,
  HeartHandshake,
  Settings,
  Sparkles,
  Coins,
  CheckCheck,
  ChevronRight,
  ShieldCheck,
  Volume2
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from '../../services/notificationService';

export default function NotificationDrawer() {
  const {
    notifications,
    unreadCount,
    isDrawerOpen,
    closeDrawer,
    activeFilter,
    setActiveFilter,
    markRead,
    markAllRead,
    dismissNotification,
    snoozeNotification,
    confirmReminder
  } = useNotifications();

  const { t } = useLanguage();
  const navigate = useNavigate();
  const drawerRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  if (!isDrawerOpen) return null;

  // Format relative timestamp
  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return t('notifications.justNow') || 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  const getTypeIcon = (type, reminderType) => {
    if (type === NOTIFICATION_TYPES.REMINDER) {
      switch (reminderType) {
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
    }
    if (type === NOTIFICATION_TYPES.ALERT) return '⚠️';
    if (type === NOTIFICATION_TYPES.ECONOMY) return '💠';
    if (type === NOTIFICATION_TYPES.COMMUNITY) return '🤝';
    return '🔔';
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case NOTIFICATION_PRIORITIES.URGENT:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            {t('notifications.urgent') || 'Urgent'}
          </span>
        );
      case NOTIFICATION_PRIORITIES.HIGH:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            {t('notifications.high') || 'Important'}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#243352]">
            {t('notifications.routine') || 'Care'}
          </span>
        );
    }
  };

  const filterTabs = [
    { key: 'all', label: t('common.all') || 'All' },
    { key: 'unread', label: t('notifications.filterUnread') || 'Unread' },
    { key: 'reminders', label: t('notifications.filterReminders') || 'Reminders' },
    { key: 'alerts', label: t('notifications.filterAlerts') || 'Alerts' },
    { key: 'system', label: t('notifications.filterSystem') || 'System' }
  ];

  const handleActionNavigation = (url) => {
    closeDrawer();
    if (url) {
      navigate(url);
    }
  };

  const drawerContent = (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeDrawer();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t('notifications.title') || 'Notification Center'}
    >
      <div
        ref={drawerRef}
        className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10"
      >
        <div className="w-screen sm:w-[450px] max-w-full bg-white dark:bg-[#131D33] border-l border-slate-200 dark:border-[#243352] shadow-2xl flex flex-col h-full text-slate-900 dark:text-white transition-colors duration-200 animate-in slide-in-from-right duration-250 ease-out">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-200/90 dark:border-[#243352] flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-[#10192D] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-smriti-teal-50 dark:bg-smriti-teal-950/60 border border-smriti-teal-200 dark:border-smriti-teal-800 flex items-center justify-center text-smriti-teal-700 dark:text-smriti-teal-300 shadow-xs">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                  {t('notifications.title') || 'Notification Center'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {unreadCount > 0 
                    ? `${unreadCount} ${t('notifications.unreadBadge') || 'unread reminders & alerts'}`
                    : t('notifications.allCaughtUp') || 'All caught up'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-smriti-teal-700 dark:text-teal-300 hover:bg-smriti-teal-50 dark:hover:bg-teal-950/50 transition-colors flex items-center gap-1 cursor-pointer"
                  title={t('notifications.markAllRead') || 'Mark all as read'}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('notifications.markAllRead') || 'Mark all read'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={closeDrawer}
                className="p-2 rounded-2xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
                aria-label={t('common.close') || 'Close'}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-4 py-2.5 bg-slate-100/70 dark:bg-[#162238] border-b border-slate-200/80 dark:border-[#243352] flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-smriti-teal-600 text-white shadow-xs'
                      : 'bg-white dark:bg-[#1F2E4A] text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-[#253759] border border-slate-200 dark:border-[#2E4369]'
                  }`}
                >
                  {tab.label}
                  {tab.key === 'unread' && unreadCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Scrollable Notification List */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {notifications.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 dark:text-slate-400 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-[#162238] border border-slate-200 dark:border-[#243352] flex items-center justify-center text-3xl shadow-inner">
                  🌸
                </div>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-200">
                  {t('notifications.noNotifications') || 'No Notifications'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                  {activeFilter === 'unread'
                    ? (t('notifications.noUnread') || 'You have no unread reminders or alerts. Everything is on schedule!')
                    : (t('notifications.emptyDesc') || 'Scheduled reminders, clinical telemetry alerts, and care updates will appear here in real time.')}
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.isRead;
                const isReminder = n.type === NOTIFICATION_TYPES.REMINDER;
                const icon = getTypeIcon(n.type, n.reminderType);

                return (
                  <div
                    key={n.id}
                    className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                      isUnread
                        ? 'bg-gradient-to-br from-teal-50/70 to-emerald-50/40 dark:from-[#16253D] dark:to-[#142035] border-smriti-teal-300/80 dark:border-teal-700/80 shadow-xs'
                        : 'bg-white dark:bg-[#162238] border-slate-200 dark:border-[#243352] opacity-90'
                    }`}
                  >
                    {/* Top Row: Category Icon, Priority, Time, Dismiss */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl p-1.5 rounded-xl bg-white dark:bg-[#1E293B] shadow-xs border border-slate-200/80 dark:border-[#243352]">
                          {icon}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {getPriorityBadge(n.priority)}
                            {n.scheduledAt && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-smriti-teal-700 dark:text-teal-300">
                                <Clock className="w-3 h-3" />
                                {n.scheduledAt}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
                          {formatTime(n.createdAt)}
                        </span>
                        <button
                          type="button"
                          onClick={() => dismissNotification(n.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                          title={t('notifications.dismiss') || 'Dismiss'}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                        {n.title}
                      </h4>
                      {n.message && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                          {n.message}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {isReminder && n.reminderId && (
                          <button
                            type="button"
                            onClick={() => confirmReminder(n.id, n.reminderId)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{t('notifications.takeNow') || 'Take / Done'}</span>
                          </button>
                        )}

                        {isReminder && (
                          <button
                            type="button"
                            onClick={() => snoozeNotification(n.id, 10)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#253759] text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-[#2E4369] transition-colors cursor-pointer"
                          >
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>{t('notifications.snooze10m') || 'Snooze 10m'}</span>
                          </button>
                        )}

                        {isUnread && !isReminder && (
                          <button
                            type="button"
                            onClick={() => markRead(n.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-smriti-teal-800 dark:text-teal-200 font-bold text-xs border border-teal-200 dark:border-teal-800 transition-colors cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>{t('notifications.markRead') || 'Mark Read'}</span>
                          </button>
                        )}
                      </div>

                      {n.actionUrl && (
                        <button
                          type="button"
                          onClick={() => handleActionNavigation(n.actionUrl)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-smriti-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                        >
                          <span>{t('common.view') || 'View'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Note */}
          <div className="px-5 py-3 border-t border-slate-200/90 dark:border-[#243352] bg-slate-50/80 dark:bg-[#10192D] shrink-0 text-center">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-smriti-teal-600 dark:text-teal-400" />
              <span>Offline-ready notifications synced locally in Dexie IndexedDB.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? ReactDOM.createPortal(drawerContent, document.body)
    : null;
}
