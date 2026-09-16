/**
 * MekhelaPatternGenerator
 * 
 * Procedural pattern generation engine for Mekhela Pattern Weaving:
 * - Mathematical pattern grammars: ABAB, AABBAA, ABCABC, ABACAB, ABCDABCD, ABCCBA
 * - Extended traditional North Eastern handloom motifs
 * - Dynamic distractor generation ensuring only 1 correct solution
 * - Seeded randomization and content fingerprinting for zero-repetition sessions
 */
import { createPRNG, shuffleArray, sampleArray } from '../PRNG.js';
import { computeFingerprint, isUsedInSession } from '../VarietyManager.js';

export const PATTERN_RULES = {
  // Easy: Simple alternating motifs
  ABAB: {
    id: 'ABAB',
    name: 'Alternating Pair',
    difficulty: 'easy',
    motifsCount: 2,
    length: 5,
    generateSequence: (motifs) => [motifs[0], motifs[1], motifs[0], motifs[1], null],
    getCorrect: (motifs) => motifs[0]
  },
  AABAAB: {
    id: 'AABAAB',
    name: 'Double First Repeat',
    difficulty: 'easy',
    motifsCount: 2,
    length: 5,
    generateSequence: (motifs) => [motifs[0], motifs[0], motifs[1], motifs[0], motifs[0], null],
    getCorrect: (motifs) => motifs[1]
  },

  // Medium: Triplet & interleaved sequences
  ABCABC: {
    id: 'ABCABC',
    name: 'Triplet Repeat',
    difficulty: 'medium',
    motifsCount: 3,
    length: 6,
    generateSequence: (motifs) => [motifs[0], motifs[1], motifs[2], motifs[0], motifs[1], null],
    getCorrect: (motifs) => motifs[2]
  },
  AABBAA: {
    id: 'AABBAA',
    name: 'Paired Rhythm',
    difficulty: 'medium',
    motifsCount: 2,
    length: 6,
    generateSequence: (motifs) => [motifs[0], motifs[0], motifs[1], motifs[1], motifs[0], null],
    getCorrect: (motifs) => motifs[0]
  },
  ABACAB: {
    id: 'ABACAB',
    name: 'Anchor Interleaved',
    difficulty: 'medium',
    motifsCount: 3,
    length: 6,
    generateSequence: (motifs) => [motifs[0], motifs[1], motifs[0], motifs[2], motifs[0], null],
    getCorrect: (motifs) => motifs[1]
  },

  // Hard: 4-element cycles and palindromic symmetries
  ABCDABCD: {
    id: 'ABCDABCD',
    name: 'Quad Cycle',
    difficulty: 'hard',
    motifsCount: 4,
    length: 7,
    generateSequence: (motifs) => [motifs[0], motifs[1], motifs[2], motifs[3], motifs[0], motifs[1], motifs[2], null],
    getCorrect: (motifs) => motifs[3]
  },
  ABCCBA: {
    id: 'ABCCBA',
    name: 'Mirror Symmetry',
    difficulty: 'hard',
    motifsCount: 3,
    length: 6,
    generateSequence: (motifs) => [motifs[0], motifs[1], motifs[2], motifs[2], motifs[1], null],
    getCorrect: (motifs) => motifs[0]
  },
  ABCBA: {
    id: 'ABCBA',
    name: 'Palindromic Peak',
    difficulty: 'hard',
    motifsCount: 3,
    length: 5,
    generateSequence: (motifs) => [motifs[0], motifs[1], motifs[2], motifs[1], null],
    getCorrect: (motifs) => motifs[0]
  }
};

export const AVAILABLE_MOTIFS = [
  'kingkhap', // Muga Kingkhap (Golden Diamond)
  'kesu',     // Assam Kesu (Red Motif)
  'naga',     // Naga Woven Chevron
  'mizo',     // Mizo Puan Lozenge
  'jaapi_gold',
  'gamusa_red'
];

let patternSeedSeq = 0;

/**
 * Generates a single pattern puzzle round
 */
export function generatePatternRound(options = {}) {
  const opts = options || {};
  const continuousDiff = typeof opts.continuousDifficulty === 'number' ? opts.continuousDifficulty : null;
  let difficulty = opts.difficulty || 'medium';
  if (continuousDiff !== null) {
    if (continuousDiff <= 0.38) difficulty = 'easy';
    else if (continuousDiff <= 0.70) difficulty = 'medium';
    else difficulty = 'hard';
  }

  const seed = opts.seed !== undefined ? opts.seed : `${Date.now()}_${Math.random()}_${++patternSeedSeq}`;
  const roundIndex = opts.roundIndex || 0;
  const rng = createPRNG(`${seed}_rnd_${roundIndex}`);

  // 1. Select eligible rules strictly matching requested difficulty
  let eligibleRules = Object.values(PATTERN_RULES).filter((r) => r.difficulty === difficulty);
  if (eligibleRules.length === 0) {
    eligibleRules = Object.values(PATTERN_RULES);
  }

  let selectedRule = eligibleRules[Math.floor(rng() * eligibleRules.length)];

  // Options count: Easy = 2, Medium = 3, Hard = 4
  const targetOptionCount = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;

  // 2. Sample motifs needed for rule
  let attempts = 0;
  let pattern = [];
  let correct = '';
  let roundOptions = [];
  let fingerprint = '';

  while (attempts < 10) {
    attempts++;
    const sampledMotifs = sampleArray(AVAILABLE_MOTIFS, selectedRule.motifsCount, rng);
    pattern = selectedRule.generateSequence(sampledMotifs);
    correct = selectedRule.getCorrect(sampledMotifs);

    // Build options (correct + distractors)
    const otherMotifs = AVAILABLE_MOTIFS.filter((m) => m !== correct);
    const distractorCount = targetOptionCount - 1;
    const distractors = sampleArray(otherMotifs, distractorCount, rng);
    roundOptions = shuffleArray([correct, ...distractors], rng);

    fingerprint = computeFingerprint('patternRecognition', selectedRule.id, {
      pattern,
      correct,
      rule: selectedRule.id
    });

    if (!isUsedInSession(null, fingerprint)) {
      break;
    }

    // Try next rule
    selectedRule = eligibleRules[Math.floor(rng() * eligibleRules.length)];
  }

  return {
    rule: selectedRule.id,
    ruleId: selectedRule.id,
    ruleName: selectedRule.name,
    difficulty,
    pattern,
    correct,
    options: roundOptions,
    fingerprint,
    templateId: selectedRule.id,
    id: `mekhela_${selectedRule.id}_${fingerprint.slice(-8)}`,
    questionId: `mekhela_${selectedRule.id}_${fingerprint.slice(-8)}`
  };
}

/**
 * Generates a full game session of 4 progressive pattern rounds
 */
export function generateMekhelaGameSession(options = {}) {
  const opts = options || {};
  const roundsTotal = opts.roundsTotal || 4;
  const rounds = [];
  for (let r = 0; r < roundsTotal; r++) {
    rounds.push(generatePatternRound({ ...opts, roundIndex: r }));
  }
  if (rounds.length > 0) {
    rounds.options = rounds[0].options;
    rounds.rule = rounds[0].ruleId;
    rounds.ruleId = rounds[0].ruleId;
    rounds.difficulty = rounds[0].difficulty;
  }
  return rounds;
}
