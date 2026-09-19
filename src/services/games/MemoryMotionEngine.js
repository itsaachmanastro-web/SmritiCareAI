/**
 * MemoryMotionEngine — AI-Adaptive Video Cognitive Difficulty Engine
 * 
 * Modular engine for SmritiCare's "Memory Motion" video training game.
 * 
 * Responsibilities:
 * 1. Continuous Difficulty Score (1.0 to 10.0, baseline 5.0).
 * 2. Micro & Macro Performance adaptation (streaks, accuracy, reaction time).
 * 3. Multi-dimensional cognitive skill tracking (visualMemory, sequenceMemory, attention, recall).
 * 4. Extensible challenge selection with skill-deficit targeting and variety protection.
 * 5. Telemetry persistence to Dexie (gameChallenges, adaptiveProfiles, gameSessions).
 * 6. Non-diagnostic dementia-friendly session recommendations (local + optional Gemini AI).
 */
import { db } from '../../db/dexie.js';
import { saveGameSession } from '../../db/syncService.js';
import { MEMORY_MOTION_CHALLENGES } from '../../data/memoryMotionChallenges.js';
import { aiService } from '../ai/aiService.js';

export const INITIAL_DIFFICULTY = 5.0;

export const DIFFICULTY_TIERS = {
  EASY: { min: 1.0, max: 3.9, labelKey: 'games.memorymotion.tiers.easy', defaultLabel: 'Gentle & Familiar' },
  MEDIUM: { min: 4.0, max: 6.9, labelKey: 'games.memorymotion.tiers.medium', defaultLabel: 'Balanced & Engaging' },
  HARD: { min: 7.0, max: 8.9, labelKey: 'games.memorymotion.tiers.hard', defaultLabel: 'Attentive & Detailed' },
  ADVANCED: { min: 9.0, max: 10.0, labelKey: 'games.memorymotion.tiers.advanced', defaultLabel: 'Sharp Focus' }
};

export function getDifficultyTier(score) {
  const s = Math.max(1.0, Math.min(10.0, Number(score) || INITIAL_DIFFICULTY));
  if (s < 4.0) return 'easy';
  if (s < 7.0) return 'medium';
  if (s < 9.0) return 'hard';
  return 'advanced';
}

export function getTierInfo(score) {
  const tier = getDifficultyTier(score);
  return DIFFICULTY_TIERS[tier.toUpperCase()] || DIFFICULTY_TIERS.MEDIUM;
}

/**
 * Calculates updated continuous difficulty based on recent performance
 */
export function calculateAdaptedDifficulty({
  currentDifficulty = INITIAL_DIFFICULTY,
  recentResults = [],
  consecutiveCorrect = 0,
  consecutiveMistakes = 0,
  lastResponseTimeMs = 0
}) {
  let diff = Math.max(1.0, Math.min(10.0, Number(currentDifficulty) || INITIAL_DIFFICULTY));

  // 1. Immediate micro-adaptation on streaks
  if (consecutiveMistakes >= 2) {
    // 2 consecutive mistakes: provide immediate supportive easing (-0.8)
    diff = Math.max(1.0, diff - 0.8);
    return Number(diff.toFixed(1));
  }

  if (consecutiveCorrect >= 3) {
    // 3 consecutive correct: gradual step up (+0.6)
    diff = Math.min(10.0, diff + 0.6);
    return Number(diff.toFixed(1));
  }

  // 2. Rolling window evaluation (macro-adaptation over recent 4-6 challenges)
  if (!recentResults || recentResults.length === 0) {
    return Number(diff.toFixed(1));
  }

  const windowSlice = recentResults.slice(-5);
  const total = windowSlice.length;
  const correctCount = windowSlice.filter(r => r.correct).length;
  const accuracy = correctCount / total;

  const avgResponseTime = windowSlice.reduce((acc, r) => acc + (r.responseTimeMs || 3000), 0) / total;

  if (accuracy >= 0.85 && total >= 3) {
    // High performance: bonus if reaction time is brisk (< 7000ms)
    const speedBonus = avgResponseTime < 6000 ? 0.4 : 0.2;
    diff = Math.min(10.0, diff + 0.6 + speedBonus);
  } else if (accuracy < 0.60 && total >= 2) {
    // Struggling: ease difficulty
    diff = Math.max(1.0, diff - 0.8);
  }

  // 3. Hysteresis clamp: never leap more than 1.0 level in a single adaptation
  const delta = diff - currentDifficulty;
  if (Math.abs(delta) > 1.0) {
    diff = currentDifficulty + Math.sign(delta) * 1.0;
  }

  return Number(Math.max(1.0, Math.min(10.0, diff)).toFixed(1));
}

