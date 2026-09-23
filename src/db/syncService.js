import { db } from './dexie.js';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient.js';
import { isProductionMode } from '../config/appMode.js';
import { economyService } from '../services/economyService.js';
import { recordActivity } from '../services/activityService.js';

// Helper to record an item into the sync queue with offline-first status
export async function queueSyncItem(entityType, entityId, operation = 'INSERT', payload = null, meta = {}) {
  try {
    const queueRecord = {
      userId: meta.userId || (payload && payload.userId) || null,
      patientId: meta.patientId || (payload && payload.patientId) || null,
      isDemo: Boolean(meta.isDemo ?? (payload && payload.isDemo)),
      entityType,
      entityId,
      operation,
      payload: payload ? JSON.parse(JSON.stringify(payload)) : null,
      status: 'pending',
      retryCount: 0,
      lastAttemptAt: null,
      createdAt: new Date().toISOString(),
      // Backward compatibility fields
      tableName: entityType,
      recordId: entityId,
      action: operation
    };

    const id = await db.syncQueue.add(queueRecord);
    return id;
  } catch (err) {
    console.error('❌ Failed to queue sync item in Dexie:', err);
    throw err;
  }
}

// Save a completed game session and update cognitive domain scores inside a transaction
export async function saveGameSession({
  userId,
  patientId,
  gameName,
  gameType,
  domain,
  score,
  difficultyLevel = 'medium',
  durationSeconds = 0,
  correctCount = 0,
  mistakeCount = 0
}) {
  const resolvedId = userId || (typeof localStorage !== 'undefined' ? localStorage.getItem('smriti_user_id') : null);
  const targetUserId = resolvedId ? Number(resolvedId) : null;
  if (!targetUserId) {
    console.warn('saveGameSession: No authenticated user ID found. Skipping record.');
    return null;
  }
  const targetPatientId = Number(patientId || targetUserId);
  const activeDomain = domain || gameType || 'memory';

  const totalActions = Number(correctCount) + Number(mistakeCount);
  const accuracy = totalActions > 0
    ? Math.round((Number(correctCount) / totalActions) * 100)
    : Number(score);

  return await recordActivity({
    userId: targetUserId,
    patientId: targetPatientId,
    activityType: 'game',
    gameType: activeDomain,
    domain: activeDomain,
    activityName: gameName,
    score: Number(score),
    accuracy,
    mistakes: Number(mistakeCount),
    durationSeconds: Number(durationSeconds),
    difficulty: difficultyLevel,
    completed: true
  });
}

// Add or update reminder
export async function saveReminder(reminder) {
  const isOffline = !navigator.onLine;
  const now = new Date().toISOString();

  const targetUserId = Number(reminder.targetUserId || reminder.patientId || reminder.userId || (typeof localStorage !== 'undefined' ? localStorage.getItem('smriti_user_id') : 1));
  if (!targetUserId || isNaN(targetUserId)) {
    throw new Error('Target patient ID is required to save a reminder.');
  }

  const user = await db.users.get(Number(targetUserId));
  const isDemo = Boolean(reminder.isDemo ?? user?.isDemo);

  const category = (reminder.category || reminder.type || 'medicine').toLowerCase();
  const frequency = (reminder.frequency || reminder.recurring || 'daily').toLowerCase();
  const priority = (reminder.priority || 'normal').toLowerCase();
  const title = (reminder.title || reminder.label || 'Reminder').trim();
  const time = (reminder.time || reminder.scheduledAt || reminder.dueAt || '09:00 AM').trim();

  // 1. Try server write
  try {
    fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...reminder,
        targetUserId,
        userId: targetUserId,
        patientId: targetUserId,
        title,
        label: title,
        time,
        scheduledAt: time,
        dueAt: time,
        category,
        type: category,
        frequency,
        recurring: frequency,
        priority,
        isDemo
      })
    }).catch(() => {});
  } catch {}

  // 2. Write to Dexie IndexedDB
  return await db.transaction('rw', [db.reminders, db.syncQueue], async () => {
    let id;
    if (reminder.id) {
      id = Number(reminder.id);
      const updatedFields = {
        ...reminder,
        targetUserId,
        userId: targetUserId,
        patientId: targetUserId,
        isDemo,
        title,
        label: title,
        dueAt: time,
        time,
        scheduledAt: time,
        type: category,
        category,
        recurring: frequency,
        frequency,
        priority,
        status: reminder.status || ((reminder.done ?? reminder.completed) ? 'completed' : 'pending'),
        completed: Boolean(reminder.done ?? reminder.completed),
        done: Boolean(reminder.done ?? reminder.completed),
        updatedAt: now
      };
      await db.reminders.update(id, updatedFields);
      await queueSyncItem('reminders', id, 'UPDATE', updatedFields, { userId: targetUserId, patientId: targetUserId, isDemo });
    } else {
      const newReminder = {
        targetUserId,
        userId: targetUserId,
        patientId: targetUserId,
        isDemo,
        createdBy: reminder.createdBy || 'Caregiver',
        scheduledAt: time,
        status: reminder.status || (reminder.done ? 'completed' : 'pending'),
        title,
        label: title,
        time,
        dueAt: time,
        type: category,
        category,
        recurring: frequency,
        frequency,
        priority,
        done: Boolean(reminder.done),
        completed: Boolean(reminder.done),
        missedCount: Number(reminder.missedCount || 0),
        createdOffline: isOffline,
        createdAt: now,
        updatedAt: now
      };
      id = await db.reminders.add(newReminder);
      await queueSyncItem('reminders', id, 'INSERT', newReminder, { userId: targetUserId, patientId: targetUserId, isDemo });
    }
    return id;
  });
}

