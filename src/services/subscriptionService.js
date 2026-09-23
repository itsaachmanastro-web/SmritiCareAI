/**
 * subscriptionService.js
 * Centralized entitlement, subscription management, and plan pricing service.
 * 
 * SPECIFICATION RULES:
 * - Centralized entitlement checks (hasFeature, canAccessFeature, getRequiredPlanForFeature)
 * - Single source of truth for features and plan capabilities
 * - Free / Basic: Basic Cognitive Games, Medication & Water Reminders (Daily Cap: 200)
 * - Classic: Basic Games, Reminders, All Cultural Games & Stages (Daily Cap: 350, Bonus: +250)
 * - Standard: Basic Games, Reminders, All Cultural Games, Caregiver Reports & Telemetry (Daily Cap: 500, Bonus: +600)
 * - Premium: All features including Advanced Voice AI, Full Telemetry & Reports, Priority Care Tools (Daily Cap: 800, Bonus: +1200)
 * - Real-time event dispatching on plan changes for instant UI reaction without page refresh
 */

import { db, INITIAL_SUBSCRIPTION_PLANS } from '../db/dexie.js';

export const PLAN_CODES = {
  FREE: 'FREE',
  CLASSIC: 'CLASSIC',
  STANDARD: 'STANDARD',
  PREMIUM: 'PREMIUM'
};

export const FEATURE_KEYS = {
  BASIC_GAMES: 'basic_games',
  BASIC_REMINDERS: 'basic_reminders',
  ALL_CULTURAL_GAMES: 'all_cultural_games',
  CAREGIVER_TOOLS: 'caregiver_tools',
  EXPORTABLE_REPORTS: 'exportable_reports',
  VOICE_AI: 'voice_ai',
  PRIORITY_SUPPORT: 'priority_support',
  PREMIUM_REWARDS: 'premium_rewards'
};

export const PLAN_LIMITS = {
  FREE: {
    dailyCreditLimit: 200,
    monthlyAllowance: 0,
    aiQueriesPerDay: 0,
    maxReminders: 5
  },
  CLASSIC: {
    dailyCreditLimit: 350,
    monthlyAllowance: 250,
    aiQueriesPerDay: 0,
    maxReminders: 15
  },
  STANDARD: {
    dailyCreditLimit: 500,
    monthlyAllowance: 600,
    aiQueriesPerDay: 0,
    maxReminders: 50
  },
  PREMIUM: {
    dailyCreditLimit: 800,
    monthlyAllowance: 1200,
    aiQueriesPerDay: 9999, // unlimited
    maxReminders: 9999
  }
};

/**
 * Feature metadata describing display name and minimum required plan.
 */
export const FEATURE_DEFINITIONS = {
  [FEATURE_KEYS.BASIC_GAMES]: {
    id: FEATURE_KEYS.BASIC_GAMES,
    name: 'Basic Cognitive Games',
    description: 'Observation and video memory exercises like Memory Motion.',
    requiredPlan: PLAN_CODES.FREE,
    requiredPlanName: 'Free / Basic'
  },
  [FEATURE_KEYS.BASIC_REMINDERS]: {
    id: FEATURE_KEYS.BASIC_REMINDERS,
    name: 'Medication & Water Reminders',
    description: 'Daily schedule tracking for medications, meals, and hydration.',
    requiredPlan: PLAN_CODES.FREE,
    requiredPlanName: 'Free / Basic'
  },
  [FEATURE_KEYS.ALL_CULTURAL_GAMES]: {
    id: FEATURE_KEYS.ALL_CULTURAL_GAMES,
    name: 'All Cultural Heritage Games & Stages',
    description: 'Bihu Memory, Mekhela Pattern Weaver, Tea Garden Routine, and Sounds of Hills.',
    requiredPlan: PLAN_CODES.CLASSIC,
    requiredPlanName: 'Classic'
  },
  [FEATURE_KEYS.CAREGIVER_TOOLS]: {
    id: FEATURE_KEYS.CAREGIVER_TOOLS,
    name: 'Caregiver Tools & Telemetry',
    description: 'Longitudinal cognitive tracking and remote family care management.',
    requiredPlan: PLAN_CODES.STANDARD,
    requiredPlanName: 'Standard'
  },
  [FEATURE_KEYS.EXPORTABLE_REPORTS]: {
    id: FEATURE_KEYS.EXPORTABLE_REPORTS,
    name: 'Caregiver Reports & PHC Summaries',
    description: 'Weekly standardized clinical summaries and printable PHC trajectory reports.',
    requiredPlan: PLAN_CODES.STANDARD,
    requiredPlanName: 'Standard'
  },
  [FEATURE_KEYS.VOICE_AI]: {
    id: FEATURE_KEYS.VOICE_AI,
    name: 'Advanced Voice AI Companion',
    description: 'Real-time interactive voice dialogue, emotional support, and multilingual conversation.',
    requiredPlan: PLAN_CODES.PREMIUM,
    requiredPlanName: 'Premium'
  }
};

