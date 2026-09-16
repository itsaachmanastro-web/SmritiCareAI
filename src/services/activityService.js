import { db } from '../db/dexie.js';
import { economyService } from './economyService.js';
import { queueSyncItem } from '../db/syncService.js';

/**
 * Returns local calendar date string YYYY-MM-DD
 */
export function getLocalDateString(d = new Date()) {
  const dateObj = d instanceof Date ? d : new Date(d);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generates an array of contiguous calendar date strings [YYYY-MM-DD]
 * ending on referenceDate (length = days)
 */
export function getCalendarDateRange(days = 7, referenceDate = new Date()) {
  const dates = [];
  const ref = referenceDate instanceof Date ? new Date(referenceDate) : new Date(referenceDate);
  // Set to local midnight to avoid hour drift
  ref.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(ref);
    d.setDate(d.getDate() - i);
    dates.push(getLocalDateString(d));
  }
  return dates;
}

/**
 * Format date string YYYY-MM-DD into short display label (e.g. "15 Sep")
 */
export function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Canonical normalizer mapping games and activity types to 4 clinical neuro-cognitive domains:
 * - memory: Bihu Memory Pairs, memoryMatch
 * - attention: Sounds of the Hills, auditoryAttention
 * - routine: Morning at the Tea Garden, sequenceMemory, daily routine
 * - pattern: Mekhela Pattern Match, patternRecognition
 */
export function normalizeDomain(rawDomainOrGame) {
  if (!rawDomainOrGame) return 'memory';
  const str = String(rawDomainOrGame).toLowerCase().trim();
  if (str.includes('tea') || str.includes('garden') || str.includes('routine') || str.includes('sequence')) return 'routine';
  if (str.includes('sound') || str.includes('hill') || str.includes('attention') || str.includes('auditory')) return 'attention';
  if (str.includes('mekhela') || str.includes('pattern')) return 'pattern';
  if (str.includes('bihu') || str.includes('memory')) return 'memory';
  return 'memory';
}

/**
 * Canonical Activity Recording Pipeline
 * Atomically writes to activityRecords, gameSessions, and cognitiveScores
 */
