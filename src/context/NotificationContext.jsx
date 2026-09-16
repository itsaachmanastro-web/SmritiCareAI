import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexie';
import {
  getNotifications,
  getUnreadCount,
  markAsRead as markAsReadService,
  markAllAsRead as markAllAsReadService,
  dismissNotification as dismissNotifService,
  snoozeNotification as snoozeNotifService,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  NOTIFICATION_TYPES
} from '../services/notificationService';
import {
  startReminderScheduler,
  stopReminderScheduler,
  onReminderToast,
  checkDueReminders
} from '../services/reminderScheduler';
import { toggleReminder } from '../db/syncService';
import { playMatchSuccessSound } from '../audio/synthAudio';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.id ? Number(currentUser.id) : null;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeToast, setActiveToast] = useState(null);
  const [browserPermission, setBrowserPermission] = useState(() => getBrowserNotificationPermission());
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // Live query for active notifications strictly scoped to currentUserId
  const notifications = useLiveQuery(
    async () => {
      if (!currentUserId) return [];
      return await getNotifications(currentUserId, activeFilter);
    },
    [currentUserId, activeFilter]
  ) || [];

  // Live query for unread count strictly scoped to currentUserId
  const unreadCount = useLiveQuery(
    async () => {
      if (!currentUserId) return 0;
      return await getUnreadCount(currentUserId);
    },
    [currentUserId]
  ) ?? 0;

  // Background scheduler lifecycle bound to current user session
  useEffect(() => {
    if (currentUserId) {
      startReminderScheduler(currentUserId);
    } else {
      stopReminderScheduler();
    }

    return () => {
      stopReminderScheduler();
    };
  }, [currentUserId]);

  // Subscribe to foreground reminder toast alerts
  useEffect(() => {
    const unsubscribe = onReminderToast((toastData) => {
      setActiveToast(toastData);
    });
    return unsubscribe;
  }, []);

  // Update browser permission state
  useEffect(() => {
    setBrowserPermission(getBrowserNotificationPermission());
  }, []);

  const openDrawer = useCallback((filter = 'all') => {
    setActiveFilter(filter);
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen(prev => !prev);
  }, []);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  const markRead = useCallback(async (id) => {
    await markAsReadService(id);
  }, []);

  const markAllRead = useCallback(async () => {
    if (currentUserId) {
      await markAllAsReadService(currentUserId);
    }
  }, [currentUserId]);

  const dismissNotification = useCallback(async (id) => {
    await dismissNotifService(id);
  }, []);

  const snoozeNotification = useCallback(async (id, minutes = 10) => {
    const res = await snoozeNotifService(id, minutes);
    if (activeToast && activeToast.notificationId === id) {
      setActiveToast(null);
    }
    return res;
  }, [activeToast]);

  // Confirm reminder completion directly from notification center or toast
  const confirmReminder = useCallback(async (notificationId, reminderId) => {
    try {
      if (reminderId) {
        await toggleReminder(reminderId, true);
        playMatchSuccessSound();
      }
      if (notificationId) {
        await markAsReadService(notificationId);
      }
      if (activeToast && (activeToast.notificationId === notificationId || activeToast.reminderId === reminderId)) {
        setActiveToast(null);
      }
    } catch (err) {
      console.error('Failed to confirm reminder from notification:', err);
    }
  }, [activeToast]);

  // Prompt user for browser notifications with safe fallback
  const requestPermission = useCallback(async () => {
    const res = await requestBrowserNotificationPermission();
    setBrowserPermission(res);
    setShowPermissionModal(false);
    return res;
  }, []);

  // Manual trigger to force re-check due reminders
  const triggerManualCheck = useCallback(async () => {
    if (currentUserId) {
      return await checkDueReminders(currentUserId);
    }
    return [];
  }, [currentUserId]);

  const value = {
    notifications,
    unreadCount,
    isDrawerOpen,
    activeFilter,
    setActiveFilter,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    activeToast,
    dismissToast,
    markRead,
    markAllRead,
    dismissNotification,
    snoozeNotification,
    confirmReminder,
    browserPermission,
    requestPermission,
    showPermissionModal,
    setShowPermissionModal,
    triggerManualCheck
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
