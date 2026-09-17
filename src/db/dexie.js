import Dexie from 'dexie';
import { getAppMode, isProductionMode } from '../config/appMode.js';

export const db = new Dexie('SmritiCareDB');

// Version 1 (Legacy schema for upgrade continuity)
db.version(1).stores({
  users: '++id, role, name',
  gameSessions: '++id, userId, gameName, completedAt, difficultyLevel',
  cognitiveScores: '++id, userId, date, domain',
  reminders: '++id, userId, time, done, type',
  syncQueue: '++id, tableName, recordId, synced, timestamp'
});

// Version 2 (Full Normalized Production Schema)
db.version(2).stores({
  users: '++id, email, role, name, createdAt, updatedAt',
  sessions: '++id, userId, token, expiresAt, createdAt',
  patientProfiles: '++id, userId, name, age, location, createdAt, updatedAt',
  gameSessions: '++id, userId, patientId, gameName, gameType, score, difficultyLevel, completedAt, createdAt',
  cognitiveScores: '++id, userId, patientId, date, domain, category, score, timestamp, createdAt',
  reminders: '++id, userId, patientId, title, time, dueAt, done, completed, type, createdAt, updatedAt',
  healthRecords: '++id, userId, patientId, type, title, date, createdAt',
  conversations: '++id, userId, role, timestamp, createdAt',
  syncQueue: '++id, entityType, entityId, operation, status, createdAt, retryCount, lastAttemptAt'
}).upgrade(async (tx) => {
  // Seamless migration: add missing timestamp & status fields
  try {
    const existingUsers = await tx.table('users').toArray();
    for (const u of existingUsers) {
      await tx.table('users').update(u.id, {
        createdAt: u.createdAt || new Date().toISOString(),
        updatedAt: u.updatedAt || new Date().toISOString()
      });
    }

    const existingSync = await tx.table('syncQueue').toArray();
    for (const s of existingSync) {
      await tx.table('syncQueue').update(s.id, {
        entityType: s.entityType || s.tableName || 'unknown',
        entityId: s.entityId || s.recordId || 0,
        operation: s.operation || s.action || 'INSERT',
        status: s.synced ? 'synced' : 'pending',
        createdAt: s.timestamp || new Date().toISOString(),
        retryCount: 0
      });
    }
  } catch (err) {
    console.warn('Dexie v2 migration notice:', err);
  }
});

// Version 3 (Strict Multi-User Isolation, Q-Scheduling, Verified Telemetry)
db.version(3).stores({
  users: '++id, email, role, name, isDemo, isVerified, status, createdAt, updatedAt, lastLoginAt',
  sessions: '++id, userId, token, expiresAt, createdAt',
  patientProfiles: '++id, userId, isDemo, name, age, location, createdAt, updatedAt',
  gameSessions: '++id, userId, patientId, isDemo, gameName, gameType, score, difficultyLevel, completedAt, createdAt',
  cognitiveScores: '++id, userId, patientId, isDemo, date, domain, category, score, timestamp, createdAt',
  reminders: '++id, userId, patientId, isDemo, targetUserId, createdBy, scheduledAt, status, title, time, dueAt, done, completed, type, createdAt, updatedAt',
  healthRecords: '++id, userId, patientId, isDemo, type, title, date, createdAt',
  conversations: '++id, userId, isDemo, role, timestamp, createdAt',
  syncQueue: '++id, userId, patientId, isDemo, entityType, entityId, operation, status, createdAt, retryCount, lastAttemptAt'
}).upgrade(async (tx) => {
  try {
    const demoEmails = ['amma@smriticare.org', 'priya@smriticare.org', 'phukan@health.assam.gov.in'];
    const existingUsers = await tx.table('users').toArray();
    for (const u of existingUsers) {
      const isDemo = demoEmails.includes(u.email) || u.id <= 3 || u.isDemo === true;
      await tx.table('users').update(u.id, {
        isDemo: !!isDemo,
        isVerified: !isDemo,
        status: isDemo ? 'demo' : (u.status || 'active'),
        lastLoginAt: u.lastLoginAt || (isDemo ? null : u.updatedAt || u.createdAt || new Date().toISOString())
      });
    }

    const tablesWithDemo = ['patientProfiles', 'gameSessions', 'cognitiveScores', 'reminders', 'healthRecords', 'conversations', 'syncQueue'];
    for (const tbl of tablesWithDemo) {
      try {
        const rows = await tx.table(tbl).toArray();
        for (const r of rows) {
          const isDemoRecord = (r.userId && r.userId <= 3) || (r.patientId && r.patientId <= 3) || r.isDemo === true;
          const updates = { isDemo: !!isDemoRecord };
          if (tbl === 'reminders') {
            updates.targetUserId = r.targetUserId || r.patientId || r.userId || 1;
            updates.createdBy = r.createdBy || (r.userId === 2 ? 'Priya Borah' : 'system');
            updates.scheduledAt = r.scheduledAt || r.dueAt || r.time || new Date().toISOString();
            updates.status = r.status || (r.completed || r.done ? 'completed' : 'pending');
          }
          await tx.table(tbl).update(r.id, updates);
        }
      } catch (err) {
        console.warn(`Dexie v3 upgrade table ${tbl} warning:`, err);
      }
    }
  } catch (err) {
    console.warn('Dexie v3 migration notice:', err);
  }
});

// Version 4 (Adaptive AI Cognitive Difficulty Engine & Question Fingerprints)
db.version(4).stores({
  users: '++id, email, role, name, isDemo, isVerified, status, createdAt, updatedAt, lastLoginAt',
  sessions: '++id, userId, token, expiresAt, createdAt',
  patientProfiles: '++id, userId, isDemo, name, age, location, createdAt, updatedAt',
  gameSessions: '++id, userId, patientId, isDemo, gameName, gameType, score, difficultyLevel, completedAt, createdAt',
  cognitiveScores: '++id, userId, patientId, isDemo, date, domain, category, score, timestamp, createdAt',
  reminders: '++id, userId, patientId, isDemo, targetUserId, createdBy, scheduledAt, status, title, time, dueAt, done, completed, type, createdAt, updatedAt',
  healthRecords: '++id, userId, patientId, isDemo, type, title, date, createdAt',
  conversations: '++id, userId, isDemo, role, timestamp, createdAt',
  syncQueue: '++id, userId, patientId, isDemo, entityType, entityId, operation, status, createdAt, retryCount, lastAttemptAt',
  adaptiveProfiles: 'userId, overallDifficulty, memoryMatch, sequenceMemory, patternRecognition, auditoryAttention, updatedAt',
  gameChallenges: '++id, [userId+gameType], userId, sessionId, gameType, difficulty, questionId, contentHash, correct, responseTimeMs, score, completedAt',
  usedQuestionFingerprints: '++id, userId, contentHash, gameType, templateId, usedAt'
}).upgrade(async (tx) => {
  try {
    const existingUsers = await tx.table('users').toArray();
    for (const u of existingUsers) {
      if (u.id) {
        await tx.table('adaptiveProfiles').put({
          userId: u.id,
          overallDifficulty: 0.50,
          memoryMatch: 0.50,
          sequenceMemory: 0.45,
          patternRecognition: 0.50,
          auditoryAttention: 0.45,
          updatedAt: new Date().toISOString()
        });
      }
    }
  } catch (err) {
    console.warn('Dexie v4 upgrade notice:', err);
  }
});

