/**
 * BihuMemoryGenerator
 * 
 * Procedural card deck generator for Bihu Memory Match:
 * - 18 distinct North Eastern cultural icons across 3 thematic categories
 * - Genuine difficulty progression (cards count, preview duration, similarity)
 * - Seeded shuffle and content fingerprinting to eliminate repetition
 */
import { createPRNG, shuffleArray, sampleArray } from '../PRNG.js';
import { computeFingerprint, isUsedInSession } from '../VarietyManager.js';

// Extended catalog of 18 cultural items with themes
export const CULTURAL_ITEMS_CATALOG = [
  // Theme A: Festival & Music
  { id: 'gamosa', name: 'Gamosa (Woven Towel)', assamese: 'গামোচা', theme: 'festival', difficultyWeight: 1 },
  { id: 'jaapi', name: 'Jaapi (Bamboo Hat)', assamese: 'জাপি', theme: 'festival', difficultyWeight: 1 },
  { id: 'xorai', name: 'Xorai (Offering Tray)', assamese: 'শৰাই', theme: 'festival', difficultyWeight: 1 },
  { id: 'pepa', name: 'Pepa Horn', assamese: 'পেঁপা', theme: 'festival', difficultyWeight: 2 },
  { id: 'dhol', name: 'Bihu Dhol', assamese: 'ঢোল', theme: 'festival', difficultyWeight: 2 },
  { id: 'bamboo', name: 'Bamboo Clapper', assamese: 'বাঁহ নৃত্য', theme: 'festival', difficultyWeight: 2 },

  // Theme B: Wildlife & Nature
  { id: 'rhino', name: 'Kaziranga Rhino', assamese: 'এশিঙীয়া গঁড়', theme: 'nature', difficultyWeight: 1 },
  { id: 'hornbill', name: 'Great Hornbill', assamese: 'ধনেশ পক্ষী', theme: 'nature', difficultyWeight: 1 },
  { id: 'tealeaf', name: 'Assam Tea Leaf', assamese: 'চাহৰ দুটি পাত', theme: 'nature', difficultyWeight: 1 },
  { id: 'bamboo_grove', name: 'Green Bamboo Grove', assamese: 'বাঁহনি বাৰী', theme: 'nature', difficultyWeight: 2 },
  { id: 'kopou_flower', name: 'Kopou Phool (Foxtail Orchid)', assamese: 'কপৌ ফুল', theme: 'nature', difficultyWeight: 2 },
  { id: 'river_stream', name: 'Luit Stream River', assamese: 'লুইত নদী', theme: 'nature', difficultyWeight: 2 },

  // Theme C: Heritage & Handloom Craft
  { id: 'muga_silk', name: 'Golden Muga Silk', assamese: 'মুগা ৰেচম', theme: 'craft', difficultyWeight: 2 },
  { id: 'brass_bell', name: 'Sarthebari Bell Metal', assamese: 'কাঁহৰ বাটি', theme: 'craft', difficultyWeight: 2 },
  { id: 'clay_lamp', name: 'Mati Saaki (Clay Diya)', assamese: 'মাটিৰ চাকি', theme: 'craft', difficultyWeight: 2 },
  { id: 'majuli_mask', name: 'Majuli Mukha (Mask)', assamese: 'মাজুলীৰ মুখা', theme: 'craft', difficultyWeight: 3 },
  { id: 'tamul_paan', name: 'Tamul Paan Plate', assamese: 'তামোল-পান', theme: 'craft', difficultyWeight: 3 },
  { id: 'weave_shuttle', name: 'Maku Weaving Shuttle', assamese: 'মাকো', theme: 'craft', difficultyWeight: 3 }
];

let bihuSeedSeq = 0;

/**
 * Generates an adaptive Bihu Memory Match challenge
 */