export async function recordActivity({
  userId,
  patientId,
  activityType = 'game',
  gameType,
  domain,
  activityName,
  gameName,
  score,
  accuracy,
  mistakes = 0,
  durationSeconds = 0,
  difficulty = 'medium',
  completed = true,
  timestamp,
  date,
  metadata = {}
}) {
  const now = new Date();
  const isoTimestamp = timestamp || now.toISOString();
  const resolvedId = userId || (typeof localStorage !== 'undefined' ? localStorage.getItem('smriti_user_id') : null);
  const targetUserId = resolvedId ? Number(resolvedId) : null;
  if (!targetUserId) {
    console.warn('activityService: No authenticated user ID provided. Cannot record activity.');
    return { activityId: null, sessionId: null, scoreId: null };
  }
  const targetPatientId = Number(patientId || targetUserId);

  // Determine user demo flag from database
  let isDemo = false;
  try {
    const user = await db.users.get(targetUserId);
    isDemo = Boolean(user?.isDemo);
  } catch (err) {
    console.warn('activityService: Could not resolve user demo status:', err);
  }

  const activeDomain = normalizeDomain(domain || gameType || 'memory');
  const finalGameName = activityName || gameName || `${activeDomain} Game`;
  const cleanScore = Math.max(0, Math.min(100, Math.round(Number(score || 0))));
  const cleanAccuracy = accuracy !== undefined && accuracy !== null 
    ? Math.max(0, Math.min(100, Math.round(Number(accuracy))))
    : cleanScore;
  const cleanDuration = Math.max(0, Math.round(Number(durationSeconds || 0)));
  const cleanMistakes = Math.max(0, Math.round(Number(mistakes || 0)));
  const dateStr = date || getLocalDateString(now);

  // Atomic transaction
  const result = await db.transaction('rw', [
    db.activityRecords,
    db.gameSessions,
    db.cognitiveScores,
    db.dailyActivityTracker,
    db.syncQueue
  ], async () => {
    // 1. Write to canonical activityRecords
    const activityPayload = {
      userId: targetUserId,
      patientId: targetPatientId,
      isDemo,
      activityType,
      gameType: activeDomain,
      domain: activeDomain,
      activityName: finalGameName,
      score: cleanScore,
      accuracy: cleanAccuracy,
      mistakes: cleanMistakes,
      durationSeconds: cleanDuration,
      difficulty,
      completed: Boolean(completed),
      timestamp: isoTimestamp,
      date: dateStr,
      createdAt: isoTimestamp,
      metadata
    };
    const activityId = await db.activityRecords.add(activityPayload);

    let sessionId = null;
    // 2. If it is a game, also write to gameSessions for table parity
    if (activityType === 'game') {
      const sessionPayload = {
        userId: targetUserId,
        patientId: targetPatientId,
        isDemo,
        gameName: finalGameName,
        gameType: activeDomain,
        domain: activeDomain,
        score: cleanScore,
        difficultyLevel: difficulty,
        durationSeconds: cleanDuration,
        completedAt: isoTimestamp,
        createdAt: isoTimestamp,
        correctCount: Math.max(0, 10 - cleanMistakes),
        mistakeCount: cleanMistakes,
        createdOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false
      };
      sessionId = await db.gameSessions.add(sessionPayload);
    }

    // 3. Write or update cognitiveScores for the domain trajectory on this date
    const existingScores = await db.cognitiveScores
      .where('userId')
      .equals(targetUserId)
      .filter(s => s.date === dateStr && s.domain === activeDomain)
      .toArray();

    let scoreId = null;
    if (existingScores.length > 0) {
      // Average previous session(s) with the new session
      const previousTotal = existingScores.reduce((acc, curr) => acc + curr.score, 0);
      const newAverage = Math.round((previousTotal + cleanScore) / (existingScores.length + 1));
      scoreId = existingScores[0].id;
      await db.cognitiveScores.update(scoreId, {
        score: newAverage,
        timestamp: isoTimestamp,
        updatedAt: isoTimestamp
      });
    } else {
      const scorePayload = {
        userId: targetUserId,
        patientId: targetPatientId,
        isDemo,
        date: dateStr,
        domain: activeDomain,
        category: activeDomain,
        score: cleanScore,
        timestamp: isoTimestamp,
        createdAt: isoTimestamp
      };
      scoreId = await db.cognitiveScores.add(scorePayload);
    }

    // 4. Update dailyActivityTracker
    try {
      const trackerKey = [targetUserId, dateStr];
      const existingTracker = await db.dailyActivityTracker.where('[userId+date]').equals(trackerKey).first();
      const activitySummary = {
        activityId,
        activityType,
        activityKey: `act_${activityId}`,
        domain: activeDomain,
        score: cleanScore,
        timestamp: isoTimestamp
      };

      if (existingTracker) {
        const list = Array.isArray(existingTracker.completedActivities)
          ? existingTracker.completedActivities
          : [];
        await db.dailyActivityTracker.update(existingTracker.id, {
          completedActivities: [...list, activitySummary]
        });
      } else {
        await db.dailyActivityTracker.add({
          userId: targetUserId,
          date: dateStr,
          creditsEarnedToday: 0,
          completedActivities: [activitySummary]
        });
      }
    } catch (trackerErr) {
      console.warn('activityService: dailyActivityTracker update notice:', trackerErr);
    }

    // 5. Queue sync
    await queueSyncItem('activityRecords', activityId, 'INSERT', activityPayload, {
      userId: targetUserId,
      patientId: targetPatientId,
      isDemo
    });

    return { activityId, sessionId, scoreId };
  });

  // Award economy credits safely outside the critical transaction
  try {
    if (activityType === 'game' && economyService) {
      const creditAmount = cleanScore >= 80 ? 15 : 10;
      await economyService.awardCredits(
        targetUserId,
        creditAmount,
        `Completed ${activityName || activeDomain} (Score: ${cleanScore}%)`,
        'COGNITIVE_GAME',
        `act_${result.activityId}`
      );
    }
  } catch (creditErr) {
    console.warn('activityService: Could not award economy credits:', creditErr);
  }

  return result;
}

