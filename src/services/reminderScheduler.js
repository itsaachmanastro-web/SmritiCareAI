import { db } from '../db/dexie.js';
import {
  createNotification,
  sendBrowserNotification,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES
} from './notificationService.js';
import { playNotificationChime } from '../audio/synthAudio.js';

/**
 * reminderScheduler.js
 * 
 * Reliable Background Reminder-to-Notification Pipeline:
 * - Periodically checks active reminders in Dexie DB.
 * - Handles AM/PM 12h, 24h, and relative time expressions.
 * - Idempotently creates persistent notification records.
 * - Triggers audible chime, foreground toast alert, and OS notifications.
 * - Resilient to tab inactivity, refresh, and sleep/wake cycles.
 */

// Global listeners for foreground toast dispatcher
const toastListeners = new Set();

export function onReminderToast(callback) {
  toastListeners.add(callback);
  return () => toastListeners.delete(callback);
}

function dispatchToast(toastPayload) {
  toastListeners.forEach(callback => {
    try {
      callback(toastPayload);
    } catch (err) {
      console.warn('Error in reminder toast callback:', err);
    }
  });
}

/**
 * Parse human time string into minutes since midnight (0 - 1439)
 * Examples: "08:00 AM", "8:00 AM", "1:30 PM", "13:30", "Tomorrow 10:00 AM"
 */
export function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;

  const clean = timeStr.trim().toLowerCase();
  const isTomorrow = clean.includes('tomorrow');

  // Match 12h or 24h formats: "08:00 am", "8:30 pm", "14:15"
  const match = clean.match(/(\d{1,2}):(\d{2})(?:\s*([ap]m))?/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridian = match[3] ? match[3].toLowerCase() : null;

  if (meridian === 'pm' && hours < 12) {
    hours += 12;
  } else if (meridian === 'am' && hours === 12) {
    hours = 0;
  }

  return {
    totalMinutes: hours * 60 + minutes,
    hours,
    minutes,
    isTomorrow
  };
}

/**
 * Check whether a reminder is due at current time
 * @param {Object} reminder - Reminder record from Dexie
 * @param {Date} now - Current Date object
 */
export function isReminderDue(reminder, now = new Date()) {
  if (!reminder || reminder.done || reminder.completed) {
    return false;
  }

  const timeStr = reminder.time || reminder.scheduledAt || reminder.dueAt;
  const parsed = parseTimeToMinutes(timeStr);
  if (!parsed) return false;

  // If explicitly labeled for tomorrow, do not fire today
  if (parsed.isTomorrow) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const diff = currentMinutes - parsed.totalMinutes;

  // Due if current time is within [-1, +60] minutes of scheduled time
  // Allows catching reminders if the user opened the app slightly after scheduled time
  return diff >= -1 && diff <= 60;
}

/**
 * Scan all active reminders for a specific user and generate notifications
 */
export async function checkDueReminders(userId) {
  if (!userId) return [];
  const uid = Number(userId);
  const now = new Date();
  const todayDateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

  try {
    const allReminders = await db.reminders.toArray();
    const userReminders = allReminders.filter(
      r => Number(r.targetUserId || r.userId || r.patientId) === uid
    );

    const triggered = [];

    for (const reminder of userReminders) {
      if (isReminderDue(reminder, now)) {
        const idempotencyKey = `reminder_${reminder.id}_${todayDateStr}`;

        // Check if already notified today
        const existing = await db.notifications
          .where('idempotencyKey')
          .equals(idempotencyKey)
          .first();

        if (!existing) {
          // 1. Create persistent Dexie notification record
          const priority = reminder.priority || (reminder.type === 'medicine' ? NOTIFICATION_PRIORITIES.HIGH : NOTIFICATION_PRIORITIES.NORMAL);
          const notif = await createNotification({
            userId: uid,
            type: NOTIFICATION_TYPES.REMINDER,
            priority,
            title: reminder.label || reminder.title || 'Scheduled Reminder',
            message: `Time for ${reminder.label || reminder.title} (${reminder.time}).`,
            reminderId: reminder.id,
            reminderType: reminder.type || 'routine',
            actionUrl: '/patient/reminders',
            scheduledAt: reminder.time,
            idempotencyKey,
            metadata: {
              recurring: reminder.recurring || 'daily',
              time: reminder.time
            }
          });

          // 2. Play gentle audio chime (safe Web Audio API)
          playNotificationChime();

          // 3. Dispatch in-app foreground toast
          dispatchToast({
            notificationId: notif.id,
            reminderId: reminder.id,
            title: reminder.label || reminder.title,
            message: `Scheduled at ${reminder.time}`,
            type: reminder.type || 'routine',
            priority,
            time: reminder.time
          });

          // 4. Trigger native browser OS notification
          sendBrowserNotification(
            `🔔 SmritiCare: ${reminder.label || reminder.title}`,
            {
              body: `Scheduled at ${reminder.time}. Tap to confirm or snooze.`,
              tag: `reminder-${reminder.id}`,
              url: '/patient/reminders'
            }
          );

          triggered.push(notif);
        }
      }
    }

    return triggered;
  } catch (err) {
    console.error('❌ Error checking due reminders:', err);
    return [];
  }
}

/**
 * Singleton background scheduler manager
 */
let schedulerTimer = null;
let activeUserId = null;

export function startReminderScheduler(userId) {
  if (!userId) return;
  activeUserId = Number(userId);

  // Clear existing timer if any
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
  }

  // Initial immediate check
  checkDueReminders(activeUserId);

  // Polling every 30 seconds
  schedulerTimer = setInterval(() => {
    if (activeUserId) {
      checkDueReminders(activeUserId);
    }
  }, 30000);

  // Check on tab visibility change (e.g. device woke up or tab focused)
  if (typeof document !== 'undefined') {
    const handleVisibilityChange = () => {
      if (!document.hidden && activeUserId) {
        checkDueReminders(activeUserId);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }
}

export function stopReminderScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
  activeUserId = null;
}