export function generateBihuMemoryChallenge(options = {}) {
  const opts = options || {};
  const continuousDiff = typeof opts.continuousDifficulty === 'number' ? opts.continuousDifficulty : null;
  let difficulty = opts.difficulty || 'medium';
  if (continuousDiff !== null) {
    if (continuousDiff <= 0.38) difficulty = 'easy';
    else if (continuousDiff <= 0.70) difficulty = 'medium';
    else difficulty = 'hard';
  }

  const seed = opts.seed !== undefined ? opts.seed : `${Date.now()}_${Math.random()}_${++bihuSeedSeq}`;
  const userId = opts.userId || 1;
  const sessionId = opts.sessionId || 'session';
  const rng = createPRNG(seed);

  // 1. Determine card count & preview duration based on continuous & discrete difficulty
  let pairCount = 4;
  let previewSeconds = 1.5;
  let themeStrategy = 'mixed';
  let isClustered = false;

  if (difficulty === 'easy') {
    pairCount = 3; // 6 cards (simpler, gentle for elderly)
    previewSeconds = 3.5;
    themeStrategy = 'distinct';
  } else if (difficulty === 'hard') {
    pairCount = 6; // 12 cards (harder discrimination)
    previewSeconds = 0.5;
    themeStrategy = 'similar';
    isClustered = true;
  }

  // 2. Select unique items avoiding session duplicates
  let selectedItems = [];
  let attempts = 0;
  let fingerprint = '';

  while (attempts < 10) {
    attempts++;
    if (themeStrategy === 'distinct') {
      // Pick 2 from Festival, 1 from Nature, 1 from Craft
      const fest = sampleArray(CULTURAL_ITEMS_CATALOG.filter((i) => i.theme === 'festival'), 2, rng);
      const nat = sampleArray(CULTURAL_ITEMS_CATALOG.filter((i) => i.theme === 'nature'), 1, rng);
      const crf = sampleArray(CULTURAL_ITEMS_CATALOG.filter((i) => i.theme === 'craft'), 1, rng);
      selectedItems = [...fest, ...nat, ...crf].slice(0, pairCount);
    } else if (themeStrategy === 'similar') {
      // Pick predominantly from one or two themes
      const primaryTheme = rng() > 0.5 ? 'festival' : 'nature';
      const cluster = CULTURAL_ITEMS_CATALOG.filter((i) => i.theme === primaryTheme);
      const other = CULTURAL_ITEMS_CATALOG.filter((i) => i.theme !== primaryTheme);
      selectedItems = sampleArray(cluster, Math.min(cluster.length, 5), rng);
      const remainder = pairCount - selectedItems.length;
      if (remainder > 0) {
        selectedItems.push(...sampleArray(other, remainder, rng));
      }
    } else {
      // Balanced mixed sample
      selectedItems = sampleArray(CULTURAL_ITEMS_CATALOG, pairCount, rng);
    }

    fingerprint = computeFingerprint('memoryMatch', `bihu_${difficulty}`, {
      items: selectedItems.map((i) => i.id).sort(),
      pairCount
    });

    if (!isUsedInSession(null, fingerprint)) {
      break;
    }
  }

  // 3. Build card deck (2 cards per item)
  const deck = [];
  selectedItems.forEach((item) => {
    deck.push({
      uid: `${item.id}-1`,
      iconKey: item.id,
      name: item.name,
      assameseName: item.assamese,
      theme: item.theme
    });
    deck.push({
      uid: `${item.id}-2`,
      iconKey: item.id,
      name: item.name,
      assameseName: item.assamese,
      theme: item.theme
    });
  });

  // 4. Shuffle deck
  const shuffledDeck = shuffleArray(deck, rng);

  return {
    gameType: 'memoryMatch',
    difficulty,
    pairCount,
    totalCards: pairCount * 2,
    previewSeconds,
    previewDurationMs: Math.round(previewSeconds * 1000),
    clusteredThemes: isClustered,
    cards: shuffledDeck,
    selectedItems,
    fingerprint,
    templateId: `bihu_${difficulty}`,
    id: `bihu_${difficulty}_${fingerprint.slice(-8)}`,
    questionId: `bihu_${difficulty}_${fingerprint.slice(-8)}`
  };
}