// Initial curated subscription plans
export const INITIAL_SUBSCRIPTION_PLANS = [
  {
    id: 'plan_free',
    code: 'FREE',
    name: 'Free / Basic',
    priceMonthly: 0,
    priceYearly: 0,
    dailyCreditLimit: 200,
    monthlyCreditAllowance: 0,
    features: ['basic_games', 'basic_reminders', 'basic_ai'],
    description: 'Essential cognitive care and daily memory exercises for elders and families.',
    isActive: true
  },
  {
    id: 'plan_classic',
    code: 'CLASSIC',
    name: 'Classic',
    priceMonthly: 249,
    priceYearly: 2499,
    dailyCreditLimit: 350,
    monthlyCreditAllowance: 250,
    features: ['basic_games', 'basic_reminders', 'enhanced_ai', 'all_cultural_games', 'personalized_prompts'],
    description: 'Extended cognitive activities, enhanced memory games, and monthly reward bonus.',
    isActive: true
  },
  {
    id: 'plan_standard',
    code: 'STANDARD',
    name: 'Standard',
    priceMonthly: 499,
    priceYearly: 4999,
    dailyCreditLimit: 500,
    monthlyCreditAllowance: 600,
    features: ['basic_games', 'basic_reminders', 'enhanced_ai', 'all_cultural_games', 'personalized_prompts', 'caregiver_tools', 'higher_credit_limits', 'exportable_reports'],
    description: 'Comprehensive family care with advanced caregiver telemetry, reports, and higher rewards.',
    isActive: true
  },
  {
    id: 'plan_premium',
    code: 'PREMIUM',
    name: 'Premium',
    priceMonthly: 899,
    priceYearly: 8999,
    dailyCreditLimit: 800,
    monthlyCreditAllowance: 1200,
    features: ['basic_games', 'basic_reminders', 'enhanced_ai', 'all_cultural_games', 'personalized_prompts', 'caregiver_tools', 'higher_credit_limits', 'exportable_reports', 'voice_ai', 'priority_support', 'premium_rewards'],
    description: 'Full SmritiCare experience: voice AI interaction, priority care tools, and maximum reward allowances.',
    isActive: true
  }
];

// Initial curated rewards catalog
export const INITIAL_REWARDS = [
  {
    id: 'rew_tea_pack',
    title: 'Majuli Organic Chamomile & Brahmi Herbal Tea Pack',
    description: 'Calming certified herbal infusion harvested from organic tea gardens in Assam. Formulated for evening cognitive tranquility and restful sleep.',
    category: 'Wellness',
    creditCost: 600,
    inventory: 45,
    isDigital: false,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'rew_guided_audio',
    title: 'Sounds of the Hills: Binaural Nature Meditation Audio',
    description: 'High-fidelity acoustic audio tracks recorded in Shillong and Kaziranga. Features soothing gentle rain, birdsong, and traditional bamboo flute tones.',
    category: 'Wellness',
    creditCost: 350,
    inventory: 9999,
    isDigital: true,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'rew_folk_tales_book',
    title: 'Tales of the Brahmaputra: Illustrated Assamese Folk Legends',
    description: 'Elder-friendly large-print collection of traditional heritage stories and folk memories from across the 8 sister states with colorful illustrations.',
    category: 'Books',
    creditCost: 500,
    inventory: 30,
    isDigital: false,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'rew_memory_handbook',
    title: 'Gentle Brain Fitness Handbook (Digital PDF)',
    description: 'Caregiver-patient collaborative handbook featuring 40 simple daily cognitive exercises and memory preservation techniques in English & Assamese.',
    category: 'Books',
    creditCost: 450,
    inventory: 9999,
    isDigital: true,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'rew_photo_journal',
    title: 'Custom Memory Photo Journal & Hardcover Binder',
    description: 'Tactile, textured memory keepsake binder with plastic sleeves designed for easy holding by elders to preserve family portraits and ancestral memories.',
    category: 'Memory & Learning',
    creditCost: 700,
    inventory: 25,
    isDigital: false,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'rew_wooden_puzzle',
    title: 'Handcrafted Rhinoceros & Tea Valley Wooden Tangram Puzzle',
    description: 'Tactile wooden puzzle handcrafted by local artisans in Jorhat with non-toxic colors. Develops fine motor coordination and spatial reasoning.',
    category: 'Memory & Learning',
    creditCost: 850,
    inventory: 20,
    isDigital: false,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'rew_ne_music_bundle',
    title: 'North East Folk Harmony Digital Music Album',
    description: 'Curated 18-track digital collection of vintage Bihu songs, Borgeet hymns, and soothing Rabha melodies that evoke nostalgia and positive mood elevation.',
    category: 'Digital Rewards',
    creditCost: 400,
    inventory: 9999,
    isDigital: true,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'rew_family_album_template',
    title: 'Digital Family Memory Album Canva Template',
    description: 'Pre-formatted digital template for family members to compile grandparent heritage photos into printable memory books.',
    category: 'Digital Rewards',
    creditCost: 300,
    inventory: 9999,
    isDigital: true,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'rew_respite_guide',
    title: 'Caregiver Respite & Compassion Wellness Guide',
    description: 'Expert-backed guide on managing caregiver fatigue, emotional burn-out, and coordinating community respite care in rural settings.',
    category: 'Caregiver Resources',
    creditCost: 400,
    inventory: 9999,
    isDigital: true,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'rew_specialist_consult',
    title: 'Tele-Health Dementia Specialist 1-on-1 Guidance Voucher',
    description: '30-minute tele-consultation voucher with a verified dementia geriatric counselor covering personalized home routine planning.',
    category: 'Caregiver Resources',
    creditCost: 1200,
    inventory: 15,
    isDigital: true,
    requiresCaregiverApproval: true,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'rew_silk_mask',
    title: 'Handwoven Assam Ahimsa Eri Silk Sleep Mask',
    description: 'Hypoallergenic, natural thermo-regulating Eri peace silk mask handmade by Assam weavers for deep non-disruptive nocturnal sleep.',
    category: 'Lifestyle',
    creditCost: 750,
    inventory: 35,
    isDigital: false,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'rew_water_bottle',
    title: 'Easy-Grip Insulated Hydration Bottle with Time Markers',
    description: 'Ergonomically contoured lightweight copper-insulated water bottle with large font time reminders to prevent dehydration in elders.',
    category: 'Lifestyle',
    creditCost: 550,
    inventory: 40,
    isDigital: false,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'rew_premium_pass',
    title: 'SmritiCare 1-Month Premium Subscription Pass',
    description: 'Unlocks full SmritiCare Premium access including voice AI assistance, all cognitive games, and priority caregiver alert tools for 30 days.',
    category: 'SmritiCare Premium Benefits',
    creditCost: 1500,
    inventory: 9999,
    isDigital: true,
    requiresCaregiverApproval: true,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'rew_heritage_game_pack',
    title: 'Exclusive Heritage Memory Game Level Pack',
    description: 'Unlocks 12 extra nostalgic heritage stages in Bihu Memory and Mekhela Pattern Weaver with authentic historical audio recordings.',
    category: 'SmritiCare Premium Benefits',
    creditCost: 800,
    inventory: 9999,
    isDigital: true,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=400'
  }
];

