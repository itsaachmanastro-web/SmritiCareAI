/**
 * Verified Application Capability Registry
 * Prevents AI hallucinations by explicitly defining which features actually exist in SmritiCare.
 */
export const APP_CAPABILITIES = {
  // Core Cognitive Games
  games: {
    available: true,
    supportedGames: [
      {
        id: 'bihu',
        name: 'Bihu Memory Match',
        domain: 'memory',
        route: '/patient/games/bihu',
        description: 'Match pairs of traditional North Eastern cultural symbols like Japi, Dhol, and Kopou Phool.'
      },
      {
        id: 'mekhela',
        name: 'Mekhela Pattern Weaving',
        domain: 'pattern',
        route: '/patient/games/mekhela',
        description: 'Complete the traditional weaving pattern borders by choosing the missing geometric motif.'
      },
      {
        id: 'teagarden',
        name: 'Tea Garden Daily Routine',
        domain: 'routine',
        route: '/patient/games/teagarden',
        description: 'Arrange 4 morning activities in chronological sequence from waking up to morning tea.'
      },
      {
        id: 'soundshills',
        name: 'Sounds of the Hills',
        domain: 'attention',
        route: '/patient/games/soundshills',
        description: 'Listen to regional soundscapes and identify the matching musical instrument or natural sound.'
      }
    ]
  },

  // Reminders & Daily Schedule
  reminders: {
    available: true,
    route: '/patient/reminders',
    canConfirmTasks: true,
    canAddFromCaregiver: true
  },

  // Patient Progress & Cognitive Vitality Index
  progress: {
    available: true,
    route: '/patient/progress',
    showsGoldenStars: true,
    showsDomainBreakdown: true
  },

  // Global Dementia Community
  community: {
    available: true,
    route: '/community',
    features: ['shared experiences', 'caregiver tips', 'empathy reactions', 'safe messaging']
  },

  // Caregiver / PHC Mode
  caregiverDashboard: {
    available: true,
    route: '/caregiver/dashboard',
    features: ['cognitive chart', 'clinical alerts', 'activity log', 'schedule management', 'weekly export']
  },

  // Offline-First Local Persistence
  offlineSync: {
    available: true,
    engine: 'Dexie.js IndexedDB v2',
    backgroundDeltaSync: true,
    supportsOfflineMode: true
  },

  // Voice Assistant
  voiceAssistant: {
    available: true,
    supportedModalities: ['voice', 'text'],
    voiceFirst: true,
    offlineKnowledgeEngine: true
  },

  // Emergency Caregiver Call
  emergencyCall: {
    available: true,
    target: 'Primary Family Caregiver (Priya Borah)',
    quickDial: true
  },

  // Theme & Appearance
  appearance: {
    lightMode: true,
    darkMode: true,
    systemDefault: true
  },

  // What the assistant CANNOT do (Strict Safety Boundaries)
  safetyLimits: {
    canDiagnoseMedicalConditions: false,
    canPrescribeMedication: false,
    canChangeMedicationDosage: false,
    canReplaceDoctor: false,
    canAccessOtherPatientsData: false
  }
};

export function isFeatureSupported(featureKey) {
  return !!APP_CAPABILITIES[featureKey]?.available;
}
