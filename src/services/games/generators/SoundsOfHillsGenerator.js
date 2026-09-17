/**
 * SoundsOfHillsGenerator
 * 
 * Procedural auditory attention and sound identification generator:
 * - Dynamic target selection without hardcoded order
 * - Real cognitive difficulty scaling:
 *   - Easy: 2-3 options (fewer distractors, high contrast sounds)
 *   - Medium: 4 options (standard folk instrument discrimination)
 *   - Hard: Sequential 2-sound recognition or subtle acoustic discrimination
 * - Zero artificial short-timer stress; focuses purely on auditory attention
 */
import { createPRNG, shuffleArray, sampleArray } from '../PRNG.js';
import { computeFingerprint, isUsedInSession } from '../VarietyManager.js';

export const INSTRUMENTS_CATALOG = [
  {
    id: 'pepa',
    name: 'Pepa Horn (Buffalo Horn)',
    assamese: 'পেঁপা',
    prompt: 'Find and tap the Pepa horn!'
  },
  {
    id: 'dhol',
    name: 'Bihu Dhol (Folk Drum)',
    assamese: 'ঢোল',
    prompt: 'Listen to the beat and tap the Dhol drum!'
  },
  {
    id: 'toka',
    name: 'Toka (Bamboo Clapper)',
    assamese: 'টকা',
    prompt: 'Tap the Toka bamboo clapper!'
  },
  {
    id: 'hornbill',
    name: 'Hornbill Bird Call',
    assamese: 'ধনেশ পক্ষী',
    prompt: 'Listen to the bird and tap the Hornbill!'
  }
];

let soundSeedSeq = 0;

/**
 * Generates a single round for Sounds of the Hills
 */
export function generateSoundRound(options = {}) {
  const opts = options || {};
  const continuousDiff = typeof opts.continuousDifficulty === 'number' ? opts.continuousDifficulty : null;
  let difficulty = opts.difficulty || 'medium';
  if (continuousDiff !== null) {
    if (continuousDiff <= 0.38) difficulty = 'easy';
    else if (continuousDiff <= 0.70) difficulty = 'medium';
    else difficulty = 'hard';
  }

  const seed = opts.seed !== undefined ? opts.seed : `${Date.now()}_${Math.random()}_${++soundSeedSeq}`;
  const roundIndex = opts.roundIndex || 0;
  const excludeInstrumentIds = opts.excludeInstrumentIds || [];
  const rng = createPRNG(`${seed}_sound_${roundIndex}`);

  // 1. Filter out recently played instruments in this session if possible
  let eligibleTargets = INSTRUMENTS_CATALOG.filter((i) => !excludeInstrumentIds.includes(i.id));
  if (eligibleTargets.length === 0) {
    eligibleTargets = INSTRUMENTS_CATALOG;
  }

  // 2. Select target instrument
  const target = eligibleTargets[Math.floor(rng() * eligibleTargets.length)];

  // 3. Select distractors based on difficulty: Easy = 2, Medium = 3, Hard = 4
  const optionCount = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;

  const remainingInstruments = INSTRUMENTS_CATALOG.filter((i) => i.id !== target.id);
  const selectedDistractors = sampleArray(remainingInstruments, optionCount - 1, rng);

  // 4. Shuffle options
  const displayOptions = shuffleArray([target, ...selectedDistractors], rng);

  // 5. Fingerprint
  const fingerprint = computeFingerprint('auditoryAttention', `sound_${difficulty}`, {
    targetId: target.id,
    options: displayOptions.map((o) => o.id).sort(),
    roundIndex
  });

  return {
    roundIndex,
    difficulty,
    target,
    displayOptions,
    options: displayOptions,
    sequenceMode: difficulty === 'hard',
    isSequence: difficulty === 'hard',
    fingerprint,
    templateId: `sound_${target.id}`,
    id: `sound_${target.id}_${fingerprint.slice(-8)}`,
    questionId: `sound_${target.id}_${fingerprint.slice(-8)}`
  };
}

/**
 * Generates a full game session of 4 randomized sound rounds
 */
export function generateSoundsOfHillsSession(options = {}) {
  const opts = options || {};
  const continuousDiff = typeof opts.continuousDifficulty === 'number' ? opts.continuousDifficulty : null;
  let difficulty = opts.difficulty || 'medium';
  if (continuousDiff !== null) {
    if (continuousDiff <= 0.38) difficulty = 'easy';
    else if (continuousDiff <= 0.70) difficulty = 'medium';
    else difficulty = 'hard';
  }

  const seed = opts.seed || Date.now();
  const roundsTotal = opts.roundsTotal || 4;
  const rounds = [];
  const usedTargetIds = [];

  for (let r = 0; r < roundsTotal; r++) {
    const round = generateSoundRound({
      ...opts,
      difficulty,
      seed,
      roundIndex: r,
      excludeInstrumentIds: usedTargetIds
    });
    usedTargetIds.push(round.target.id);
    rounds.push(round);
  }

  if (rounds.length > 0) {
    rounds.options = rounds[0].displayOptions;
    rounds.sequenceMode = difficulty === 'hard';
    rounds.difficulty = difficulty;
  }

  return rounds;
}