// Version 4 (Business Economy, Credits, Subscriptions, Reward Marketplace)
db.version(4).stores({
  users: '++id, email, role, name, isDemo, isVerified, status, createdAt, updatedAt, lastLoginAt',
  sessions: '++id, userId, token, expiresAt, createdAt',
  patientProfiles: '++id, userId, isDemo, name, age, location, createdAt, updatedAt',
  gameSessions: '++id, userId, patientId, isDemo, gameName, gameType, score, difficultyLevel, completedAt, createdAt',
  cognitiveScores: '++id, userId, patientId, isDemo, date, domain, category, score, timestamp, createdAt',
  reminders: '++id, userId, patientId, isDemo, targetUserId, createdBy, scheduledAt, status, title, time, dueAt, done, completed, type, createdAt, updatedAt',
  healthRecords: '++id, userId, patientId, isDemo, type, title, date, createdAt',
  conversations: '++id, userId, isDemo, role, timestamp, createdAt',
  syncQueue: '++id, userId, patientId, isDemo, entityType, entityId, operation, status, createdAt, retryCount, lastAttemptAt',
  // New Business Economy Stores:
  creditBalances: 'userId, balance, lifetimeEarned, lifetimeSpent, lastUpdated',
  creditTransactions: '++id, userId, type, amount, reason, source, timestamp, status, balanceAfter',
  subscriptionPlans: 'id, code, name, priceMonthly, priceYearly, features, dailyCreditLimit, monthlyCreditAllowance, isActive',
  userSubscriptions: '++id, userId, planCode, status, startDate, renewalDate, endDate, autoRenew',
  rewards: 'id, title, description, category, creditCost, inventory, isDigital, status, image',
  rewardRedemptions: '++id, userId, rewardId, rewardTitle, creditCost, status, isDigital, digitalCode, requiresCaregiverApproval, caregiverApproved, redeemedAt',
  dailyActivityTracker: '++id, [userId+date], userId, date, creditsEarnedToday, completedActivities',
  userSettings: '++id, userId, requireCaregiverApproval'
}).upgrade(async (tx) => {
  try {
    // Seed initial subscription plans
    const plansCount = await tx.table('subscriptionPlans').count();
    if (plansCount === 0) {
      await tx.table('subscriptionPlans').bulkAdd(INITIAL_SUBSCRIPTION_PLANS);
    }

    // Seed initial rewards catalog
    const rewardsCount = await tx.table('rewards').count();
    if (rewardsCount === 0) {
      await tx.table('rewards').bulkAdd(INITIAL_REWARDS);
    }
  } catch (err) {
    console.warn('Dexie v4 migration notice:', err);
  }
});

// Version 5 (Centralized Notification Center & Multi-User Alert Pipeline)
db.version(5).stores({
  users: '++id, email, role, name, isDemo, isVerified, status, createdAt, updatedAt, lastLoginAt',
  sessions: '++id, userId, token, expiresAt, createdAt',
  patientProfiles: '++id, userId, isDemo, name, age, location, createdAt, updatedAt',
  gameSessions: '++id, userId, patientId, isDemo, gameName, gameType, score, difficultyLevel, completedAt, createdAt',
  cognitiveScores: '++id, userId, patientId, isDemo, date, domain, category, score, timestamp, createdAt',
  reminders: '++id, userId, patientId, isDemo, targetUserId, createdBy, scheduledAt, status, title, time, dueAt, done, completed, type, createdAt, updatedAt',
  healthRecords: '++id, userId, patientId, isDemo, type, title, date, createdAt',
  conversations: '++id, userId, isDemo, role, timestamp, createdAt',
  syncQueue: '++id, userId, patientId, isDemo, entityType, entityId, operation, status, createdAt, retryCount, lastAttemptAt',
  creditBalances: 'userId, balance, lifetimeEarned, lifetimeSpent, lastUpdated',
  creditTransactions: '++id, userId, type, amount, reason, source, timestamp, status, balanceAfter',
  subscriptionPlans: 'id, code, name, priceMonthly, priceYearly, features, dailyCreditLimit, monthlyCreditAllowance, isActive',
  userSubscriptions: '++id, userId, planCode, status, startDate, renewalDate, endDate, autoRenew',
  rewards: 'id, title, description, category, creditCost, inventory, isDigital, status, image',
  rewardRedemptions: '++id, userId, rewardId, rewardTitle, creditCost, status, isDigital, digitalCode, requiresCaregiverApproval, caregiverApproved, redeemedAt',
  dailyActivityTracker: '++id, [userId+date], userId, date, creditsEarnedToday, completedActivities',
  userSettings: '++id, userId, requireCaregiverApproval',
  // Centralized Notifications Store (Strict Multi-User Isolation & fast indexed queries)
  notifications: '++id, userId, type, priority, isRead, isDismissed, scheduledAt, createdAt, [userId+isRead], [userId+type], idempotencyKey'
}).upgrade(async (tx) => {
  console.log('Dexie v5: notifications table ready.');
});

