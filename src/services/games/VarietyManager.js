/**
 * VarietyManager
 * 
 * Prevents repetition of questions and patterns in the same session.
 * Features:
 * - Content fingerprinting via normalized hash
 * - In-memory active session cache (usedQuestionIds & fingerprints)
 * - Persistent Dexie cooldown lookup (avoids repeats from recent history)
 * - Graceful LRU pool exhaustion & parameter variation
 */
import { db } from '../../db/dexie.js';

// In-memory session stores (active across re-renders & page navigation)
const sessionUsedFingerprints = new Set();
const sessionUsedQuestionIds = new Set();
const sessionUsedTemplates = new Map(); // gameType -> array of templateIds

/**
 * Normalizes input object/data into a deterministic string
 */
function normalizeData(val) {
  if (val === null || val === undefined) return '';
  if (typeof val !== 'object') return String(val).trim().toLowerCase();
  if (Array.isArray(val)) {
    return '[' + val.map(normalizeData).join(',') + ']';
  }
  const keys = Object.keys(val).sort();
  return '{' + keys.map((k) => `${k}:${normalizeData(val[k])}`).join(',') + '}';
}

/**
 * Computes a deterministic content fingerprint string
 */
export function computeFingerprint(gameType, templateId, payload) {
  const norm = `${gameType}::${templateId}::${normalizeData(payload)}`;
  // DJB2 hash variant to 8-character hex
  let hash = 5381;
  for (let i = 0; i < norm.length; i++) {
    hash = ((hash << 5) + hash) + norm.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return `${gameType}_${templateId}_${hex}`;
}

/**
 * Checks if a question ID or fingerprint has already been used in the active session
 */
export function isUsedInSession(questionId, fingerprint) {
  if (questionId && sessionUsedQuestionIds.has(questionId)) {
    return true;
  }
  if (fingerprint && sessionUsedFingerprints.has(fingerprint)) {
    return true;
  }
  return false;
}

/**
 * Checks if a fingerprint was used in the user's recent history in Dexie
 */
export async function isUsedInHistory(userId, fingerprint, maxRecency = 25) {
  // 1. First check session set (synchronous & fast)
  if (sessionUsedFingerprints.has(fingerprint)) {
    return true;
  }

  // 2. Check Dexie persistent records if userId provided
  if (!userId || !db?.usedQuestionFingerprints) return false;

  try {
    const recent = await db.usedQuestionFingerprints
      .where('userId')
      .equals(userId)
      .reverse()
      .limit(maxRecency)
      .toArray();

    return recent.some((r) => r.contentHash === fingerprint);
  } catch (err) {
    console.warn('Dexie usedQuestionFingerprints lookup warning:', err);
    return false;
  }
}

/**
 * Marks a challenge as used in both active session and Dexie
 */
export async function markChallengeUsed({ userId, gameType, templateId, questionId, contentHash }) {
  if (questionId) sessionUsedQuestionIds.add(questionId);
  if (contentHash) sessionUsedFingerprints.add(contentHash);

  // Track template frequency
  if (gameType && templateId) {
    const arr = sessionUsedTemplates.get(gameType) || [];
    arr.push(templateId);
    sessionUsedTemplates.set(gameType, arr);
  }

  // Persist to Dexie
  if (userId && db?.usedQuestionFingerprints && contentHash) {
    try {
      await db.usedQuestionFingerprints.add({
        userId,
        contentHash,
        gameType: gameType || 'unknown',
        templateId: templateId || 'default',
        usedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Could not persist usedQuestionFingerprint:', err);
    }
  }
}

/**
 * Clears active session cache (e.g. when user explicitly starts a brand-new daily playlist)
 */
export function clearSessionCache() {
  sessionUsedFingerprints.clear();
  sessionUsedQuestionIds.clear();
  sessionUsedTemplates.clear();
}

export const resetSessionCache = clearSessionCache;

/**
 * Returns count of used challenges in active session
 */
export function getSessionUsedCount() {
  return sessionUsedFingerprints.size;
}

/**
 * Recycles question pool when exhausted:
 * Prioritizes least recently used templates and applies seed jitter
 */
export function recycleExhaustedPool(allTemplates, gameType) {
  const usedHistory = sessionUsedTemplates.get(gameType) || [];
  const counts = new Map();

  allTemplates.forEach((t) => counts.set(t.id, 0));
  usedHistory.forEach((id) => {
    if (counts.has(id)) counts.set(id, counts.get(id) + 1);
  });

  // Sort ascending by usage count (least recently used first)
  return [...allTemplates].sort((a, b) => (counts.get(a.id) || 0) - (counts.get(b.id) || 0));
}
