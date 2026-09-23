/**
 * PerformanceTracker
 * 
 * Records individual cognitive challenge results, updates streaks,
 * persists telemetry to Dexie, and triggers adaptive difficulty recalculation.
 */
import { db } from '../../db/dexie.js';
import {
  calculateAdaptedDifficulty,
  getUserDifficultyProfile,
  GAME_TYPE_DOMAINS,
  scoreToDiscreteLevel,
  getAdaptiveSupportMessage,
  evaluateAdaptationResult
} from './AdaptiveDifficultyEngine.js';
import { markChallengeUsed } from './VarietyManager.js';

// In-memory streak tracking per user and gameType for instant feedback
const streakTracker = new Map(); // key: `${userId}_${gameType}` -> { consecutiveCorrect, consecutiveMistakes }

function getStreakKey(userId, gameType) {
  return `${userId || 1}_${gameType || 'general'}`;
}

export function getLiveStreak(userId, gameType) {
  const key = getStreakKey(userId, gameType);
  return streakTracker.get(key) || { consecutiveCorrect: 0, consecutiveMistakes: 0 };
}

export function resetLiveStreak(userId, gameType) {
  const key = getStreakKey(userId, gameType);
  streakTracker.set(key, { consecutiveCorrect: 0, consecutiveMistakes: 0 });
}

/**
 * Records challenge performance and calculates adaptive difficulty
 */
export async function recordChallengeResult({
  userId = 1,
  sessionId = 'default_session',
  gameType = 'memoryMatch',
  templateId = 'default',
  difficultyBefore = 0.50,
  questionId,
  contentHash,
  correct = true,
  responseTimeMs = 0,
  hintsUsed = 0,
  retries = 0,
  skipped = false,
  score = 100
}) {
  const domainKey = GAME_TYPE_DOMAINS[gameType] || 'memoryMatch';
  const streakKey = getStreakKey(userId, domainKey);
  const streak = streakTracker.get(streakKey) || { consecutiveCorrect: 0, consecutiveMistakes: 0 };

  // 1. Update live streaks
  if (correct && !skipped) {
    streak.consecutiveCorrect += 1;
    streak.consecutiveMistakes = 0;
  } else {
    streak.consecutiveMistakes += 1;
    streak.consecutiveCorrect = 0;
  }
  streakTracker.set(streakKey, streak);

  // 2. Fetch past window of challenges from Dexie (last 10)
  let recentChallenges = [];
  if (userId && db?.gameChallenges) {
    try {
      recentChallenges = await db.gameChallenges
        .where('[userId+gameType]')
        .equals([userId, domainKey])
        .reverse()
        .limit(10)
        .toArray();
    } catch (err) {
      // Fallback query if compound index unavailable
      try {
        recentChallenges = await db.gameChallenges
          .where('userId')
          .equals(userId)
          .filter((c) => c.gameType === domainKey)
          .reverse()
          .limit(10)
          .toArray();
      } catch (e) {
        console.warn('Dexie gameChallenges read warning:', e);
      }
    }
  }

  // 3. Calculate new adapted continuous score
  const newDifficulty = calculateAdaptedDifficulty({
    currentDifficulty: difficultyBefore,
    recentChallenges: [...recentChallenges].reverse(),
    consecutiveCorrect: streak.consecutiveCorrect,
    consecutiveMistakes: streak.consecutiveMistakes
  });

  const discreteLevel = scoreToDiscreteLevel(newDifficulty);
  const encouragementMessage = getAdaptiveSupportMessage(difficultyBefore, newDifficulty);

  // 4. Persist to Dexie
  const nowStr = new Date().toISOString();

  // A. Add challenge record
  if (userId && db?.gameChallenges) {
    try {
      await db.gameChallenges.add({
        userId,
        sessionId,
        gameType: domainKey,
        difficulty: newDifficulty,
        questionId: questionId || `q_${Date.now()}`,
        contentHash: contentHash || `hash_${Date.now()}`,
        correct: Boolean(correct),
        responseTimeMs: Math.round(responseTimeMs || 0),
        hintsUsed: Math.round(hintsUsed || 0),
        retries: Math.round(retries || 0),
        skipped: Boolean(skipped),
        score: Math.round(score || 0),
        completedAt: nowStr
      });
    } catch (err) {
      console.warn('Could not persist gameChallenge:', err);
    }
  }

  // B. Update adaptive profile in Dexie
  if (userId && db?.adaptiveProfiles) {
    try {
      const profile = await getUserDifficultyProfile(userId);
      profile[domainKey] = newDifficulty;

      // Recalculate overall weighted average
      const sum = (
        Number(profile.memoryMatch || 0.5) +
        Number(profile.patternRecognition || 0.5) +
        Number(profile.sequenceMemory || 0.5) +
        Number(profile.auditoryAttention || 0.5)
      );
      profile.overallDifficulty = Number((sum / 4).toFixed(3));
      profile.updatedAt = nowStr;

      await db.adaptiveProfiles.put(profile);
    } catch (err) {
      console.warn('Could not update adaptiveProfile in Dexie:', err);
    }
  }

  // C. Register used fingerprint in VarietyManager
  await markChallengeUsed({
    userId,
    gameType: domainKey,
    templateId,
    questionId,
    contentHash
  });

  const adaptation = evaluateAdaptationResult({
    difficultyBefore,
    difficultyAfter: newDifficulty,
    accuracy: score,
    mistakes: streak.consecutiveMistakes,
    consecutiveCorrect: streak.consecutiveCorrect,
    consecutiveMistakes: streak.consecutiveMistakes
  });

  return {
    difficultyBefore,
    newDifficulty,
    discreteLevel,
    encouragementMessage,
    streak: { ...streak },
    adaptation
  };
}