// Version 6 (True Adaptive Cognitive Game Engine & Procedural Repetition Prevention)
db.version(6).stores({
  users: '++id, email, role, name, isDemo, isVerified, status, createdAt, updatedAt, lastLoginAt',
  sessions: '++id, userId, token, expiresAt, createdAt',
  patientProfiles: '++id, userId, isDemo, name, age, location, createdAt, updatedAt',
  gameSessions: '++id, userId, patientId, isDemo, gameName, gameType, score, difficultyLevel, completedAt, createdAt',
  cognitiveScores: '++id, userId, patientId, isDemo, date, domain, category, score, timestamp, createdAt',
  reminders: '++id, userId, patientId, isDemo, targetUserId, createdBy, scheduledAt, status, title, time, dueAt, done, completed, type, createdAt, updatedAt',
  healthRecords: '++id, userId, patientId, isDemo, type, title, date, createdAt',
  conversations: '++id, userId, isDemo, role, timestamp, createdAt',
  syncQueue: '++id, userId, patientId, isDemo, entityType, entityId, operation, status, createdAt, retryCount, lastAttemptAt',
  creditBalances: 'userId, balance, lifetimeEarned, lifetimeSpent, lastUpdated',
  creditTransactions: '++id, userId, type, amount, reason, source, timestamp, status, balanceAfter',
  subscriptionPlans: 'id, code, name, priceMonthly, priceYearly, features, dailyCreditLimit, monthlyCreditAllowance, isActive',
  userSubscriptions: '++id, userId, planCode, status, startDate, renewalDate, endDate, autoRenew',
  rewards: 'id, title, description, category, creditCost, inventory, isDigital, status, image',
  rewardRedemptions: '++id, userId, rewardId, rewardTitle, creditCost, status, isDigital, digitalCode, requiresCaregiverApproval, caregiverApproved, redeemedAt',
  dailyActivityTracker: '++id, [userId+date], userId, date, creditsEarnedToday, completedActivities',
  userSettings: '++id, userId, requireCaregiverApproval',
  notifications: '++id, userId, type, priority, isRead, isDismissed, scheduledAt, createdAt, [userId+isRead], [userId+type], idempotencyKey',
  // Adaptive Cognitive Engine & Procedural Repetition Prevention Stores:
  adaptiveProfiles: 'userId, overallDifficulty, memoryMatch, sequenceMemory, patternRecognition, auditoryAttention, updatedAt',
  gameChallenges: '++id, userId, sessionId, gameType, difficulty, questionId, contentHash, correct, responseTimeMs, hintsUsed, retries, skipped, score, completedAt, [userId+gameType]',
  usedQuestionFingerprints: '++id, userId, contentHash, gameType, templateId, usedAt, [userId+contentHash]'
}).upgrade(async (tx) => {
  console.log('Dexie v6: adaptive game engine tables ready.');
});

// Version 7 (Canonical Activity Pipeline, Longitudinal Calendar Telemetry & Real Data Engine)
db.version(7).stores({
  users: '++id, email, role, name, isDemo, isVerified, status, createdAt, updatedAt, lastLoginAt',
  sessions: '++id, userId, token, expiresAt, createdAt',
  patientProfiles: '++id, userId, isDemo, name, age, location, createdAt, updatedAt',
  gameSessions: '++id, userId, patientId, isDemo, gameName, gameType, score, difficultyLevel, completedAt, createdAt',
  cognitiveScores: '++id, userId, patientId, isDemo, date, domain, category, score, timestamp, createdAt',
  reminders: '++id, userId, patientId, isDemo, targetUserId, createdBy, scheduledAt, status, title, time, dueAt, done, completed, type, createdAt, updatedAt',
  healthRecords: '++id, userId, patientId, isDemo, type, title, date, createdAt',
  conversations: '++id, userId, isDemo, role, timestamp, createdAt',
  syncQueue: '++id, userId, patientId, isDemo, entityType, entityId, operation, status, createdAt, retryCount, lastAttemptAt',
  creditBalances: 'userId, balance, lifetimeEarned, lifetimeSpent, lastUpdated',
  creditTransactions: '++id, userId, type, amount, reason, source, timestamp, status, balanceAfter',
  subscriptionPlans: 'id, code, name, priceMonthly, priceYearly, features, dailyCreditLimit, monthlyCreditAllowance, isActive',
  userSubscriptions: '++id, userId, planCode, status, startDate, renewalDate, endDate, autoRenew',
  rewards: 'id, title, description, category, creditCost, inventory, isDigital, status, image',
  rewardRedemptions: '++id, userId, rewardId, rewardTitle, creditCost, status, isDigital, digitalCode, requiresCaregiverApproval, caregiverApproved, redeemedAt',
  dailyActivityTracker: '++id, [userId+date], userId, date, creditsEarnedToday, completedActivities',
  userSettings: '++id, userId, requireCaregiverApproval',
  notifications: '++id, userId, type, priority, isRead, isDismissed, scheduledAt, createdAt, [userId+isRead], [userId+type], idempotencyKey',
  adaptiveProfiles: 'userId, overallDifficulty, memoryMatch, sequenceMemory, patternRecognition, auditoryAttention, updatedAt',
  gameChallenges: '++id, userId, sessionId, gameType, difficulty, questionId, contentHash, correct, responseTimeMs, hintsUsed, retries, skipped, score, completedAt, [userId+gameType]',
  usedQuestionFingerprints: '++id, userId, contentHash, gameType, templateId, usedAt, [userId+contentHash]',
  // Canonical Activity Records Store (atomic audit repository across games, reminders, and screenings)
  activityRecords: '++id, userId, patientId, isDemo, activityType, gameType, domain, score, accuracy, mistakes, durationSeconds, difficulty, completed, timestamp, date, createdAt, [userId+date], [userId+isDemo]'
}).upgrade(async (tx) => {
  console.log('Dexie v7: activityRecords table ready.');
  try {
    const existingSessions = await tx.table('gameSessions').toArray();
    const existingActivities = await tx.table('activityRecords').toArray();
    if (existingActivities.length === 0 && existingSessions.length > 0) {
      const records = existingSessions.map(s => ({
        userId: s.userId,
        patientId: s.patientId || s.userId,
        isDemo: Boolean(s.isDemo),
        activityType: 'game',
        gameType: s.gameType,
        domain: s.gameType || 'memory',
        activityName: s.gameName,
        score: s.score,
        accuracy: s.correctCount && (s.correctCount + (s.mistakeCount || 0)) > 0
          ? Math.round((s.correctCount / (s.correctCount + (s.mistakeCount || 0))) * 100)
          : s.score,
        mistakes: s.mistakeCount || 0,
        durationSeconds: s.durationSeconds || 0,
        difficulty: s.difficultyLevel || 'medium',
        completed: true,
        timestamp: s.completedAt || s.createdAt || new Date().toISOString(),
        date: (s.completedAt || s.createdAt || new Date().toISOString()).split('T')[0],
        createdAt: s.createdAt || new Date().toISOString()
      }));
      await tx.table('activityRecords').bulkAdd(records);
      console.log(`Dexie v7: Migrated ${records.length} past game sessions to activityRecords.`);
    }
  } catch (err) {
    console.warn('Dexie v7 migration notice:', err);
  }
});