/**
 * Calculates updated cognitive skill profile breakdown (1.0 to 10.0 per skill)
 */
export function calculateSkillScores(results = [], baselineScores = null) {
  const defaults = {
    visualMemory: 5.0,
    sequenceMemory: 4.5,
    attention: 5.0,
    recall: 5.0
  };

  const current = { ...defaults, ...(baselineScores || {}) };

  if (!results || results.length === 0) {
    return current;
  }

  // Group performance by cognitive skill
  const skillBuckets = {
    recognition: [],
    recall: [],
    sequence: [],
    attention: [],
    'working-memory': []
  };

  for (const r of results) {
    const skill = r.cognitiveSkill || 'recognition';
    if (skillBuckets[skill]) {
      skillBuckets[skill].push(r);
    }
  }

  const computeSkillAverage = (items, fallback) => {
    if (!items || items.length === 0) return fallback;
    const correctCount = items.filter(i => i.correct).length;
    const ratio = correctCount / items.length;
    // Map ratio (0 to 1) towards a 1 to 10 scale weighted with fallback
    return Number((fallback * 0.4 + (ratio * 9 + 1) * 0.6).toFixed(1));
  };

  return {
    visualMemory: computeSkillAverage(
      [...(skillBuckets.recognition || []), ...(skillBuckets['working-memory'] || [])],
      current.visualMemory
    ),
    sequenceMemory: computeSkillAverage(skillBuckets.sequence, current.sequenceMemory),
    attention: computeSkillAverage(skillBuckets.attention, current.attention),
    recall: computeSkillAverage(skillBuckets.recall, current.recall)
  };
}

/**
 * Selects the optimal next video challenge
 * - Clustered around the target difficulty (within ±1.5 levels)
 * - Prioritizes cognitive domains where the user has room to practice
 * - Avoids repeating challenges already played in the current session
 */
export function selectNextChallenge({
  currentDifficulty = INITIAL_DIFFICULTY,
  userSkillScores = null,
  usedIds = [],
  challengesPool = MEMORY_MOTION_CHALLENGES
}) {
  const targetDiff = Math.max(1.0, Math.min(10.0, Number(currentDifficulty) || INITIAL_DIFFICULTY));
  const available = challengesPool.filter(c => !usedIds.includes(c.id));

  // If all challenges used, reset pool
  const pool = available.length > 0 ? available : challengesPool;

  // 1. Filter challenges within proximity band
  let candidates = pool.filter(c => Math.abs(c.difficulty - targetDiff) <= 1.8);

  if (candidates.length === 0) {
    candidates = pool.filter(c => Math.abs(c.difficulty - targetDiff) <= 3.0);
  }

  if (candidates.length === 0) {
    candidates = pool;
  }

  // 2. Skill targeting: identify lowest skill score if provided
  if (userSkillScores) {
    const skillKeys = ['sequenceMemory', 'attention', 'recall', 'visualMemory'];
    let lowestSkill = 'sequenceMemory';
    let minScore = 10.0;

    for (const k of skillKeys) {
      if (typeof userSkillScores[k] === 'number' && userSkillScores[k] < minScore) {
        minScore = userSkillScores[k];
        lowestSkill = k;
      }
    }

    // Map skill key to challenge cognitiveSkill
    const targetSkillMap = {
      sequenceMemory: 'sequence',
      attention: 'attention',
      recall: 'recall',
      visualMemory: 'recognition'
    };
    const preferredSkill = targetSkillMap[lowestSkill];

    const skillMatches = candidates.filter(c => c.cognitiveSkill === preferredSkill);
    if (skillMatches.length > 0) {
      // Pick the closest difficulty match among skill matches
      skillMatches.sort((a, b) => Math.abs(a.difficulty - targetDiff) - Math.abs(b.difficulty - targetDiff));
      return skillMatches[0];
    }
  }

  // 3. Closest difficulty match with slight randomization among top 2
  candidates.sort((a, b) => Math.abs(a.difficulty - targetDiff) - Math.abs(b.difficulty - targetDiff));
  const topChoices = candidates.slice(0, Math.min(3, candidates.length));
  return topChoices[Math.floor(Math.random() * topChoices.length)];
}