/**
 * Returns minimum required plan code for a given feature key.
 */
export function getRequiredPlanForFeature(featureKey) {
  return FEATURE_DEFINITIONS[featureKey]?.requiredPlan || PLAN_CODES.PREMIUM;
}

/**
 * Returns minimum required plan name for a given feature key.
 */
export function getRequiredPlanNameForFeature(featureKey) {
  return FEATURE_DEFINITIONS[featureKey]?.requiredPlanName || 'Premium';
}

/**
 * Synchronous plan tier rank for fast comparison (0: FREE, 1: CLASSIC, 2: STANDARD, 3: PREMIUM).
 */
export function getPlanRank(planCode) {
  const code = (planCode || '').toUpperCase();
  switch (code) {
    case PLAN_CODES.PREMIUM: return 3;
    case PLAN_CODES.STANDARD: return 2;
    case PLAN_CODES.CLASSIC: return 1;
    case PLAN_CODES.FREE:
    default: return 0;
  }
}

/**
 * Fast synchronous check if a plan code meets the minimum required tier for a feature.
 */
export function canPlanAccessFeature(userPlanCode, featureKey) {
  const reqPlan = getRequiredPlanForFeature(featureKey);
  return getPlanRank(userPlanCode) >= getPlanRank(reqPlan);
}

/**
 * Retrieves user's active subscription from Dexie database.
 * If no subscription record exists, checks localStorage cache before returning default FREE tier.
 */
export async function getUserSubscription(userId) {
  if (!userId || isNaN(Number(userId))) {
    const cachedPlan = getCachedUserPlan(null);
    return getDefaultFreeSubscription(null, cachedPlan);
  }

  const numId = Number(userId);

  try {
    const sub = await db.userSubscriptions.where('userId').equals(numId).first();
    if (sub) {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(`smriti_user_plan_${numId}`, sub.planCode || PLAN_CODES.FREE);
      }
      return sub;
    }
    const cachedPlan = getCachedUserPlan(numId);
    return getDefaultFreeSubscription(numId, cachedPlan);
  } catch (err) {
    console.warn('Failed to retrieve user subscription from DB, checking cache:', err);
    const cachedPlan = getCachedUserPlan(numId);
    return getDefaultFreeSubscription(numId, cachedPlan);
  }
}

function getCachedUserPlan(userId) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (userId) {
        const p = localStorage.getItem(`smriti_user_plan_${userId}`);
        if (p) return p.toUpperCase();
      }
      const generic = localStorage.getItem('smriti_active_plan');
      if (generic) return generic.toUpperCase();
    }
  } catch {}
  return PLAN_CODES.FREE;
}

function getDefaultFreeSubscription(userId, planCode = PLAN_CODES.FREE) {
  return {
    userId: userId && !isNaN(Number(userId)) ? Number(userId) : null,
    planCode: planCode || PLAN_CODES.FREE,
    status: 'active',
    startDate: new Date().toISOString(),
    renewalDate: null,
    endDate: null,
    autoRenew: false
  };
}