// Explicit helper to ensure economy tables are seeded even after database open
export async function seedEconomyTables(targetDb = db) {
  try {
    const plansCount = await targetDb.subscriptionPlans.count();
    if (plansCount === 0) {
      await targetDb.subscriptionPlans.bulkAdd(INITIAL_SUBSCRIPTION_PLANS);
      console.log('🌱 Seeded subscription plans successfully.');
    }

    const rewardsCount = await targetDb.rewards.count();
    if (rewardsCount === 0) {
      await targetDb.rewards.bulkAdd(INITIAL_REWARDS);
      console.log('🌱 Seeded initial rewards catalog successfully.');
    }
  } catch (err) {
    console.warn('Failed to seed economy tables:', err);
  }
}

// Explicit helper to seed initial notifications for demo accounts
export async function seedInitialNotifications(targetDb = db) {
  try {
    const notifCount = await targetDb.notifications.count();
    if (notifCount > 0) return;

    const amma = await targetDb.users.get(1);
    const priya = await targetDb.users.get(2);
    if (!amma && !priya) return;

    const initialNotifications = [];
    const now = Date.now();

    if (amma) {
      initialNotifications.push(
        {
          userId: 1,
          type: 'reminder',
          priority: 'high',
          title: 'Morning Blood Pressure Tablet',
          message: 'Amma, remember to take your Amlodipine 5mg with fresh water after breakfast.',
          reminderType: 'medicine',
          actionUrl: '/patient/reminders',
          isRead: false,
          isDismissed: false,
          scheduledAt: '08:00 AM',
          createdAt: new Date(now - 15 * 60 * 1000).toISOString(),
          idempotencyKey: `seed_notif_1_${new Date().toISOString().slice(0, 10)}`
        },
        {
          userId: 1,
          type: 'reminder',
          priority: 'normal',
          title: 'Drink Fresh Water',
          message: 'Time for a warm glass of water with lemon to stay hydrated.',
          reminderType: 'water',
          actionUrl: '/patient/reminders',
          isRead: true,
          isDismissed: false,
          scheduledAt: '11:00 AM',
          createdAt: new Date(now - 2 * 3600 * 1000).toISOString(),
          readAt: new Date(now - 90 * 60 * 1000).toISOString(),
          idempotencyKey: `seed_notif_2_${new Date().toISOString().slice(0, 10)}`
        },
        {
          userId: 1,
          type: 'economy',
          priority: 'normal',
          title: 'Daily Cognitive Challenge Reward',
          message: 'You earned +10 Smriti Credits for completing Bihu Memory match today! 🌸',
          actionUrl: '/economy',
          isRead: false,
          isDismissed: false,
          scheduledAt: null,
          createdAt: new Date(now - 45 * 60 * 1000).toISOString(),
          idempotencyKey: `seed_notif_3_${new Date().toISOString().slice(0, 10)}`
        }
      );
    }

    if (priya) {
      initialNotifications.push(
        {
          userId: 2,
          type: 'alert',
          priority: 'urgent',
          title: 'Caregiver Routine Sync',
          message: 'Amma successfully confirmed her morning medication routine on time.',
          actionUrl: '/caregiver/dashboard',
          isRead: false,
          isDismissed: false,
          scheduledAt: null,
          createdAt: new Date(now - 20 * 60 * 1000).toISOString(),
          idempotencyKey: `seed_notif_4_${new Date().toISOString().slice(0, 10)}`
        },
        {
          userId: 2,
          type: 'reminder',
          priority: 'normal',
          title: 'PHC Tele-Consultation Tomorrow',
          message: 'Scheduled checkup with Dr. Arun Phukan at 10:00 AM tomorrow.',
          reminderType: 'appointment',
          actionUrl: '/caregiver/dashboard',
          isRead: false,
          isDismissed: false,
          scheduledAt: 'Tomorrow 10:00 AM',
          createdAt: new Date(now - 3 * 3600 * 1000).toISOString(),
          idempotencyKey: `seed_notif_5_${new Date().toISOString().slice(0, 10)}`
        }
      );
    }

    if (initialNotifications.length > 0) {
      await targetDb.notifications.bulkAdd(initialNotifications);
      console.log('🌱 Seeded initial notifications catalog successfully.');
    }
  } catch (err) {
    console.warn('Failed to seed initial notifications:', err);
  }
}

// Explicit helper to seed baseline adaptive difficulty profile for demo users
export async function seedAdaptiveProfiles(targetDb = db) {
  try {
    if (!targetDb.adaptiveProfiles) return;
    const profileCount = await targetDb.adaptiveProfiles.count();
    if (profileCount > 0) return;

    const amma = await targetDb.users.get(1);
    if (!amma) return;

    await targetDb.adaptiveProfiles.put({
      userId: 1,
      overallDifficulty: 0.50, // Balanced Medium baseline
      memoryMatch: 0.50,
      sequenceMemory: 0.45,
      patternRecognition: 0.50,
      auditoryAttention: 0.45,
      updatedAt: new Date().toISOString()
    });
    console.log('🌱 Seeded baseline adaptive difficulty profile.');
  } catch (err) {
    console.warn('Failed to seed adaptive profile:', err);
  }
}

// Explicit database open with robust error reporting
export async function initializeDatabase() {
  try {
    if (!db.isOpen()) {
      await db.open();
    }
    await seedEconomyTables(db);
    await seedInitialNotifications(db);
    await seedAdaptiveProfiles(db);
    console.log(`✅ IndexedDB "${db.name}" (v${db.verno}) connected successfully.`);
    return true;
  } catch (err) {
    console.error('❌ Failed to open Dexie IndexedDB:', err);
    throw err;
  }
}

