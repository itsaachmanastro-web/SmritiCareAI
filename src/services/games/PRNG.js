/**
 * Deterministic PRNG & Randomization Utilities
 * Uses Mulberry32 algorithm for seed-based, reproducible, offline puzzle generation.
 */

// Simple string hash to 32-bit integer
export function hashStringToSeed(str) {
  let hash = 1779033703 ^ (str ? str.length : 0);
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) {
    hash = Math.imul(hash ^ s.charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return hash >>> 0;
}

/**
 * Creates a deterministic Mulberry32 PRNG function returning [0, 1)
 */
export function createPRNG(seedInput) {
  let a = typeof seedInput === 'number' ? seedInput >>> 0 : hashStringToSeed(seedInput);
  if (a === 0) a = 123456789;

  return function prng() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates a reproducible session seed from metadata
 */
export function generateSessionSeed(userId = 1, sessionId = 'default', round = 0, extra = '') {
  return `smriti_${userId}_${sessionId}_r${round}_${extra}_${Date.now().toString(36)}`;
}

/**
 * Shuffles array deterministically using provided RNG function (defaults to Math.random)
 * Returns a new shuffled copy; does not mutate source array.
 */
export function shuffleArray(arr, rng = Math.random) {
  if (!Array.isArray(arr) || arr.length <= 1) return [...(arr || [])];
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Samples k distinct elements from array
 */
export function sampleArray(arr, count, rng = Math.random) {
  if (!Array.isArray(arr)) return [];
  if (count >= arr.length) return shuffleArray(arr, rng);
  const shuffled = shuffleArray(arr, rng);
  return shuffled.slice(0, count);
}

/**
 * Generates an integer in range [min, max] inclusive
 */
export function randomInt(min, max, rng = Math.random) {
  const low = Math.ceil(min);
  const high = Math.floor(max);
  return Math.floor(rng() * (high - low + 1)) + low;
}
