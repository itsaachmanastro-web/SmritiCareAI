/**
 * TeaGardenRoutineGenerator
 * 
 * Procedural routine sequence generator for Tea Garden Routine & Executive Planning:
 * - 7 culturally authentic North Eastern daily living scenarios
 * - Real difficulty scaling: Easy (3-4 steps), Medium (4-5 steps), Hard (5-6 steps)
 * - Shuffled cards, chronological validation, and zero-repetition fingerprinting
 */
import { createPRNG, shuffleArray } from '../PRNG.js';
import { computeFingerprint, isUsedInSession } from '../VarietyManager.js';

export const ROUTINE_SCENARIOS = [
  // Scenario 1: Morning at the Tea Garden
  {
    id: 'morning_tea',
    title: 'Morning at the Tea Garden',
    assameseTitle: 'চাহ বাগিচাৰ সুন্দৰ পুৱা',
    description: 'Arrange daily morning steps from sunrise to morning medicine.',
    theme: 'morning',
    allSteps: [
      { step: 1, id: 'wake', title: '1. Wake up with morning sun', assamese: 'পুৱাৰ বেলিৰ লগত সাৰ পোৱা', emoji: '☀️', bgColor: 'bg-amber-100 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700/60' },
      { step: 2, id: 'wash', title: '2. Wash face & brush teeth', assamese: 'মুখ ধোৱা আৰু দাঁত ঘঁহা', emoji: '💧', bgColor: 'bg-sky-100 dark:bg-sky-950/50 border-sky-300 dark:border-sky-700/60' },
      { step: 3, id: 'tea', title: '3. Sip warm Assam Lal Cha', assamese: 'গৰম লাল চাহ খোৱা', emoji: '🍵', bgColor: 'bg-emerald-100 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700/60' },
      { step: 4, id: 'breakfast', title: '4. Enjoy warm breakfast', assamese: 'পুৱাৰ জলপান খোৱা', emoji: '🍲', bgColor: 'bg-orange-100 dark:bg-orange-950/50 border-orange-300 dark:border-orange-700/60' },
      { step: 5, id: 'medicine', title: '5. Take morning medicine', assamese: 'পুৱাৰ ঔষধ নিয়মমতে খোৱা', emoji: '💊', bgColor: 'bg-rose-100 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700/60' },
      { step: 6, id: 'walk', title: '6. Gentle garden stroll', assamese: 'বাগানত খোজ কঢ়া', emoji: '🌿', bgColor: 'bg-teal-100 dark:bg-teal-950/50 border-teal-300 dark:border-teal-700/60' }
    ]
  },

  // Scenario 2: Evening Prayer at the Namghar
  {
    id: 'evening_namghar',
    title: 'Evening Prayer at the Namghar',
    assameseTitle: 'নামঘৰৰ সন্ধিয়া প্ৰাৰ্থনা',
    description: 'Arrange traditional steps for evening prayer and lighting the brass lamp.',
    theme: 'spiritual',
    allSteps: [
      { step: 1, id: 'bathe', title: '1. Wash hands & feet clean', assamese: 'হাত-ভৰি ধুই পৰিষ্কাৰ হোৱা', emoji: '🚰', bgColor: 'bg-sky-100 dark:bg-sky-950/50 border-sky-300 dark:border-sky-700/60' },
      { step: 2, id: 'clean_clothes', title: '2. Wear clean cotton clothes', assamese: 'শুচিতাৰে ধোৱা কাপোৰ পিন্ধা', emoji: '👕', bgColor: 'bg-teal-100 dark:bg-teal-950/50 border-teal-300 dark:border-teal-700/60' },
      { step: 3, id: 'light_diya', title: '3. Light brass oil lamp (Saaki)', assamese: 'তেলৰ চাকি আৰু ধূপ জ্বলোৱা', emoji: '🪔', bgColor: 'bg-amber-100 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700/60' },
      { step: 4, id: 'chant_prayer', title: '4. Sing Naam & gentle prayer', assamese: 'নাম-কীৰ্তন আৰু প্ৰাৰ্থনা কৰা', emoji: '🙏', bgColor: 'bg-emerald-100 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700/60' },
      { step: 5, id: 'prasad', title: '5. Distribute Mah-Prasad', assamese: 'মাহ-প্ৰসাদ গ্ৰহণ কৰা', emoji: '🥣', bgColor: 'bg-orange-100 dark:bg-orange-950/50 border-orange-300 dark:border-orange-700/60' }
    ]
  },

  // Scenario 3: Assam Bihu Pitha Preparation
  {
    id: 'bihu_pitha',
    title: 'Making Traditional Til Pitha',
    assameseTitle: 'তিল পিঠা প্ৰস্তুত কৰা',
    description: 'Arrange the culinary steps for rolling warm winter Til Pithas.',
    theme: 'cultural',
    allSteps: [
      { step: 1, id: 'soak_rice', title: '1. Soak Bora sticky rice', assamese: 'বৰা চাউল পানীত তিয়াই থোৱা', emoji: '🌾', bgColor: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700' },
      { step: 2, id: 'grind_flour', title: '2. Pound into fine rice flour', assamese: 'ঢেঁকীত বা মিক্সিত গুড়ি কৰা', emoji: '🥣', bgColor: 'bg-amber-100 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700/60' },
      { step: 3, id: 'roast_sesame', title: '3. Roast black sesame with jaggery', assamese: 'তিল আৰু গুড়ৰ ভাজি মিশ্ৰণ কৰা', emoji: '🍯', bgColor: 'bg-orange-100 dark:bg-orange-950/50 border-orange-300 dark:border-orange-700/60' },
      { step: 4, id: 'spread_tawa', title: '4. Spread flour thin on hot pan', assamese: 'গৰম তাৱাত গুড়ি মেলি দিয়া', emoji: '🍳', bgColor: 'bg-rose-100 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700/60' },
      { step: 5, id: 'roll_pitha', title: '5. Fill with sesame & roll gently', assamese: 'মাজত তিল দি সাৱধানে পাক কৰা', emoji: '🥢', bgColor: 'bg-emerald-100 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700/60' }
    ]
  },

  // Scenario 4: Majuli Organic Tea Plucking
  {
    id: 'tea_harvest',
    title: 'Harvesting Fresh Tea Leaves',
    assameseTitle: 'চাহৰ দুটি পাত সংগ্ৰহ কৰা',
    description: 'Sequence the steps of harvesting two leaves and a bud on the tea garden estate.',
    theme: 'garden',
    allSteps: [
      { step: 1, id: 'strap_basket', title: '1. Fasten woven bamboo basket', assamese: 'পিঠিত বাঁহৰ পাচি বন্ধা', emoji: '🧺', bgColor: 'bg-amber-100 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700/60' },
      { step: 2, id: 'walk_bushes', title: '2. Walk through morning tea rows', assamese: 'চাহ গছৰ মাজত প্ৰৱেশ কৰা', emoji: '🌱', bgColor: 'bg-emerald-100 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700/60' },
      { step: 3, id: 'pluck_bud', title: '3. Pluck two leaves and tender bud', assamese: 'দুটি পাত আৰু এটা কলি ছিঙা', emoji: '🍃', bgColor: 'bg-teal-100 dark:bg-teal-950/50 border-teal-300 dark:border-teal-700/60' },
      { step: 4, id: 'weigh_leaves', title: '4. Weigh the fresh green harvest', assamese: 'সংগ্ৰহ কৰা চাহপাত জোখা', emoji: '⚖️', bgColor: 'bg-sky-100 dark:bg-sky-950/50 border-sky-300 dark:border-sky-700/60' },
      { step: 5, id: 'withering', title: '5. Spread on bamboo mat for drying', assamese: 'বতাহত শুকাবলৈ মেলা', emoji: '🌤️', bgColor: 'bg-orange-100 dark:bg-orange-950/50 border-orange-300 dark:border-orange-700/60' }
    ]
  },

  // Scenario 5: Village Morning Bazaar Visit
  {
    id: 'village_market',
    title: 'Visit to the Village Bazaar',
    assameseTitle: 'পুৱাৰ গঞা বজাৰলৈ যাত্ৰা',
    description: 'Arrange daily shopping routine from carrying the cloth bag to returning home.',
    theme: 'market',
    allSteps: [
      { step: 1, id: 'cloth_bag', title: '1. Take cloth shopping bag', assamese: 'হাতত কাপোৰৰ মোনা লোৱা', emoji: '🛍️', bgColor: 'bg-amber-100 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700/60' },
      { step: 2, id: 'walk_market', title: '2. Walk along the village road', assamese: 'গাঁৱৰ আলিবাটেৰে বজাৰলৈ যোৱা', emoji: '🚶', bgColor: 'bg-teal-100 dark:bg-teal-950/50 border-teal-300 dark:border-teal-700/60' },
      { step: 3, id: 'select_greens', title: '3. Choose fresh Brahmi greens', assamese: 'সতেজ শাক-পাচলি বাছি লোৱা', emoji: '🥬', bgColor: 'bg-emerald-100 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700/60' },
      { step: 4, id: 'pay_vendor', title: '4. Pay the local vegetable vendor', assamese: 'বজাৰৰ বেপাৰীক ধন দিয়া', emoji: '🪙', bgColor: 'bg-orange-100 dark:bg-orange-950/50 border-orange-300 dark:border-orange-700/60' },
      { step: 5, id: 'return_home', title: '5. Return home before midday heat', assamese: 'ৰ’দ উঠাৰ আগেয়ে ঘৰলৈ ওভতা', emoji: '🏡', bgColor: 'bg-sky-100 dark:bg-sky-950/50 border-sky-300 dark:border-sky-700/60' }
    ]
  },

  // Scenario 6: Traditional Handloom Silk Loom Setup
  {
    id: 'handloom_weave',
    title: 'Setting Up the Traditional Silk Loom',
    assameseTitle: 'তাঁতশাল সজোৱা পৰ্ব',
    description: 'Sequence the traditional handloom preparation steps on the wooden loom.',
    theme: 'craft',
    allSteps: [
      { step: 1, id: 'sort_yarn', title: '1. Sort natural Eri silk yarn', assamese: 'এৰী ৰেচমৰ সূতা বাছি লোৱা', emoji: '🧶', bgColor: 'bg-amber-100 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700/60' },
      { step: 2, id: 'thread_warp', title: '2. Thread the loom warp (Digh)', assamese: 'তাঁতশালৰ দীঘৰ সূতা সজোৱা', emoji: '🧵', bgColor: 'bg-sky-100 dark:bg-sky-950/50 border-sky-300 dark:border-sky-700/60' },
      { step: 3, id: 'insert_shuttle', title: '3. Wind thread onto wooden shuttle', assamese: 'মাকোত বানী সূতা ভৰোৱা', emoji: '🪵', bgColor: 'bg-emerald-100 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700/60' },
      { step: 4, id: 'press_pedal', title: '4. Press the wooden foot pedal', assamese: 'ভৰিৰে নচনী শাল চলোৱা', emoji: '🦶', bgColor: 'bg-orange-100 dark:bg-orange-950/50 border-orange-300 dark:border-orange-700/60' },
      { step: 5, id: 'inspect_cloth', title: '5. Admire the woven red border', assamese: 'বোৱা ৰঙা পাৰিটো পৰীক্ষা কৰা', emoji: '🧣', bgColor: 'bg-rose-100 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700/60' }
    ]
  },

  // Scenario 7: Peaceful Evening Wind Down
  {
    id: 'restful_evening',
    title: 'Peaceful Evening Wind Down',
    assameseTitle: 'শান্তিপূৰ্ণ সন্ধিয়াৰ বিশ্ৰাম',
    description: 'Sequence calm night steps for restorative sleep and cognitive health.',
    theme: 'night',
    allSteps: [
      { step: 1, id: 'sunset_walk', title: '1. Enjoy cool evening breeze', assamese: 'সন্ধিয়াৰ জুৰ বতাহ উপভোগ কৰা', emoji: '🌅', bgColor: 'bg-amber-100 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700/60' },
      { step: 2, id: 'warm_dinner', title: '2. Eat a warm, light dinner', assamese: 'পাতলীয়া নৈশ আহাৰ গ্ৰহণ কৰা', emoji: '🥣', bgColor: 'bg-orange-100 dark:bg-orange-950/50 border-orange-300 dark:border-orange-700/60' },
      { step: 3, id: 'night_meds', title: '3. Take evening prescribed tablet', assamese: 'ৰাতিৰ ঔষধ পানীত নিয়মমতে খোৱা', emoji: '💊', bgColor: 'bg-rose-100 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700/60' },
      { step: 4, id: 'listen_story', title: '4. Listen to peaceful folk melody', assamese: 'শান্তিপূৰ্ণ সংগীত বা গীত শুনা', emoji: '📻', bgColor: 'bg-teal-100 dark:bg-teal-950/50 border-teal-300 dark:border-teal-700/60' },
      { step: 5, id: 'deep_sleep', title: '5. Restful sleep on comfortable bed', assamese: 'শান্তিপূৰ্ণ টোপনিত শয়ন কৰা', emoji: '🌙', bgColor: 'bg-indigo-100 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700/60' }
    ]
  }
];

let routineSeedSeq = 0;

/**
 * Generates an adaptive routine sequence challenge
 */
export function generateRoutineChallenge(options = {}) {
  const opts = options || {};
  const continuousDiff = typeof opts.continuousDifficulty === 'number' ? opts.continuousDifficulty : null;
  let difficulty = opts.difficulty || 'medium';
  if (continuousDiff !== null) {
    if (continuousDiff <= 0.38) difficulty = 'easy';
    else if (continuousDiff <= 0.70) difficulty = 'medium';
    else difficulty = 'hard';
  }

  const seed = opts.seed !== undefined ? opts.seed : `${Date.now()}_${Math.random()}_${++routineSeedSeq}`;
  const userId = opts.userId || 1;
  const rng = createPRNG(seed);

  // 1. Determine step count based on difficulty
  let stepCount = 5;
  if (difficulty === 'easy') {
    stepCount = 4;
  } else if (difficulty === 'hard') {
    stepCount = 6;
  }

  // 2. Select eligible scenario (avoiding session duplicates)
  let eligibleScenarios = ROUTINE_SCENARIOS.filter((s) => s.allSteps.length >= stepCount);
  if (eligibleScenarios.length === 0) {
    eligibleScenarios = ROUTINE_SCENARIOS;
  }

  let selectedScenario = eligibleScenarios[Math.floor(rng() * eligibleScenarios.length)];
  let attempts = 0;
  let fingerprint = '';

  while (attempts < 10) {
    attempts++;
    fingerprint = computeFingerprint('sequenceMemory', selectedScenario.id, {
      scenarioId: selectedScenario.id,
      difficulty,
      stepCount
    });

    if (!isUsedInSession(null, fingerprint)) {
      break;
    }
    // Try next scenario
    selectedScenario = eligibleScenarios[Math.floor(rng() * eligibleScenarios.length)];
  }

  // 3. Slice the correct sequential steps
  const targetSteps = selectedScenario.allSteps.slice(0, Math.min(stepCount, selectedScenario.allSteps.length));

  // 4. Shuffle available cards for user interaction
  const shuffledCards = shuffleArray(targetSteps, rng);

  return {
    gameType: 'sequenceMemory',
    difficulty,
    stepCount: targetSteps.length,
    scenario: {
      id: selectedScenario.id,
      title: selectedScenario.title,
      assameseTitle: selectedScenario.assameseTitle,
      description: selectedScenario.description
    },
    correctSteps: targetSteps,
    steps: targetSteps,
    shuffledCards,
    fingerprint,
    templateId: selectedScenario.id,
    id: `routine_${selectedScenario.id}_${fingerprint.slice(-8)}`,
    questionId: `routine_${selectedScenario.id}_${fingerprint.slice(-8)}`
  };
}