/**
 * Fetches user's current Memory Motion adaptive profile from Dexie
 */
export async function getMemoryMotionProfile(userId) {
  const defaultProfile = {
    userId: userId || 1,
    currentDifficulty: INITIAL_DIFFICULTY,
    visualMemoryScore: 5.0,
    attentionScore: 5.0,
    sequenceMemoryScore: 4.5,
    recallScore: 5.0,
    totalSessions: 0,
    totalChallenges: 0,
    averageAccuracy: 75,
    averageReactionTimeMs: 3800,
    updatedAt: new Date().toISOString()
  };

  if (!userId || !db?.adaptiveProfiles) {
    return defaultProfile;
  }

  try {
    const profile = await db.adaptiveProfiles.get(userId);
    if (profile && profile.videoMemory !== undefined) {
      return {
        ...defaultProfile,
        currentDifficulty: Number(profile.videoMemory) || INITIAL_DIFFICULTY,
        ...profile.memoryMotionMetadata
      };
    }
    return defaultProfile;
  } catch (err) {
    console.warn('Could not read Memory Motion profile from Dexie:', err);
    return defaultProfile;
  }
}

/**
 * Persists an individual video challenge result and returns updated difficulty
 */
export async function recordVideoChallengeResult({
  userId = 1,
  sessionId,
  challenge,
  correct = true,
  responseTimeMs = 0,
  replayCount = 0,
  currentDifficulty = INITIAL_DIFFICULTY,
  recentSessionResults = []
}) {
  const nowStr = new Date().toISOString();
  const resTime = Math.max(500, Math.round(responseTimeMs || 0));

  // Determine streak
  const lastResults = [...recentSessionResults, { correct, responseTimeMs: resTime, cognitiveSkill: challenge.cognitiveSkill }];
  
  let consecutiveCorrect = 0;
  let consecutiveMistakes = 0;
  for (let i = lastResults.length - 1; i >= 0; i--) {
    if (lastResults[i].correct) {
      if (consecutiveMistakes === 0) consecutiveCorrect++;
      else break;
    } else {
      if (consecutiveCorrect === 0) consecutiveMistakes++;
      else break;
    }
  }

  // Calculate adapted difficulty
  const newDifficulty = calculateAdaptedDifficulty({
    currentDifficulty,
    recentResults: lastResults,
    consecutiveCorrect,
    consecutiveMistakes,
    lastResponseTimeMs: resTime
  });

  // Calculate skill profile
  const skillScores = calculateSkillScores(lastResults);

  // 1. Persist challenge record in Dexie db.gameChallenges
  if (db?.gameChallenges) {
    try {
      await db.gameChallenges.add({
        userId,
        sessionId: sessionId || `mm_${Date.now()}`,
        gameType: 'videoMemory',
        difficulty: newDifficulty,
        questionId: challenge.id,
        contentHash: `mm_${challenge.id}_${challenge.difficulty}`,
        correct: Boolean(correct),
        responseTimeMs: resTime,
        hintsUsed: replayCount,
        score: correct ? 100 : 40,
        cognitiveSkill: challenge.cognitiveSkill,
        completedAt: nowStr
      });
    } catch (err) {
      console.warn('Could not persist video challenge in Dexie:', err);
    }
  }

  // 2. Update user adaptive profile in Dexie db.adaptiveProfiles
  if (db?.adaptiveProfiles) {
    try {
      const existing = await db.adaptiveProfiles.get(userId) || { userId };
      await db.adaptiveProfiles.put({
        ...existing,
        videoMemory: newDifficulty,
        memoryMotionMetadata: {
          currentDifficulty: newDifficulty,
          visualMemoryScore: skillScores.visualMemory,
          attentionScore: skillScores.attention,
          sequenceMemoryScore: skillScores.sequenceMemory,
          recallScore: skillScores.recall,
          updatedAt: nowStr
        },
        updatedAt: nowStr
      });
    } catch (err) {
      console.warn('Could not update adaptiveProfile in Dexie:', err);
    }
  }

  return {
    newDifficulty,
    skillScores,
    consecutiveCorrect,
    consecutiveMistakes,
    tier: getDifficultyTier(newDifficulty)
  };
}