// Seed data function to populate initial realistic data when completely empty
export async function seedDatabaseIfEmpty() {
  try {
    await initializeDatabase();
    const userCount = await db.users.count();
    if (userCount > 0) return; // already seeded

    console.log('🌱 Seeding initial SmritiCare database records...');

    // 1. Seed Users & Profiles in a transaction
    await db.transaction('rw', [
      db.users, 
      db.patientProfiles, 
      db.cognitiveScores, 
      db.reminders, 
      db.gameSessions, 
      db.healthRecords, 
      db.syncQueue,
      db.creditBalances,
      db.userSubscriptions,
      db.creditTransactions,
      db.rewardRedemptions,
      db.userSettings,
      db.notifications,
      db.adaptiveProfiles,
      db.activityRecords
    ], async () => {
      const patientId = await db.users.add({
        name: 'Bimala Borah (Amma)',
        role: 'patient',
        email: 'amma@smriticare.org',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256',
        pin: '1234',
        language: 'as', // Assamese default, can switch
        age: 74,
        location: 'Jorhat, Assam',
        isDemo: true,
        isVerified: false,
        status: 'demo',
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      });

      await db.patientProfiles.add({
        userId: patientId,
        isDemo: true,
        name: 'Bimala Borah (Amma)',
        age: 74,
        location: 'Jorhat, Assam',
        phcCenter: 'Titabar PHC, Jorhat',
        primaryCaregiver: 'Priya Borah',
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      });

      const caregiverId = await db.users.add({
        name: 'Priya Borah',
        role: 'caregiver',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
        email: 'priya@smriticare.org',
        passwordHash: 'demo123',
        relation: 'Daughter',
        phone: '+91 94350 12345',
        linkedPatientId: patientId,
        isDemo: true,
        isVerified: false,
        status: 'demo',
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      });

      await db.users.add({
        name: 'Dr. Arun Phukan',
        role: 'healthcare',
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=256',
        email: 'phukan@health.assam.gov.in',
        passwordHash: 'demo123',
        designation: 'PHC Medical Officer, Titabar',
        isDemo: true,
        isVerified: false,
        status: 'demo',
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      });

      // 2. Seed Cognitive Scores & Activity Records (minimal realistic sessions for demo account)
      const now = new Date();
      const formatDay = (daysAgo) => {
        const d = new Date(now);
        d.setDate(d.getDate() - daysAgo);
        return {
          dateStr: d.toISOString().split('T')[0],
          iso: d.toISOString()
        };
      };

      const demoDays = [
        { daysAgo: 2, domain: 'pattern', gameName: 'Mekhela Pattern Match', score: 85, duration: 75, correct: 5, mistakes: 1, diff: 'medium' },
        { daysAgo: 1, domain: 'memory', gameName: 'Bihu Memory Bihu', score: 90, duration: 88, correct: 6, mistakes: 1, diff: 'medium' },
        { daysAgo: 0, domain: 'routine', gameName: 'Morning at the Tea Garden', score: 95, duration: 65, correct: 5, mistakes: 0, diff: 'easy' }
      ];

      const scoresToInsert = [];
      const activitiesToInsert = [];

      demoDays.forEach((item) => {
        const { dateStr, iso } = formatDay(item.daysAgo);
        scoresToInsert.push({
          userId: patientId,
          patientId: patientId,
          isDemo: true,
          date: dateStr,
          domain: item.domain,
          category: item.domain,
          score: item.score,
          timestamp: iso,
          createdAt: iso
        });

        activitiesToInsert.push({
          userId: patientId,
          patientId: patientId,
          isDemo: true,
          activityType: 'game',
          gameType: item.domain,
          domain: item.domain,
          activityName: item.gameName,
          score: item.score,
          accuracy: Math.round((item.correct / (item.correct + item.mistakes)) * 100),
          mistakes: item.mistakes,
          durationSeconds: item.duration,
          difficulty: item.diff,
          completed: true,
          timestamp: iso,
          date: dateStr,
          createdAt: iso
        });
      });

      await db.cognitiveScores.bulkAdd(scoresToInsert);
      await db.activityRecords.bulkAdd(activitiesToInsert);

      // 3. Seed Reminders
      await db.reminders.bulkAdd([
        {
          userId: patientId,
          patientId: patientId,
          targetUserId: patientId,
          isDemo: true,
          createdBy: 'Priya Borah (Caregiver)',
          scheduledAt: '08:00 AM',
          status: 'completed',
          type: 'medicine',
          title: 'Morning Blood Pressure Tablet (Amlodipine 5mg)',
          label: 'Morning Blood Pressure Tablet (Amlodipine 5mg)',
          time: '08:00 AM',
          dueAt: '08:00 AM',
          recurring: 'daily',
          done: true,
          completed: true,
          createdOffline: false,
          missedCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          userId: patientId,
          patientId: patientId,
          targetUserId: patientId,
          isDemo: true,
          createdBy: 'Priya Borah (Caregiver)',
          scheduledAt: '11:00 AM',
          status: 'completed',
          type: 'water',
          title: 'Drink a glass of warm water with lemon',
          label: 'Drink a glass of warm water with lemon',
          time: '11:00 AM',
          dueAt: '11:00 AM',
          recurring: 'daily',
          done: true,
          completed: true,
          createdOffline: false,
          missedCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          userId: patientId,
          patientId: patientId,
          targetUserId: patientId,
          isDemo: true,
          createdBy: 'Priya Borah (Caregiver)',
          scheduledAt: '01:30 PM',
          status: 'pending',
          type: 'medicine',
          title: 'Post-Lunch Diabetes Tablet (Metformin 500mg)',
          label: 'Post-Lunch Diabetes Tablet (Metformin 500mg)',
          time: '01:30 PM',
          dueAt: '01:30 PM',
          recurring: 'daily',
          done: false,
          completed: false,
          createdOffline: false,
          missedCount: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          userId: patientId,
          patientId: patientId,
          targetUserId: patientId,
          isDemo: true,
          createdBy: 'Priya Borah (Caregiver)',
          scheduledAt: '04:30 PM',
          status: 'pending',
          type: 'routine',
          title: 'Afternoon Stroll in Garden & Sun Light',
          label: 'Afternoon Stroll in Garden & Sun Light',
          time: '04:30 PM',
          dueAt: '04:30 PM',
          recurring: 'daily',
          done: false,
          completed: false,
          createdOffline: false,
          missedCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          userId: patientId,
          patientId: patientId,
          targetUserId: patientId,
          isDemo: true,
          createdBy: 'Dr. Arun Phukan (PHC)',
          scheduledAt: 'Tomorrow 10:00 AM',
          status: 'pending',
          type: 'appointment',
          title: 'Dr. Phukan PHC Tele-Consultation Checkup',
          label: 'Dr. Phukan PHC Tele-Consultation Checkup',
          time: 'Tomorrow 10:00 AM',
          dueAt: 'Tomorrow 10:00 AM',
          recurring: 'once',
          done: false,
          completed: false,
          createdOffline: false,
          missedCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);

      // 4. Seed Past Game Sessions
      await db.gameSessions.bulkAdd([
        {
          userId: patientId,
          patientId: patientId,
          isDemo: true,
          gameName: 'Bihu Memory Bihu',
          gameType: 'memory',
          score: 85,
          difficultyLevel: 'medium',
          durationSeconds: 94,
          completedAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
          correctCount: 6,
          mistakeCount: 2,
          createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString()
        },
        {
          userId: patientId,
          patientId: patientId,
          isDemo: true,
          gameName: 'Mekhela Pattern Match',
          gameType: 'pattern',
          score: 90,
          difficultyLevel: 'medium',
          durationSeconds: 70,
          completedAt: new Date(Date.now() - 3600 * 1000 * 26).toISOString(),
          correctCount: 5,
          mistakeCount: 1,
          createdAt: new Date(Date.now() - 3600 * 1000 * 26).toISOString()
        },
        {
          userId: patientId,
          patientId: patientId,
          isDemo: true,
          gameName: 'Morning at the Tea Garden',
          gameType: 'routine',
          score: 100,
          difficultyLevel: 'medium',
          durationSeconds: 82,
          completedAt: new Date(Date.now() - 3600 * 1000 * 50).toISOString(),
          correctCount: 5,
          mistakeCount: 0,
          createdAt: new Date(Date.now() - 3600 * 1000 * 50).toISOString()
        },
        {
          userId: patientId,
          patientId: patientId,
          isDemo: true,
          gameName: 'Sounds of the Hills',
          gameType: 'attention',
          score: 60,
          difficultyLevel: 'medium',
          durationSeconds: 110,
          completedAt: new Date(Date.now() - 3600 * 1000 * 72).toISOString(),
          correctCount: 4,
          mistakeCount: 4,
          createdAt: new Date(Date.now() - 3600 * 1000 * 72).toISOString()
        }
      ]);

      // 5. Seed Health Records
      await db.healthRecords.bulkAdd([
        {
          userId: patientId,
          patientId: patientId,
          isDemo: true,
          type: 'screening',
          title: 'Initial MoCA Cognitive Screening - Mild Cognitive Impairment (Score: 21/30)',
          date: new Date(Date.now() - 25 * 86400000).toISOString().split('T')[0],
          doctor: 'Dr. Arun Phukan',
          phcCenter: 'Titabar PHC',
          createdAt: new Date(Date.now() - 25 * 86400000).toISOString()
        },
        {
          userId: patientId,
          patientId: patientId,
          isDemo: true,
          type: 'vitals',
          title: 'Blood Pressure & Heart Rate Log (128/82 mmHg, HR 74 bpm)',
          date: new Date().toISOString().split('T')[0],
          doctor: 'Community Health Worker Borah',
          phcCenter: 'Home Visit',
          createdAt: new Date().toISOString()
        }
      ]);

      // 6. Seed Business Economy Records for Demo Accounts
      await db.creditBalances.bulkAdd([
        {
          userId: patientId,
          balance: 1250,
          lifetimeEarned: 1750,
          lifetimeSpent: 500,
          lastUpdated: new Date().toISOString()
        },
        {
          userId: caregiverId,
          balance: 650,
          lifetimeEarned: 650,
          lifetimeSpent: 0,
          lastUpdated: new Date().toISOString()
        }
      ]);

      await db.userSubscriptions.bulkAdd([
        {
          userId: patientId,
          planCode: 'PREMIUM',
          status: 'active',
          startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
          renewalDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          endDate: new Date(Date.now() + 365 * 86400000).toISOString(),
          autoRenew: true
        },
        {
          userId: caregiverId,
          planCode: 'STANDARD',
          status: 'active',
          startDate: new Date(Date.now() - 15 * 86400000).toISOString(),
          renewalDate: new Date(Date.now() + 15 * 86400000).toISOString(),
          endDate: new Date(Date.now() + 350 * 86400000).toISOString(),
          autoRenew: true
        }
      ]);

      await db.creditTransactions.bulkAdd([
        {
          userId: patientId,
          type: 'earn',
          amount: 1200,
          reason: 'Monthly Premium Plan Credit Allowance',
          source: 'plan_allowance',
          timestamp: new Date(Date.now() - 28 * 86400000).toISOString(),
          status: 'completed',
          balanceAfter: 1200
        },
        {
          userId: patientId,
          type: 'spend',
          amount: -500,
          reason: 'Redeemed: Tales of the Brahmaputra Book',
          source: 'marketplace_redemption',
          timestamp: new Date(Date.now() - 14 * 86400000).toISOString(),
          status: 'completed',
          balanceAfter: 700
        },
        {
          userId: patientId,
          type: 'earn',
          amount: 200,
          reason: '7-Day Healthy Engagement Streak Milestone',
          source: 'streak_milestone',
          timestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
          status: 'completed',
          balanceAfter: 900
        },
        {
          userId: patientId,
          type: 'earn',
          amount: 100,
          reason: 'Completed Daily Cognitive Challenge',
          source: 'daily_challenge',
          timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
          status: 'completed',
          balanceAfter: 1000
        },
        {
          userId: patientId,
          type: 'earn',
          amount: 250,
          reason: 'Completed 5 Cognitive Cultural Games',
          source: 'cognitive_games',
          timestamp: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
          status: 'completed',
          balanceAfter: 1250
        },
        {
          userId: caregiverId,
          type: 'earn',
          amount: 600,
          reason: 'Monthly Standard Plan Credit Allowance',
          source: 'plan_allowance',
          timestamp: new Date(Date.now() - 15 * 86400000).toISOString(),
          status: 'completed',
          balanceAfter: 600
        },
        {
          userId: caregiverId,
          type: 'earn',
          amount: 50,
          reason: 'Caregiver Schedule Review & Routine Confirmation',
          source: 'caregiver_activity',
          timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
          status: 'completed',
          balanceAfter: 650
        }
      ]);

      await db.rewardRedemptions.bulkAdd([
        {
          userId: patientId,
          rewardId: 'rew_folk_tales_book',
          rewardTitle: 'Tales of the Brahmaputra: Illustrated Assamese Folk Legends',
          creditCost: 500,
          status: 'completed',
          isDigital: false,
          digitalCode: null,
          requiresCaregiverApproval: false,
          caregiverApproved: true,
          redeemedAt: new Date(Date.now() - 14 * 86400000).toISOString()
        }
      ]);

      await db.userSettings.bulkAdd([
        {
          userId: patientId,
          requireCaregiverApproval: false
        },
        {
          userId: caregiverId,
          requireCaregiverApproval: false
        }
      ]);

      await db.adaptiveProfiles.bulkAdd([
        {
          userId: patientId,
          overallDifficulty: 0.50,
          memoryMatch: 0.50,
          sequenceMemory: 0.45,
          patternRecognition: 0.50,
          auditoryAttention: 0.45,
          updatedAt: new Date().toISOString()
        }
      ]);
    });

    console.log('✅ SmritiCare database seeded successfully with realistic NER dementia care records (flagged as demo).');
  } catch (err) {
    console.error('❌ Error in seedDatabaseIfEmpty:', err);
    throw err;
  }
}

// Observability and Diagnostics API
export async function getDatabaseDiagnostics(selectedPatientId = null, customMode = null) {
  try {
    const isOpened = db.isOpen();
    const mode = customMode || getAppMode();
    const isProd = mode === 'production';

    // Retrieve all users
    const allUsers = await db.users.toArray();
    const verifiedUsers = allUsers.filter(u => !u.isDemo && u.isVerified !== false && u.status !== 'demo');
    const demoUsers = allUsers.filter(u => u.isDemo === true || u.status === 'demo');

    // Retrieve table records
    const [allProfiles, allGames, allScores, allReminders, allHealth, allConvs, allQueue] = await Promise.all([
      db.patientProfiles.toArray(),
      db.gameSessions.toArray(),
      db.cognitiveScores.toArray(),
      db.reminders.toArray(),
      db.healthRecords.toArray(),
      db.conversations.toArray(),
      db.syncQueue.toArray()
    ]);

    // In production mode, filter out demo data
    const filterRecs = (arr) => isProd ? arr.filter(r => !r.isDemo) : arr;

    const gameSessions = filterRecs(allGames);
    const cognitiveScores = filterRecs(allScores);
    const reminders = filterRecs(allReminders);
    const patientProfiles = filterRecs(allProfiles);
    const healthRecords = filterRecs(allHealth);
    const conversations = filterRecs(allConvs);
    const syncQueue = filterRecs(allQueue);

    // Filter by selected patient if provided
    const patientFilter = (arr) => {
      if (!selectedPatientId) return arr;
      const pid = Number(selectedPatientId);
      return arr.filter(r => (Number(r.patientId) === pid || Number(r.userId) === pid || Number(r.targetUserId) === pid));
    };

    const selectedGames = patientFilter(gameSessions);
    const selectedScores = patientFilter(cognitiveScores);
    const selectedReminders = patientFilter(reminders);
    const selectedProfiles = patientFilter(patientProfiles);
    const selectedHealth = patientFilter(healthRecords);
    const selectedConvs = patientFilter(conversations);
    const selectedQueue = patientFilter(syncQueue);

    const pendingQueue = selectedQueue.filter(s => s.status === 'pending');

    // Integrity Breakdown
    const totalVerifiedUsers = verifiedUsers.length;
    const verifiedUserIds = new Set(verifiedUsers.map(u => Number(u.id)));

    // Non-demo records count
    const allNonDemoRecords = [
      ...allGames.filter(r => !r.isDemo),
      ...allScores.filter(r => !r.isDemo),
      ...allReminders.filter(r => !r.isDemo),
      ...allProfiles.filter(r => !r.isDemo),
      ...allHealth.filter(r => !r.isDemo),
      ...allConvs.filter(r => !r.isDemo)
    ];

    const linkedRecordsCount = allNonDemoRecords.filter(r =>
      verifiedUserIds.has(Number(r.userId)) ||
      verifiedUserIds.has(Number(r.patientId)) ||
      verifiedUserIds.has(Number(r.targetUserId))
    ).length;

    const unassignedRecordsCount = allNonDemoRecords.filter(r =>
      !verifiedUserIds.has(Number(r.userId)) &&
      !verifiedUserIds.has(Number(r.patientId)) &&
      !verifiedUserIds.has(Number(r.targetUserId))
    ).length;

    const demoRecordsCount = [
      ...demoUsers,
      ...allGames.filter(r => r.isDemo),
      ...allScores.filter(r => r.isDemo),
      ...allReminders.filter(r => r.isDemo),
      ...allProfiles.filter(r => r.isDemo),
      ...allHealth.filter(r => r.isDemo),
      ...allConvs.filter(r => r.isDemo),
      ...allQueue.filter(r => r.isDemo)
    ].length;

    // Determine timestamp of the most recent local write
    const activeUsersList = isProd ? verifiedUsers : allUsers;
    const timestamps = [
      ...activeUsersList.map(u => u.lastLoginAt || u.updatedAt || u.createdAt),
      ...selectedGames.map(g => g.completedAt || g.createdAt),
      ...selectedReminders.map(r => r.updatedAt || r.createdAt)
    ].filter(Boolean);

    timestamps.sort();
    const lastWrite = timestamps.length > 0 ? timestamps[timestamps.length - 1] : 'None';

    // Last sync timestamp sanitizer: fix legacy "Sep 12, 04:30 PM" or "2001"
    let rawSync = localStorage.getItem('smriti_last_sync') || 'Never';
    if (rawSync && rawSync !== 'Never') {
      if (rawSync.includes('2001') || (!rawSync.includes('202') && !rawSync.includes('T'))) {
        const parsed = new Date(rawSync);
        if (isNaN(parsed.getTime()) || parsed.getFullYear() < 2025) {
          rawSync = new Date().toISOString();
          localStorage.setItem('smriti_last_sync', rawSync);
        }
      }
    }

    return {
      status: isOpened ? 'CONNECTED' : 'OPENING',
      name: db.name,
      version: db.verno,
      mode,
      isProduction: isProd,
      selectedPatientId,
      // Main Telemetry Counts (Verified in Prod, or Demo in Demo)
      usersCount: isProd ? totalVerifiedUsers : allUsers.length,
      verifiedUsersCount: totalVerifiedUsers,
      demoUsersCount: demoUsers.length,
      gameSessionsCount: selectedGames.length,
      cognitiveScoresCount: selectedScores.length,
      remindersCount: selectedReminders.length,
      patientProfilesCount: selectedProfiles.length,
      healthRecordsCount: selectedHealth.length,
      conversationsCount: selectedConvs.length,
      syncQueueCount: selectedQueue.length,
      pendingQueueCount: pendingQueue.length,
      totalRecords: (isProd ? totalVerifiedUsers : allUsers.length) + selectedGames.length + selectedScores.length + selectedReminders.length + selectedProfiles.length + selectedHealth.length + selectedConvs.length,

      // Data Integrity Metrics
      integrity: {
        totalVerifiedUsers,
        linkedRecordsCount,
        unassignedRecordsCount,
        demoRecordsCount,
        pendingSyncCount: pendingQueue.length,
        totalQueueCount: selectedQueue.length
      },
      verifiedUsersList: verifiedUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isVerified: true,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        status: u.status || 'active'
      })),
      lastWrite,
      lastSync: rawSync,
      lastSyncError: localStorage.getItem('smriti_last_sync_error') || 'None'
    };
  } catch (err) {
    return {
      status: 'ERROR',
      error: err.message || String(err),
      name: db.name,
      version: db.verno,
      totalRecords: 0,
      pendingQueueCount: 0,
      integrity: {
        totalVerifiedUsers: 0,
        linkedRecordsCount: 0,
        unassignedRecordsCount: 0,
        demoRecordsCount: 0,
        pendingSyncCount: 0
      }
    };
  }
}
