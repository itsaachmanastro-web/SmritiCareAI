/**
 * nextActivityService
 * 
 * Dynamic cognitive game sequencing engine for SmritiCare.
 * 
 * Core Capabilities:
 * 1. Rotates across 4 neuro-cognitive domains:
 *    Memory (Bihu) -> Attention (Sounds of Hills) -> Pattern (Mekhela) -> Routine (Tea Garden)
 * 2. Guaranteed repetition prevention: Never repeats the immediate completed game.
 * 3. Integrates with Dexie AdaptiveDifficultyEngine to configure optimal difficulty.
 * 4. Generates unique session tracking IDs.
 * 5. 100% offline-first execution with zero cloud latency.
 */
import { getGameDifficulty } from './games/AdaptiveDifficultyEngine.js';

// Continuous 4-domain progression cycle
export const DOMAIN_ROTATION_ORDER = ['bihu', 'soundshills', 'mekhela', 'teagarden'];

export const GAME_METADATA = {
  bihu: {
    id: 'bihu',
    name: 'Bihu Memory Pairs',
    domain: 'memory',
    domainKey: 'memoryMatch',
    path: '/patient/games/bihu',
    icon: '🌸',
    description: 'Match traditional cultural symbols from memory.'
  },
  soundshills: {
    id: 'soundshills',
    name: 'Sounds of the Hills',
    domain: 'attention',
    domainKey: 'auditoryAttention',
    path: '/patient/games/soundshills',
    icon: '🎵',
    description: 'Listen carefully and focus your attention on authentic hill sounds.'
  },
  mekhela: {
    id: 'mekhela',
    name: 'Mekhela Pattern Match',
    domain: 'pattern',
    domainKey: 'patternRecognition',
    path: '/patient/games/mekhela',
    icon: '🧵',
    description: 'Weave traditional textile patterns and recognize visual sequences.'
  },
  teagarden: {
    id: 'teagarden',
    name: 'Morning at the Tea Garden',
    domain: 'routine',
    domainKey: 'sequenceMemory',
    path: '/patient/games/teagarden',
    icon: '☕',
    description: 'Follow the daily steps and routines of the Assam tea garden.'
  }
};

/**
 * Computes the next cognitive game dynamically.
 * Rotates domains (Memory -> Attention -> Pattern -> Routine),
 * guarantees never repeating the current game back-to-back,
 * resolves adaptive difficulty for the target domain,
 * and generates a unique session tracking ID.
 */
export async function getNextActivity({
  userId,
  currentGameId,
  currentDomain
} = {}) {
  const storedUserId = (typeof window !== 'undefined' && window.localStorage)
    ? window.localStorage.getItem('smriti_user_id')
    : null;
  const resolvedUserId = Number(userId || storedUserId || 1);

  // Normalize current game identifier
  let currentKey = 'bihu';
  if (currentGameId) {
    const lower = String(currentGameId).toLowerCase();
    if (lower.includes('bihu') || lower.includes('memory')) currentKey = 'bihu';
    else if (lower.includes('sound') || lower.includes('hill') || lower.includes('attention')) currentKey = 'soundshills';
    else if (lower.includes('mekhela') || lower.includes('pattern')) currentKey = 'mekhela';
    else if (lower.includes('tea') || lower.includes('garden') || lower.includes('routine')) currentKey = 'teagarden';
  } else if (currentDomain) {
    if (currentDomain === 'memory') currentKey = 'bihu';
    else if (currentDomain === 'attention') currentKey = 'soundshills';
    else if (currentDomain === 'pattern') currentKey = 'mekhela';
    else if (currentDomain === 'routine') currentKey = 'teagarden';
  }

  // Determine next game index in the rotation cycle
  const currentIndex = DOMAIN_ROTATION_ORDER.indexOf(currentKey);
  const nextIndex = (currentIndex + 1) % DOMAIN_ROTATION_ORDER.length;
  let nextGameKey = DOMAIN_ROTATION_ORDER[nextIndex];

  // Safeguard: Never repeat the current game
  if (nextGameKey === currentKey) {
    nextGameKey = DOMAIN_ROTATION_ORDER[(nextIndex + 1) % DOMAIN_ROTATION_ORDER.length];
  }

  const nextMeta = GAME_METADATA[nextGameKey];

  // Retrieve adapted difficulty level for this specific domain
  let difficulty = 'medium';
  let continuousScore = 0.50;
  try {
    const diffData = await getGameDifficulty(resolvedUserId, nextMeta.domainKey);
    if (diffData) {
      difficulty = diffData.discrete || 'medium';
      continuousScore = diffData.continuous || 0.50;
    }
  } catch (diffErr) {
    console.warn('nextActivityService: Difficulty resolution fallback:', diffErr);
  }

  // Generate unique session identifier for tracking
  const sessionId = 'next_sess_' + nextMeta.id + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  return {
    gameId: nextMeta.id,
    gameName: nextMeta.name,
    domain: nextMeta.domain,
    domainKey: nextMeta.domainKey,
    path: nextMeta.path,
    icon: nextMeta.icon,
    description: nextMeta.description,
    difficulty,
    continuousScore,
    sessionId
  };
}

export const nextActivityService = {
  getNextActivity,
  GAME_METADATA,
  DOMAIN_ROTATION_ORDER
};

export default nextActivityService;