/**
 * Persists the entire completed session and awards stars / records
 */
export async function completeMemoryMotionSession({
  userId = 1,
  patientId,
  sessionResults = [],
  startDifficulty = INITIAL_DIFFICULTY,
  finalDifficulty = INITIAL_DIFFICULTY,
  totalDurationSeconds = 0
}) {
  const targetUserId = Number(userId || 1);
  const targetPatientId = Number(patientId || targetUserId);
  const total = sessionResults.length;
  const correctCount = sessionResults.filter(r => r.correct).length;
  const mistakeCount = total - correctCount;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 100;
  const avgResponseTimeMs = total > 0
    ? Math.round(sessionResults.reduce((acc, r) => acc + (r.responseTimeMs || 0), 0) / total)
    : 3000;

  const finalScore = Math.max(50, Math.min(100, Math.round(accuracy * 0.8 + 20)));

  // Save via universal syncService (Dexie gameSessions & activityRecords)
  try {
    await saveGameSession({
      userId: targetUserId,
      patientId: targetPatientId,
      gameName: 'Memory Motion',
      gameType: 'videoMemory',
      domain: 'videoMemory',
      score: finalScore,
      difficultyLevel: getDifficultyTier(finalDifficulty),
      durationSeconds: Math.round(totalDurationSeconds || 0),
      correctCount,
      mistakeCount
    });
  } catch (err) {
    console.warn('Could not save Memory Motion session to Dexie:', err);
  }

  return {
    accuracy,
    correctCount,
    mistakeCount,
    totalChallenges: total,
    avgResponseTimeMs,
    finalScore,
    startDifficulty,
    finalDifficulty,
    difficultyDelta: Number((finalDifficulty - startDifficulty).toFixed(1))
  };
}

/**
 * Generates an empathetic, dementia-friendly session recommendation
 * Calls Gemini via secure backend proxy if available; uses warm deterministic rules as fallback.
 */