/**
 * Generates true calendar trajectory data for 7, 14, or 30 days
 * Inactive days have domain values set to null (never 0!) so Recharts
 * connectNulls={false} displays gaps rather than artificial drops.
 */
export async function getCognitiveHistory({
  userId,
  days = 7,
  includeDemo = false,
  referenceDate = new Date()
}) {
  if (!userId) {
    return { timeline: [], hasData: false, totalSessions: 0, domainAverages: {} };
  }

  const calendarDates = getCalendarDateRange(days, referenceDate);
  const targetId = Number(userId);

  // Query raw scores from Dexie (check both userId and patientId)
  let rawScores = [];
  try {
    const allScores = await db.cognitiveScores.toArray();
    rawScores = allScores.filter(s => {
      const match = Number(s.userId || s.patientId) === targetId;
      if (!match) return false;
      return includeDemo || !s.isDemo;
    });
  } catch (err) {
    console.warn('getCognitiveHistory: error querying cognitiveScores:', err);
  }

  // Merge any gameSessions not already represented
  try {
    if (db.gameSessions) {
      const allSessions = await db.gameSessions.toArray();
      const userSessions = allSessions.filter(s => {
        const match = Number(s.userId || s.patientId) === targetId;
        if (!match) return false;
        return includeDemo || !s.isDemo;
      });

      userSessions.forEach(s => {
        const sDate = s.date || (s.completedAt ? getLocalDateString(new Date(s.completedAt)) : null) || (s.createdAt ? getLocalDateString(new Date(s.createdAt)) : null);
        const dom = normalizeDomain(s.domain || s.gameType || s.gameName);
        if (sDate) {
          const exists = rawScores.some(r => r.date === sDate && normalizeDomain(r.domain || r.gameType) === dom);
          if (!exists) {
            rawScores.push({
              userId: targetId,
              patientId: targetId,
              isDemo: s.isDemo,
              date: sDate,
              domain: dom,
              score: s.score,
              gameName: s.gameName,
              durationSeconds: s.durationSeconds,
              accuracy: s.accuracy,
              difficulty: s.difficultyLevel
            });
          }
        }
      });
    }
  } catch (err) {
    console.warn('getCognitiveHistory: error querying gameSessions:', err);
  }

  // Group scores by date and domain
  const dateDomainMap = {};
  rawScores.forEach((s) => {
    if (!dateDomainMap[s.date]) {
      dateDomainMap[s.date] = {};
    }
    if (!dateDomainMap[s.date][s.domain]) {
      dateDomainMap[s.date][s.domain] = [];
    }
    dateDomainMap[s.date][s.domain].push(s.score);
  });

  let totalDataPoints = 0;
  const domainTotals = { memory: [], attention: [], routine: [], pattern: [] };

  // Build contiguous timeline of length = days
  const timeline = calendarDates.map((dStr) => {
    const dayScores = dateDomainMap[dStr] || {};

    const getDomainScore = (domain) => {
      const list = dayScores[domain];
      if (!list || list.length === 0) return null;
      totalDataPoints++;
      const avg = Math.round(list.reduce((a, b) => a + b, 0) / list.length);
      domainTotals[domain].push(avg);
      return avg;
    };

    const memoryVal = getDomainScore('memory');
    const attentionVal = getDomainScore('attention');
    const routineVal = getDomainScore('routine');
    const patternVal = getDomainScore('pattern');

    const hasActivity = memoryVal !== null || attentionVal !== null || routineVal !== null || patternVal !== null;

    return {
      rawDate: dStr,
      date: formatDisplayDate(dStr),
      memory: memoryVal,
      attention: attentionVal,
      routine: routineVal,
      pattern: patternVal,
      hasActivity
    };
  });

  const domainAverages = {};
  Object.keys(domainTotals).forEach((d) => {
    const scores = domainTotals[d];
    domainAverages[d] = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;
  });

  const allScores = Object.values(domainTotals).flat();
  const overallAverage = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : null;

  return {
    timeline,
    hasData: totalDataPoints > 0,
    totalSessions: totalDataPoints,
    domainAverages,
    overallAverage
  };
}

