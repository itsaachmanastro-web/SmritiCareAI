/**
 * GameSelector
 * 
 * Selects and sequences cognitive games adaptively:
 * - 70% targeted reinforcement of weaker/practiced areas
 * - 30% varied exploration across domains
 * - Prevents repeating the exact same game back-to-back
 * - Generates rotating daily cognitive playlists
 */
import { getUserDifficultyProfile, scoreToDiscreteLevel } from './AdaptiveDifficultyEngine.js';

export const GAME_CATALOG = [
  {
    id: 'bihu',
    domainKey: 'memoryMatch',
    titleKey: 'games.bihu.title',
    defaultTitle: 'Bihu Memory Pairs',
    domainName: 'Memory & Recall',
    path: '/patient/games/bihu',
    iconKey: 'jaapi',
    color: 'emerald'
  },
  {
    id: 'mekhela',
    domainKey: 'patternRecognition',
    titleKey: 'games.mekhela.title',
    defaultTitle: 'Mekhela Pattern Match',
    domainName: 'Pattern & Visual Reasoning',
    path: '/patient/games/mekhela',
    iconKey: 'gamosa',
    color: 'amber'
  },
  {
    id: 'teagarden',
    domainKey: 'sequenceMemory',
    titleKey: 'games.teagarden.title',
    defaultTitle: 'Morning at the Tea Garden',
    domainName: 'Executive Function & Routine',
    path: '/patient/games/teagarden',
    iconKey: 'tealeaf',
    color: 'teal'
  },
  {
    id: 'soundshills',
    domainKey: 'auditoryAttention',
    titleKey: 'games.soundshills.title',
    defaultTitle: 'Sounds of the Hills',
    domainName: 'Auditory Attention & Focus',
    path: '/patient/games/soundshills',
    iconKey: 'pepa',
    color: 'orange'
  }
];

let lastSelectedGameId = null;

/**
 * Selects next optimal game based on user performance profile
 */
export async function selectNextGame(userOrProfile, options = {}) {
  let profile;
  if (userOrProfile && typeof userOrProfile === 'object') {
    profile = userOrProfile;
  } else {
    profile = await getUserDifficultyProfile(userOrProfile);
  }

  const lastGame = typeof options === 'string'
    ? options
    : (options.lastGameId || options.lastPlayedGame || lastSelectedGameId);
  const excludeLast = options.excludeLast ?? true;

  // Domain score lookup
  const scores = [
    { id: 'bihu', score: Number(profile?.memoryMatch) || 0.5 },
    { id: 'mekhela', score: Number(profile?.patternRecognition) || 0.5 },
    { id: 'teagarden', score: Number(profile?.sequenceMemory) || 0.5 },
    { id: 'soundshills', score: Number(profile?.auditoryAttention) || 0.5 }
  ];

  // Candidates excluding the last played game if requested
  let candidates = GAME_CATALOG;
  if (excludeLast && lastGame && GAME_CATALOG.length > 1) {
    candidates = GAME_CATALOG.filter((g) => g.id !== lastGame);
  }

  // 70% chance targeted practice (lowest score or balanced practice)
  // 30% chance exploration (random pick from candidates)
  const isTargeted = Math.random() < 0.70;
  let selected = null;

  if (isTargeted) {
    // Sort candidate games by domain score ascending (giving practice to area with lowest difficulty)
    const sorted = [...candidates].sort((a, b) => {
      const scoreA = Number(profile?.[a.domainKey]) || 0.5;
      const scoreB = Number(profile?.[b.domainKey]) || 0.5;
      return scoreA - scoreB;
    });
    selected = sorted[0];
  } else {
    // Random exploration from available candidates
    const idx = Math.floor(Math.random() * candidates.length);
    selected = candidates[idx];
  }

  lastSelectedGameId = selected.id;
  const currentContinuous = Number(profile?.[selected.domainKey]) || 0.5;
  const discreteLevel = scoreToDiscreteLevel(currentContinuous);

  return {
    game: selected,
    gameId: selected.id,
    gameType: selected.id,
    continuousDifficulty: currentContinuous,
    discreteLevel,
    strategy: isTargeted ? 'TARGETED_REINFORCEMENT' : 'EXPLORATION_VARIETY'
  };
}

/**
 * Returns today's featured cognitive challenge for the patient dashboard
 */
export async function getTodaysChallenge(userId) {
  const profile = await getUserDifficultyProfile(userId);

  // Deterministic daily rotation based on day of year + user ID
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now - startOfYear;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const userOffset = Number(userId) || 1;

  const gameIndex = (dayOfYear + userOffset) % GAME_CATALOG.length;
  const featuredGame = GAME_CATALOG[gameIndex];

  const continuous = Number(profile[featuredGame.domainKey]) || 0.5;
  const discrete = scoreToDiscreteLevel(continuous);

  return {
    gameId: featuredGame.id,
    titleKey: featuredGame.titleKey,
    defaultTitle: featuredGame.defaultTitle,
    domainName: featuredGame.domainName,
    path: featuredGame.path,
    iconKey: featuredGame.iconKey,
    color: featuredGame.color,
    continuousDifficulty: continuous,
    discreteLevel: discrete,
    dayOfYear
  };
}
