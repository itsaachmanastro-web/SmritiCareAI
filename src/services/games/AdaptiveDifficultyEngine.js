/**
 * AdaptiveDifficultyEngine
 * 
 * Centralized cognitive difficulty adaptation engine for SmritiCare.
 * 
 * Key Principles:
 * 1. Continuous difficulty score (0.0 to 1.0) mapped smoothly to Easy, Medium, Hard.
 * 2. Per-game difficulty tracking + overall cognitive profile.
 * 3. Rolling window evaluation (last 6-8 challenges) with hysteresis to prevent wild oscillations.
 * 4. Elderly-friendly: slow response time is never penalized; mistakes trigger supportive easing.
 * 5. Strict transition guard: never jump Easy -> Hard in a single step.
 */
import { db } from '../../db/dexie.js';

export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

export const DIFFICULTY_THRESHOLDS = {
  EASY_MAX: 0.38,
  MEDIUM_MAX: 0.70
};

export const GAME_TYPE_DOMAINS = {
  bihu: 'memoryMatch',
  memory: 'memoryMatch',
  memoryMatch: 'memoryMatch',

  mekhela: 'patternRecognition',
  pattern: 'patternRecognition',
  patternRecognition: 'patternRecognition',

  teagarden: 'sequenceMemory',
  sequence: 'sequenceMemory',
  sequenceMemory: 'sequenceMemory',

  soundshills: 'auditoryAttention',
  attention: 'auditoryAttention',
  sound: 'auditoryAttention',
  auditoryAttention: 'auditoryAttention'
};

/**
 * Maps a continuous score (0.0 - 1.0) to a discrete level string ('easy', 'medium', 'hard')
 */
export function scoreToDiscreteLevel(score) {
  const s = Math.max(0, Math.min(1, Number(score) || 0.5));
  if (s <= DIFFICULTY_THRESHOLDS.EASY_MAX) return DIFFICULTY_LEVELS.EASY;
  if (s <= DIFFICULTY_THRESHOLDS.MEDIUM_MAX) return DIFFICULTY_LEVELS.MEDIUM;
  return DIFFICULTY_LEVELS.HARD;
}

/**
 * Maps a discrete level string ('easy', 'medium', 'hard') to a baseline continuous score
 */
export function discreteLevelToScore(level) {
  switch (String(level).toLowerCase()) {
    case 'easy':
      return 0.25;
    case 'hard':
      return 0.82;
    case 'medium':
    default:
      return 0.50;
  }
}

/**
 * Evaluates new continuous difficulty based on recent performance window
 */
export function calculateAdaptedDifficulty({
  currentDifficulty = 0.50,
  recentChallenges = [],
  consecutiveCorrect = 0,
  consecutiveMistakes = 0
}) {
  let difficulty = Math.max(0.15, Math.min(0.95, Number(currentDifficulty) || 0.50));

  // 1. Immediate streak adjustments (micro-adaptation)
  if (consecutiveMistakes >= 2) {
    // 2 or more consecutive mistakes: offer supportive easing (-0.10)
    difficulty = Math.max(0.15, difficulty - 0.10);
    return Number(difficulty.toFixed(3));
  }

  if (consecutiveCorrect >= 4) {
    // 4 or more consecutive correct: increase by one gradual step (+0.08)
    difficulty = Math.min(0.95, difficulty + 0.08);
    return Number(difficulty.toFixed(3));
  }

  // 2. Rolling window evaluation (macro-adaptation over last 6 challenges)
  if (!recentChallenges || recentChallenges.length === 0) {
    return Number(difficulty.toFixed(3));
  }

  const windowSlice = recentChallenges.slice(-6);
  const totalInWindow = windowSlice.length;

  let weightedCorrect = 0;
  windowSlice.forEach((c) => {
    if (c.correct) {
      // Partial credit if hints were required
      weightedCorrect += (c.hintsUsed && c.hintsUsed > 0) ? 0.7 : 1.0;
    }
  });

  const accuracy = weightedCorrect / totalInWindow;

  if (accuracy >= 0.85 && totalInWindow >= 4) {
    // High accuracy: gradually increase difficulty (+0.08)
    difficulty = Math.min(0.95, difficulty + 0.08);
  } else if (accuracy < 0.60 && totalInWindow >= 3) {
    // Struggling: reduce difficulty slightly (-0.08)
    difficulty = Math.max(0.15, difficulty - 0.08);
  }

  // 3. Guard against excessive single-step leaps (never leap > 0.15 at once)
  const delta = difficulty - currentDifficulty;
  if (Math.abs(delta) > 0.15) {
    difficulty = currentDifficulty + Math.sign(delta) * 0.15;
  }

  return Number(difficulty.toFixed(3));
}

export const computeNextDifficulty = calculateAdaptedDifficulty;

/**
 * Retrieves the user's current difficulty profile from Dexie (or creates default)
 */
export async function getUserDifficultyProfile(userId) {
  const defaultProfile = {
    userId: userId || 1,
    overallDifficulty: 0.50,
    memoryMatch: 0.50,
    sequenceMemory: 0.45,
    patternRecognition: 0.50,
    auditoryAttention: 0.45,
    updatedAt: new Date().toISOString()
  };

  if (!userId || !db?.adaptiveProfiles) {
    return defaultProfile;
  }

  try {
    const existing = await db.adaptiveProfiles.get(userId);
    if (existing) return existing;

    // Initialize in Dexie if absent
    await db.adaptiveProfiles.put(defaultProfile);
    return defaultProfile;
  } catch (err) {
    console.warn('Could not fetch adaptiveProfile from Dexie:', err);
    return defaultProfile;
  }
}

/**
 * Gets the specific continuous score and discrete level for a game type
 */
export async function getGameDifficulty(userId, gameType) {
  const profile = await getUserDifficultyProfile(userId);
  const domainKey = GAME_TYPE_DOMAINS[gameType] || 'memoryMatch';
  const continuous = Number(profile[domainKey]) || Number(profile.overallDifficulty) || 0.50;
  const discrete = scoreToDiscreteLevel(continuous);

  return {
    continuous,
    discrete,
    domainKey
  };
}

/**
 * Generates an elderly-friendly supportive encouragement message based on adaptation
 */
export function getAdaptiveSupportMessage(diffBefore, diffAfter, t = null) {
  const beforeDiscrete = scoreToDiscreteLevel(diffBefore);
  const afterDiscrete = scoreToDiscreteLevel(diffAfter);

  const translate = (key, fallback) => (typeof t === 'function' ? t(key) : fallback);

  if (afterDiscrete === beforeDiscrete) {
    return translate('games.adaptive.steadyPace', 'Steady progress! Keep enjoying at your own pace 🌸');
  }

  if (diffAfter < diffBefore) {
    return translate('games.adaptive.simplerChallenge', "Let's try a gentle, relaxing challenge next 🌸");
  }

  return translate('games.adaptive.greatNextLevel', "Splendid work! Ready for the next little challenge? 🌟");
}
