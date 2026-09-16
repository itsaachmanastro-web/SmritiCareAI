import { db } from '../db/dexie.js';
import { playNotificationChime } from '../audio/synthAudio.js';

/**
 * notificationService.js
 * 
 * Centralized Notification Service for SmritiCare:
 * - Persistent storage in Dexie IndexedDB (`notifications` store).
 * - Multi-User Isolation: All queries strictly scoped by `userId`.
 * - Idempotent event creation to prevent duplicate alerts.
 * - Native Web Notification API integration with elder-friendly fallbacks.
 * - Full filter support: All, Unread, Reminders, Alerts, System, Community, Economy.
 */

export const NOTIFICATION_TYPES = {
  REMINDER: 'reminder',
  ALERT: 'alert',
  SYSTEM: 'system',
  COMMUNITY: 'community',
  ECONOMY: 'economy'
};

export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
};

/**
 * Fetch all notifications for a specific user with optional filtering
 */
export async function getNotifications(userId, filter = 'all') {
  if (!userId) return [];
  const uid = Number(userId);

  try {
    const records = await db.notifications
      .where('userId')
      .equals(uid)
      .reverse()
      .sortBy('createdAt');

    // Filter out dismissed notifications unless requested
    const active = records.filter(n => !n.isDismissed);

    switch (filter) {
      case 'unread':
        return active.filter(n => !n.isRead);
      case 'reminders':
        return active.filter(n => n.type === NOTIFICATION_TYPES.REMINDER);
      case 'alerts':
        return active.filter(n => n.type === NOTIFICATION_TYPES.ALERT);
      case 'system':
        return active.filter(n => n.type === NOTIFICATION_TYPES.SYSTEM);
      case 'community':
        return active.filter(n => n.type === NOTIFICATION_TYPES.COMMUNITY);
      case 'economy':
        return active.filter(n => n.type === NOTIFICATION_TYPES.ECONOMY);
      case 'all':
      default:
        return active;
    }
  } catch (err) {
    console.error('❌ Failed to fetch notifications:', err);
    return [];
  }
}

/**
 * Get count of active unread notifications for a user
 */
export async function getUnreadCount(userId) {
  if (!userId) return 0;
  const uid = Number(userId);

  try {
    const unread = await db.notifications
      .where('userId')
      .equals(uid)
      .and(n => !n.isRead && !n.isDismissed)
      .count();

    return unread;
  } catch (err) {
    console.warn('Could not calculate unread count:', err);
    return 0;
  }
}

/**
 * Create a new notification record with idempotency protection
 */
export async function createNotification({
  userId,
  type = NOTIFICATION_TYPES.REMINDER,
  priority = NOTIFICATION_PRIORITIES.NORMAL,
  title,
  message,
  reminderId = null,
  reminderType = null,
  actionUrl = null,
  scheduledAt = null,
  idempotencyKey = null,
  metadata = {}
}) {
  if (!userId || !title) {
    throw new Error('userId and title are required to create a notification.');
  }

  const uid = Number(userId);
  const now = new Date().toISOString();

  // Deduplication check via idempotencyKey
  if (idempotencyKey) {
    const existing = await db.notifications
      .where('idempotencyKey')
      .equals(idempotencyKey)
      .first();

    if (existing) {
      return existing; // Prevent spamming duplicate notifications
    }
  }

  const newNotif = {
    userId: uid,
    type,
    priority,
    title,
    message: message || '',
    reminderId: reminderId ? Number(reminderId) : null,
    reminderType: reminderType || null,
    actionUrl: actionUrl || (type === 'reminder' ? '/patient/reminders' : null),
    scheduledAt: scheduledAt || null,
    isRead: false,
    isDismissed: false,
    createdAt: now,
    readAt: null,
    dismissedAt: null,
    idempotencyKey: idempotencyKey || null,
    metadata
  };

  const id = await db.notifications.add(newNotif);
  return { id, ...newNotif };
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(notificationId) {
  if (!notificationId) return;
  const id = Number(notificationId);
  const now = new Date().toISOString();

  try {
    await db.notifications.update(id, {
      isRead: true,
      readAt: now
    });
  } catch (err) {
    console.error(`Failed to mark notification ${id} as read:`, err);
  }
}

/**
 * Mark all unread notifications for a user as read
 */
export async function markAllAsRead(userId) {
  if (!userId) return;
  const uid = Number(userId);
  const now = new Date().toISOString();

  try {
    await db.transaction('rw', db.notifications, async () => {
      const unreadList = await db.notifications
        .where('userId')
        .equals(uid)
        .and(n => !n.isRead)
        .toArray();

      for (const notif of unreadList) {
        await db.notifications.update(notif.id, {
          isRead: true,
          readAt: now
        });
      }
    });
  } catch (err) {
    console.error(`Failed to mark all notifications as read for user ${uid}:`, err);
  }
}

/**
 * Dismiss a notification (soft delete)
 */
export async function dismissNotification(notificationId) {
  if (!notificationId) return;
  const id = Number(notificationId);
  const now = new Date().toISOString();

  try {
    await db.notifications.update(id, {
      isDismissed: true,
      dismissedAt: now
    });
  } catch (err) {
    console.error(`Failed to dismiss notification ${id}:`, err);
  }
}

/**
 * Snooze a notification for a specified duration in minutes (default: 10 minutes)
 */
export async function snoozeNotification(notificationId, minutes = 10) {
  if (!notificationId) return null;
  const id = Number(notificationId);

  try {
    const existing = await db.notifications.get(id);
    if (!existing) return null;

    // Calculate snoozed time
    const snoozedDate = new Date(Date.now() + minutes * 60 * 1000);
    const snoozedTimeStr = snoozedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Mark current notification dismissed
    await dismissNotification(id);

    // Create a new snoozed notification
    const snoozedNotif = await createNotification({
      userId: existing.userId,
      type: existing.type,
      priority: existing.priority,
      title: `[Snoozed] ${existing.title}`,
      message: existing.message,
      reminderId: existing.reminderId,
      reminderType: existing.reminderType,
      actionUrl: existing.actionUrl,
      scheduledAt: snoozedTimeStr,
      idempotencyKey: `snooze_${id}_${Date.now()}`
    });

    return snoozedNotif;
  } catch (err) {
    console.error(`Failed to snooze notification ${id}:`, err);
    return null;
  }
}

/* =========================================================================
   Native Browser Web Notification API Integration
   ========================================================================= */

/**
 * Check current browser notification permission state
 */
export function getBrowserNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

/**
 * Request notification permission from the user
 */
export async function requestBrowserNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Notification permission request failed:', err);
    return 'denied';
  }
}

/**
 * Send a native browser notification (if permission is granted)
 */
export function sendBrowserNotification(title, {
  body = '',
  icon = '/vite.svg',
  tag = 'smriticare-reminder',
  url = '/patient/reminders'
} = {}) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  if (Notification.permission !== 'granted') {
    return null;
  }

  try {
    const notif = new Notification(title, {
      body,
      icon,
      tag,
      badge: icon,
      vibrate: [200, 100, 200],
      requireInteraction: false
    });

    notif.onclick = function () {
      window.focus();
      if (url && window.location.pathname !== url) {
        window.location.href = url;
      }
      notif.close();
    };

    return notif;
  } catch (err) {
    console.warn('Failed to dispatch native browser notification:', err);
    return null;
  }
}