export async function generateSessionRecommendation({
  accuracy = 100,
  avgResponseTimeMs = 3000,
  finalDifficulty = INITIAL_DIFFICULTY,
  skillsPracticed = [],
  userName = 'Amma',
  language = 'en'
}) {
  const avgSec = (avgResponseTimeMs / 1000).toFixed(1);

  // Local fallback recommendation generator
  const getLocalRecommendation = () => {
    if (accuracy >= 85) {
      return {
        en: `Splendid attention today, ${userName}! You remembered everyday details with remarkable clarity (averaging ${avgSec}s). Your visual memory is shining brightly 🌟`,
        hi: `शानदार स्मृति, ${userName}! आपने सभी दृश्यों को बहुत ध्यान से याद रखा (औसत समय ${avgSec} सेकंड)। बहुत ही सुंदर प्रदर्शन 🌟`,
        as: `বৰ সুন্দৰ স্মৃতিশক্তি, ${userName}! আপুনি প্ৰতিটো দৃশ্য অতি ধুনীয়াকৈ মনত ৰাখিছে (গড় সময় ${avgSec} ছেকেণ্ড)। অতি প্ৰশংসনীয় 🌟`,
        bn: `চমৎকার মনোযোগ, ${userName}! আপনি প্রতিটি দৃশ্য খুব সুন্দরভাবে মনে রেখেছেন (গড় সময় ${avgSec} সেকেন্ড)। দারুণ অগ্রগতি 🌟`,
        mni: `য়াম্না ফরে, ${userName}! নহাক্না ময়েং তানা মিয়াম উচেক অমসুং মফমশিং নীংশিংখি 🌟`
      };
    }
    if (accuracy >= 60) {
      return {
        en: `Steady, calm progress, ${userName}. Taking your time helped you notice beautiful moments. Keep enjoying at your own gentle pace 🌸`,
        hi: `बहुत अच्छा और शांत अभ्यास, ${userName}। आराम से याद रखने से मन शांत रहता है। अपनी गति से अभ्यास जारी रखें 🌸`,
        as: `শান্ত আৰু নিৰন্তৰ প্ৰয়াস, ${userName}। ধীৰে-সুস্থে মনত পেলোৱাটোৱেই মগজু সতেজ ৰখাৰ উত্তম উপায় 🌸`,
        bn: `ধীর ও সুন্দর অগ্রগতি, ${userName}। ধীরে ধীরে মনে করাই স্মৃতি সতেজ রাখার সেরা উপায় 🌸`,
        mni: `তপ্না-তপ্না চত্থবা অসি য়াম্না ফৈ, ${userName}। থম্মোই নুংঙাইনা নীংশিংউ 🌸`
      };
    }
    return {
      en: `You did a lovely job watching today’s peaceful scenes, ${userName}. Every gentle moment trains the mind. Let's do another relaxing session together soon 🌸`,
      hi: `आज आपने बहुत प्यार से सभी दृश्य देखे, ${userName}। हर प्रयास मन को ऊर्जा देता है। हम जल्द ही फिर साथ खेलेंगे 🌸`,
      as: `আজি আপুনি অতি মৰমেৰে দৃশ্যসমূহ উপভোগ কৰিলে, ${userName}। প্ৰতিটো শান্ত পদক্ষেপে মগজুলৈ সতেজতা আনে 🌸`,
      bn: `আজ আপনি খুব সুন্দরভাবে দৃশ্যগুলো দেখেছেন, ${userName}। প্রতিটি শান্ত মুহূর্ত মনকে সতেজ করে 🌸`,
      mni: `ঙসিগী দৃশ্যশিং অদু য়াম্না নুংঙাইনা য়েংখি, ${userName}। অমুক্কা হন্না তৌমিন্নসি 🌸`
    };
  };

  const localText = getLocalRecommendation()[language] || getLocalRecommendation().en;

  // If online, optionally request gentle conversational feedback from Gemini
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const prompt = `The elder (${userName}) just completed a video cognitive training session with ${accuracy}% accuracy and ${avgSec} seconds response time at difficulty level ${finalDifficulty}. Write a single, warm, comforting, encouraging sentence for an elderly dementia patient. Keep it positive, respectful, and free of medical jargon. Respond in language: ${language}.`;
      
      const aiRes = await aiService.sendMessage(prompt, {
        language,
        userContext: { name: userName, role: 'patient' },
        appContext: { currentPage: 'games/memorymotion' }
      });

      if (aiRes && aiRes.text && aiRes.source === 'gemini') {
        return aiRes.text;
      }
    } catch (err) {
      // Deterministic fallback operates silently
    }
  }

  return localText;
}

export default {
  INITIAL_DIFFICULTY,
  DIFFICULTY_TIERS,
  getDifficultyTier,
  getTierInfo,
  calculateAdaptedDifficulty,
  calculateSkillScores,
  selectNextChallenge,
  getMemoryMotionProfile,
  recordVideoChallengeResult,
  completeMemoryMotionSession,
  generateSessionRecommendation
};