/**
 * Retrieves all subscription plans from the database.
 * Falls back to INITIAL_SUBSCRIPTION_PLANS if database is empty.
 */
export async function getSubscriptionPlans() {
  try {
    const plans = await db.subscriptionPlans.toArray();
    if (plans && plans.length > 0) {
      return plans.map(p => {
        const canonical = INITIAL_SUBSCRIPTION_PLANS.find(ip => ip.code === p.code);
        return {
          ...p,
          features: canonical?.features || p.features || []
        };
      });
    }
    return INITIAL_SUBSCRIPTION_PLANS;
  } catch (err) {
    console.warn('Failed to retrieve subscription plans from DB:', err);
    return INITIAL_SUBSCRIPTION_PLANS;
  }
}

/**
 * Admin action: Updates the monthly/yearly pricing of a subscription plan.
 */
export async function updatePlanPricing(planCode, { priceMonthly, priceYearly }) {
  try {
    const plan = await db.subscriptionPlans.where('code').equals(planCode).first();
    if (plan) {
      await db.subscriptionPlans.update(plan.id, {
        priceMonthly: Number(priceMonthly),
        priceYearly: Number(priceYearly),
        updatedAt: new Date().toISOString()
      });
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to update plan pricing:', err);
    throw err;
  }
}

/**
 * Centralized Entitlement Check:
 * Determines if a specific user (or plan code string) has access to a feature key.
 */
export async function hasFeature(userIdOrPlanCode, featureKey) {
  if (!userIdOrPlanCode) return false;
  try {
    let planCode = PLAN_CODES.FREE;
    if (typeof userIdOrPlanCode === 'string' && isNaN(Number(userIdOrPlanCode))) {
      planCode = userIdOrPlanCode.toUpperCase();
    } else {
      const sub = await getUserSubscription(userIdOrPlanCode);
      planCode = sub?.status === 'active' ? sub.planCode : PLAN_CODES.FREE;
    }
    
    return canPlanAccessFeature(planCode, featureKey);
  } catch (err) {
    console.warn(`Error checking feature ${featureKey}:`, err);
    return false;
  }
}

export const canAccessFeature = hasFeature;

/**
 * Returns the maximum credits a user can earn per calendar day.
 */
export async function getCreditDailyLimit(userIdOrPlanCode) {
  try {
    let planCode = PLAN_CODES.FREE;
    if (typeof userIdOrPlanCode === 'string' && isNaN(Number(userIdOrPlanCode))) {
      planCode = userIdOrPlanCode.toUpperCase();
    } else {
      const sub = await getUserSubscription(userIdOrPlanCode);
      planCode = sub?.status === 'active' ? sub.planCode : PLAN_CODES.FREE;
    }
    return PLAN_LIMITS[planCode]?.dailyCreditLimit || 200;
  } catch {
    return 200;
  }
}

/**
 * Returns the monthly bonus credit allowance for the user's plan.
 */
export async function getMonthlyCreditAllowance(userIdOrPlanCode) {
  try {
    let planCode = PLAN_CODES.FREE;
    if (typeof userIdOrPlanCode === 'string' && isNaN(Number(userIdOrPlanCode))) {
      planCode = userIdOrPlanCode.toUpperCase();
    } else {
      const sub = await getUserSubscription(userIdOrPlanCode);
      planCode = sub?.status === 'active' ? sub.planCode : PLAN_CODES.FREE;
    }
    return PLAN_LIMITS[planCode]?.monthlyAllowance || 0;
  } catch {
    return 0;
  }
}

/**
 * Returns the maximum AI queries permitted per day.
 */
export async function getAiUsageLimit(userIdOrPlanCode) {
  try {
    let planCode = PLAN_CODES.FREE;
    if (typeof userIdOrPlanCode === 'string' && isNaN(Number(userIdOrPlanCode))) {
      planCode = userIdOrPlanCode.toUpperCase();
    } else {
      const sub = await getUserSubscription(userIdOrPlanCode);
      planCode = sub?.status === 'active' ? sub.planCode : PLAN_CODES.FREE;
    }
    return PLAN_LIMITS[planCode]?.aiQueriesPerDay || 0;
  } catch {
    return 0;
  }
}

/**
 * Aggregates all user entitlements and limits into a single object for context & UI.
 */
export async function getUserEntitlements(userIdOrPlanCode) {
  try {
    let sub;
    let planCode = PLAN_CODES.FREE;
    if (typeof userIdOrPlanCode === 'string' && isNaN(Number(userIdOrPlanCode))) {
      planCode = userIdOrPlanCode.toUpperCase();
      sub = getDefaultFreeSubscription(null, planCode);
    } else {
      sub = await getUserSubscription(userIdOrPlanCode);
      planCode = sub?.status === 'active' ? (sub.planCode || PLAN_CODES.FREE) : PLAN_CODES.FREE;
    }

    const plans = await getSubscriptionPlans();
    const planDetails = plans.find(p => p.code === planCode) || plans[0];
    const limits = PLAN_LIMITS[planCode] || PLAN_LIMITS.FREE;
    const numericUserId = !isNaN(Number(userIdOrPlanCode)) ? Number(userIdOrPlanCode) : null;

    const canUseVoiceAi = canPlanAccessFeature(planCode, FEATURE_KEYS.VOICE_AI);
    const canUseCaregiverTools = canPlanAccessFeature(planCode, FEATURE_KEYS.CAREGIVER_TOOLS);
    const canAccessAllGames = canPlanAccessFeature(planCode, FEATURE_KEYS.ALL_CULTURAL_GAMES);
    const canExportReports = canPlanAccessFeature(planCode, FEATURE_KEYS.EXPORTABLE_REPORTS);
    const canAccessPremiumRewards = canPlanAccessFeature(planCode, FEATURE_KEYS.PREMIUM_REWARDS);

    return {
      userId: numericUserId,
      planCode,
      status: sub.status || 'active',
      planName: planDetails?.name || (planCode === 'FREE' ? 'Free / Basic' : planCode),
      startDate: sub.startDate,
      renewalDate: sub.renewalDate,
      autoRenew: sub.autoRenew,
      dailyCreditLimit: limits.dailyCreditLimit,
      monthlyAllowance: limits.monthlyAllowance,
      aiQueriesPerDay: limits.aiQueriesPerDay,
      features: planDetails?.features || [],
      canUseVoiceAi,
      canUseCaregiverTools,
      canAccessAllGames,
      canExportReports,
      canAccessPremiumRewards,
      hasFeature: (featKey) => canPlanAccessFeature(planCode, featKey)
    };
  } catch (err) {
    console.warn('Failed to aggregate user entitlements:', err);
    return {
      userId: !isNaN(Number(userIdOrPlanCode)) ? Number(userIdOrPlanCode) : null,
      planCode: PLAN_CODES.FREE,
      status: 'active',
      planName: 'Free / Basic',
      dailyCreditLimit: 200,
      monthlyAllowance: 0,
      aiQueriesPerDay: 0,
      features: ['basic_games', 'basic_reminders'],
      canUseVoiceAi: false,
      canUseCaregiverTools: false,
      canAccessAllGames: false,
      canExportReports: false,
      canAccessPremiumRewards: false,
      hasFeature: (featKey) => canPlanAccessFeature(PLAN_CODES.FREE, featKey)
    };
  }
}

/**
 * Changes a user's subscription tier with synchronous cache invalidation and custom event broadcast.
 */
export async function changeSubscription({ userId, planCode, billingCycle = 'monthly' }) {
  if (!userId) throw new Error('User ID is required');

  const normalizedCode = (planCode || '').toUpperCase();
  const plans = await getSubscriptionPlans();
  const targetPlan = plans.find(p => p.code === normalizedCode);
  if (!targetPlan) throw new Error(`Invalid plan code: ${planCode}`);

  const numUserId = Number(userId);
  const now = new Date();
  const renewalDays = billingCycle === 'yearly' ? 365 : 30;
  const renewalDate = new Date(now.getTime() + renewalDays * 86400000).toISOString();

  const existingSub = await db.userSubscriptions.where('userId').equals(numUserId).first();

  if (existingSub) {
    await db.userSubscriptions.update(existingSub.id, {
      planCode: normalizedCode,
      status: 'active',
      startDate: now.toISOString(),
      renewalDate,
      endDate: renewalDate,
      autoRenew: true,
      updatedAt: now.toISOString()
    });
  } else {
    await db.userSubscriptions.add({
      userId: numUserId,
      planCode: normalizedCode,
      status: 'active',
      startDate: now.toISOString(),
      renewalDate,
      endDate: renewalDate,
      autoRenew: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    });
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(`smriti_user_plan_${numUserId}`, normalizedCode);
    localStorage.setItem('smriti_active_plan', normalizedCode);
    window.dispatchEvent(new CustomEvent('smriti_subscription_updated', {
      detail: { userId: numUserId, planCode: normalizedCode }
    }));
  }

  return await getUserSubscription(numUserId);
}

/**
 * Cancels active subscription.
 */
export async function cancelSubscription(userId) {
  if (!userId) throw new Error('User ID is required');
  const numUserId = Number(userId);

  const existingSub = await db.userSubscriptions.where('userId').equals(numUserId).first();
  if (!existingSub) {
    return getDefaultFreeSubscription(numUserId);
  }

  await db.userSubscriptions.update(existingSub.id, {
    status: 'cancelled',
    autoRenew: false,
    updatedAt: new Date().toISOString()
  });

  if (typeof window !== 'undefined' && window.localStorage) {
    window.dispatchEvent(new CustomEvent('smriti_subscription_updated', {
      detail: { userId: numUserId, planCode: existingSub.planCode, status: 'cancelled' }
    }));
  }

  return await getUserSubscription(numUserId);
}

/**
 * Restores a cancelled subscription before expiration.
 */
export async function restoreSubscription(userId) {
  if (!userId) throw new Error('User ID is required');
  const numUserId = Number(userId);

  const existingSub = await db.userSubscriptions.where('userId').equals(numUserId).first();
  if (existingSub && existingSub.status === 'cancelled') {
    await db.userSubscriptions.update(existingSub.id, {
      status: 'active',
      autoRenew: true,
      updatedAt: new Date().toISOString()
    });
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    window.dispatchEvent(new CustomEvent('smriti_subscription_updated', {
      detail: { userId: numUserId, planCode: existingSub?.planCode || PLAN_CODES.FREE, status: 'active' }
    }));
  }

  return await getUserSubscription(numUserId);
}

export const ENTITLEMENTS = {
  GAMES_UNLIMITED: 'all_cultural_games',
  VOICE_AI: 'voice_ai',
  CARE_TOOLS: 'caregiver_tools',
  REPORTS: 'exportable_reports',
  PREMIUM_REWARDS: 'premium_rewards'
};

export const subscriptionService = {
  PLAN_CODES,
  FEATURE_KEYS,
  FEATURE_DEFINITIONS,
  PLAN_LIMITS,
  ENTITLEMENTS,
  getRequiredPlanForFeature,
  getRequiredPlanNameForFeature,
  getPlanRank,
  canPlanAccessFeature,
  getUserSubscription,
  getSubscriptionPlans,
  updatePlanPricing,
  hasFeature,
  canAccessFeature,
  getCreditDailyLimit,
  getMonthlyCreditAllowance,
  getAiUsageLimit,
  getUserEntitlements,
  changeSubscription,
  cancelSubscription,
  restoreSubscription
};

export default subscriptionService;