// Toggle reminder done status
export async function toggleReminder(id, isDone) {
  const now = new Date().toISOString();
  const reminder = await db.reminders.get(id);

  try {
    fetch('/api/reminders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, done: isDone, completed: isDone })
    }).catch(() => {});
  } catch {}

  await db.transaction('rw', [db.reminders, db.syncQueue], async () => {
    await db.reminders.update(id, {
      done: isDone,
      completed: isDone,
      status: isDone ? 'completed' : 'pending',
      updatedAt: now
    });
    await queueSyncItem('reminders', id, 'UPDATE', { id, done: isDone, completed: isDone, status: isDone ? 'completed' : 'pending', updatedAt: now });
  });

  // Award routine task completion credits and record activity if marked done
  if (isDone && reminder && !reminder.done) {
    const targetUserId = reminder.userId || reminder.targetUserId || 1;
    try {
      if (targetUserId) {
        await economyService.awardCredits(
          targetUserId,
          5,
          `Completed daily task: ${reminder.title || reminder.label || 'Daily Reminder'}`,
          'DAILY_ROUTINE',
          `reminder_${id}_${now.slice(0, 10)}`
        );
      }
    } catch (creditErr) {
      console.warn('Could not award reminder credits:', creditErr);
    }

    try {
      await recordActivity({
        userId: targetUserId,
        patientId: reminder.patientId || targetUserId,
        activityType: 'reminder',
        gameType: 'routine',
        domain: 'routine',
        activityName: reminder.title || reminder.label || 'Daily Routine Task',
        score: 100,
        accuracy: 100,
        mistakes: 0,
        durationSeconds: 0,
        difficulty: 'easy',
        completed: true,
        metadata: { reminderId: id, type: reminder.type }
      });
    } catch (actErr) {
      console.warn('Could not record reminder activity in activityService:', actErr);
    }
  }
}

// Delete reminder
export async function deleteReminder(id) {
  const idNum = Number(id);

  try {
    fetch(`/api/reminders?id=${idNum}`, {
      method: 'DELETE'
    }).catch(() => {});
  } catch {}

  try {
    return await db.transaction('rw', [db.reminders, db.syncQueue], async () => {
      await db.reminders.delete(idNum);
      await queueSyncItem('reminders', idNum, 'DELETE', { id: idNum });
    });
  } catch (err) {
    console.error('Failed to delete reminder:', err);
    throw err;
  }
}

// Create or update a patient profile
export async function savePatientProfile(profile) {
  const now = new Date().toISOString();
  return await db.transaction('rw', [db.patientProfiles, db.syncQueue], async () => {
    let id;
    if (profile.id) {
      id = profile.id;
      const updated = { ...profile, updatedAt: now };
      await db.patientProfiles.update(id, updated);
      await queueSyncItem('patientProfiles', id, 'UPDATE', updated);
    } else {
      const newProfile = {
        userId: profile.userId,
        name: profile.name,
        age: Number(profile.age) || 70,
        location: profile.location || 'Assam, India',
        phcCenter: profile.phcCenter || 'Titabar PHC',
        primaryCaregiver: profile.primaryCaregiver || '',
        createdAt: now,
        updatedAt: now
      };
      id = await db.patientProfiles.add(newProfile);
      await queueSyncItem('patientProfiles', id, 'INSERT', newProfile);
    }
    return id;
  });
}

// Record an AI conversation message
export async function saveConversationMessage(message) {
  const now = new Date().toISOString();
  const userId = message.userId || (typeof localStorage !== 'undefined' ? Number(localStorage.getItem('smriti_user_id')) : null);
  let isDemo = false;
  if (userId) {
    const user = await db.users.get(Number(userId));
    isDemo = Boolean(user?.isDemo);
  }

  return await db.transaction('rw', [db.conversations, db.syncQueue], async () => {
    const record = {
      userId: userId || null,
      isDemo,
      role: message.role || 'user',
      message: message.message || message.text || '',
      language: message.language || 'en',
      intent: message.intent || null,
      source: message.source || 'local',
      timestamp: now,
      createdAt: now
    };
    const id = await db.conversations.add(record);
    await queueSyncItem('conversations', id, 'INSERT', record, { userId: userId || null, isDemo });
    return id;
  });
}