/**
 * Fetch unified activity records for table audit
 */
export async function getActivityRecords({
  userId,
  patientId,
  limit = 50,
  includeDemo = false
} = {}) {
  const targetId = Number(userId || patientId);
  if (!targetId) return [];

  // Try activityRecords table first, fall back to gameSessions if empty
  let records = [];
  try {
    if (db.activityRecords) {
      records = await db.activityRecords.where('userId').equals(targetId).reverse().toArray();
    }
  } catch (err) {
    console.warn('activityService: activityRecords query notice:', err);
  }

  if (records.length === 0 && db.gameSessions) {
    const sessions = await db.gameSessions.where('userId').equals(targetId).reverse().toArray();
    records = sessions.map(s => ({
      id: s.id,
      userId: s.userId,
      patientId: s.patientId || s.userId,
      isDemo: Boolean(s.isDemo),
      activityType: 'game',
      gameType: s.gameType,
      domain: s.gameType || 'memory',
      activityName: s.gameName,
      score: s.score,
      accuracy: s.correctCount && (s.correctCount + (s.mistakeCount || 0)) > 0
        ? Math.round((s.correctCount / (s.correctCount + (s.mistakeCount || 0))) * 100)
        : s.score,
      mistakes: s.mistakeCount || 0,
      durationSeconds: s.durationSeconds || 0,
      difficulty: s.difficultyLevel || 'medium',
      completed: true,
      timestamp: s.completedAt || s.createdAt,
      date: (s.completedAt || s.createdAt || '').split('T')[0]
    }));
  }

  if (!includeDemo) {
    records = records.filter(r => !r.isDemo);
  }

  return records.slice(0, limit);
}

/**
 * Calculate honest high-level statistics for caregiver metrics
 * Zero fake defaults: returns null if no records exist.
 */
export async function getSummaryMetrics({ userId, includeDemo = false }) {
  if (!userId) {
    return { avgScore: null, totalGames: 0, adherenceRate: null, lastActiveDate: null };
  }
  const targetId = Number(userId);

  // Scores
  let scores = await db.cognitiveScores.where('userId').equals(targetId).toArray();
  if (!includeDemo) {
    scores = scores.filter(s => !s.isDemo);
  }

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((acc, curr) => acc + curr.score, 0) / scores.length)
    : null;

  // Games / Sessions
  let sessions = await db.gameSessions.where('userId').equals(targetId).toArray();
  if (!includeDemo) {
    sessions = sessions.filter(s => !s.isDemo);
  }

  // Reminders
  let reminders = await db.reminders.toArray();
  reminders = reminders.filter(r => 
    Number(r.targetUserId) === targetId || 
    Number(r.userId) === targetId || 
    Number(r.patientId) === targetId
  );
  if (!includeDemo) {
    reminders = reminders.filter(r => !r.isDemo);
  }

  const completedReminders = reminders.filter(r => r.done || r.completed).length;
  const adherenceRate = reminders.length > 0
    ? Math.round((completedReminders / reminders.length) * 100)
    : null;

  // Last Active Date
  let lastActiveDate = null;
  if (sessions.length > 0) {
    const sorted = [...sessions].sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
    lastActiveDate = sorted[0].completedAt || sorted[0].createdAt || null;
  }

  return {
    avgScore,
    totalGames: sessions.length,
    adherenceRate,
    lastActiveDate
  };
}