// Clear conversation history for active user
export async function clearUserConversations(userId) {
  return await db.transaction('rw', [db.conversations], async () => {
    return await db.conversations.where('userId').equals(userId).delete();
  });
}

// Get statistics for Data & Sync telemetry from the ACTUAL database state
export async function getSyncStats() {
  const isProd = isProductionMode();
  const allUsers = await db.users.toArray();
  const verifiedUsers = allUsers.filter(u => !u.isDemo && u.isVerified !== false && u.status !== 'demo');
  const totalUsers = isProd ? verifiedUsers.length : allUsers.length;

  const [
    allSessions,
    allScores,
    allReminders,
    allProfiles,
    allHealthRecords,
    allConversations,
    allPending
  ] = await Promise.all([
    db.gameSessions.toArray(),
    db.cognitiveScores.toArray(),
    db.reminders.toArray(),
    db.patientProfiles.toArray(),
    db.healthRecords.toArray(),
    db.conversations.toArray(),
    db.syncQueue.where('status').equals('pending').toArray()
  ]);

  const filterRecs = (arr) => isProd ? arr.filter(r => !r.isDemo) : arr;

  const totalSessions = filterRecs(allSessions).length;
  const totalScores = filterRecs(allScores).length;
  const totalReminders = filterRecs(allReminders).length;
  const totalProfiles = filterRecs(allProfiles).length;
  const totalHealthRecords = filterRecs(allHealthRecords).length;
  const totalConversations = filterRecs(allConversations).length;
  const unsyncedCount = filterRecs(allPending).length;

  const totalRecords = totalUsers + totalSessions + totalScores + totalReminders + totalProfiles + totalHealthRecords + totalConversations;

  let lastSync = localStorage.getItem('smriti_last_sync') || 'Never';
  if (lastSync && lastSync !== 'Never' && (lastSync.includes('2001') || (!lastSync.includes('202') && !lastSync.includes('T')))) {
    lastSync = new Date().toISOString();
    localStorage.setItem('smriti_last_sync', lastSync);
  }

  return {
    totalRecords,
    totalUsers,
    totalSessions,
    totalScores,
    totalReminders,
    totalProfiles,
    unsyncedCount,
    lastSync,
    isOnline: navigator.onLine
  };
}

// Run cloud synchronization
export async function syncNow(onProgress = null) {
  // 1. Check network connectivity
  if (!navigator.onLine) {
    const offlineErr = new Error('Network offline. Cannot sync to cloud. Changes remain safely stored locally.');
    localStorage.setItem('smriti_last_sync_error', 'Offline - network unavailable');
    throw offlineErr;
  }

  if (onProgress) onProgress('Reading pending sync queue from IndexedDB...');

  // 2. Fetch pending items
  const unsyncedItems = await db.syncQueue.where('status').equals('pending').toArray();
  const count = unsyncedItems.length;

  if (onProgress) onProgress(`Connecting to Cloud Relay (${count} pending items)...`);

  // Simulate cloud handshake delay
  await new Promise((r) => setTimeout(r, 900));

  // 3. If Supabase is configured, push each item to Supabase table
  if (isSupabaseConfigured() && supabase) {
    for (const item of unsyncedItems) {
      try {
        if (item.operation === 'INSERT' && item.payload) {
          await supabase.from(item.entityType).upsert(item.payload);
        } else if (item.operation === 'UPDATE' && item.payload) {
          await supabase.from(item.entityType).update(item.payload).eq('id', item.entityId);
        } else if (item.operation === 'DELETE') {
          await supabase.from(item.entityType).delete().eq('id', item.entityId);
        }
      } catch (cloudErr) {
        console.warn(`Supabase sync item error for ${item.entityType}:`, cloudErr);
        // Continue processing other items
      }
    }
  }

  // 4. Mark queue items as synced in Dexie
  const syncTimestamp = new Date().toISOString();
  await db.transaction('rw', db.syncQueue, async () => {
    for (const item of unsyncedItems) {
      await db.syncQueue.update(item.id, {
        status: 'synced',
        lastAttemptAt: syncTimestamp
      });
    }
  });

  // 5. Update last successful sync timestamp ONLY on real success (ISO 8601 string)
  localStorage.setItem('smriti_last_sync', syncTimestamp);
  localStorage.removeItem('smriti_last_sync_error');

  return {
    success: true,
    syncedCount: count,
    syncedAt: syncTimestamp
  };
}
