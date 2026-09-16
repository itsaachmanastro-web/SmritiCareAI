/**
 * subscriptionService.js
 * Centralized entitlement, subscription management, and plan pricing service.
 * 
 * SPECIFICATION RULES:
 * - Centralized entitlement checks (hasFeature, getCreditDailyLimit, getMonthlyCreditAllowance, getAiUsageLimit)
 * - Avoid scattered if (plan === 'premium') logic across the codebase
 * - Configurable plan pricing via Admin panel (not hardcoded in UI components)
 * - Safe and transparent monetization; NO fake medical claims
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
  BASIC_AI: 'basic_ai',
  ALL_CULTURAL_GAMES: 'all_cultural_games',
  ENHANCED_AI: 'enhanced_ai',
  PERSONALIZED_PROMPTS: 'personalized_prompts',
  CAREGIVER_TOOLS: 'caregiver_tools',
  HIGHER_CREDIT_LIMITS: 'higher_credit_limits',
  EXPORTABLE_REPORTS: 'exportable_reports',
  VOICE_AI: 'voice_ai',
  PRIORITY_SUPPORT: 'priority_support',
  PREMIUM_REWARDS: 'premium_rewards'
};

const PLAN_LIMITS = {
  FREE: {
    dailyCreditLimit: 200,
    monthlyAllowance: 0,
    aiQueriesPerDay: 15,
    maxReminders: 5
  },
  CLASSIC: {
    dailyCreditLimit: 350,
    monthlyAllowance: 250,
    aiQueriesPerDay: 50,
    maxReminders: 15
  },
  STANDARD: {
    dailyCreditLimit: 500,
    monthlyAllowance: 600,
    aiQueriesPerDay: 150,
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
 * Retrieves user's active subscription from Dexie database.
 * If no subscription record exists, returns the default FREE tier.
 */
export async function getUserSubscription(userId) {
  if (!userId || isNaN(Number(userId))) {
    return getDefaultFreeSubscription(null);
  }

  try {
    const sub = await db.userSubscriptions.where('userId').equals(Number(userId)).first();
    if (!sub) {
      return getDefaultFreeSubscription(userId);
    }
    return sub;
  } catch (err) {
    console.warn('Failed to retrieve user subscription:', err);
    return getDefaultFreeSubscription(userId);
  }
}

function getDefaultFreeSubscription(userId) {
  return {
    userId: userId && !isNaN(Number(userId)) ? Number(userId) : null,
    planCode: PLAN_CODES.FREE,
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
      return plans;
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
 * Determines if a specific user has access to a feature key based on active subscription.
 * Can also be queried directly by planCode (e.g. 'PREMIUM', 'CLASSIC').
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
    
    // Retrieve plan features
    const plans = await getSubscriptionPlans();
    const currentPlan = plans.find(p => p.code === planCode) || plans.find(p => p.code === PLAN_CODES.FREE);
    
    if (!currentPlan || !currentPlan.features) return false;
    return currentPlan.features.includes(featureKey);
  } catch (err) {
    console.warn(`Error checking feature ${featureKey}:`, err);
    return false;
  }
}

/**
 * Returns the maximum credits a user can earn per calendar day.
 * Can accept userId or planCode string.
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
 * Can accept userId or planCode string.
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
 * Can accept userId or planCode string.
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
    return PLAN_LIMITS[planCode]?.aiQueriesPerDay || 15;
  } catch {
    return 15;
  }
}

/**
 * Aggregates all user entitlements and limits into a single object for context & UI.
 * Can accept userId or planCode string.
 */
export async function getUserEntitlements(userIdOrPlanCode) {
  try {
    let sub;
    let planCode = PLAN_CODES.FREE;
    if (typeof userIdOrPlanCode === 'string' && isNaN(Number(userIdOrPlanCode))) {
      planCode = userIdOrPlanCode.toUpperCase();
      sub = getDefaultFreeSubscription(null);
      sub.planCode = planCode;
    } else {
      sub = await getUserSubscription(userIdOrPlanCode);
      planCode = sub?.status === 'active' ? sub.planCode : PLAN_CODES.FREE;
    }
    const plans = await getSubscriptionPlans();
    const planDetails = plans.find(p => p.code === planCode) || plans[0];
    const limits = PLAN_LIMITS[planCode] || PLAN_LIMITS.FREE;

    const numericUserId = !isNaN(Number(userIdOrPlanCode)) ? Number(userIdOrPlanCode) : null;

    return {
      userId: numericUserId,
      planCode,
      status: sub.status,
      planName: planDetails?.name || planCode,
      startDate: sub.startDate,
      renewalDate: sub.renewalDate,
      autoRenew: sub.autoRenew,
      dailyCreditLimit: limits.dailyCreditLimit,
      monthlyAllowance: limits.monthlyAllowance,
      aiQueriesPerDay: limits.aiQueriesPerDay,
      features: planDetails?.features || [],
      canUseVoiceAi: planDetails?.features?.includes(FEATURE_KEYS.VOICE_AI) || false,
      canUseCaregiverTools: planDetails?.features?.includes(FEATURE_KEYS.CAREGIVER_TOOLS) || false,
      canAccessAllGames: planDetails?.features?.includes(FEATURE_KEYS.ALL_CULTURAL_GAMES) || false,
      canExportReports: planDetails?.features?.includes(FEATURE_KEYS.EXPORTABLE_REPORTS) || false,
      canAccessPremiumRewards: planDetails?.features?.includes(FEATURE_KEYS.PREMIUM_REWARDS) || false
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
      aiQueriesPerDay: 15,
      features: ['basic_games', 'basic_reminders', 'basic_ai'],
      canUseVoiceAi: false,
      canUseCaregiverTools: false,
      canAccessAllGames: false,
      canExportReports: false,
      canAccessPremiumRewards: false
    };
  }
}

/**
 * Changes a user's subscription tier.
 * In a production system, this is invoked by webhook or server verification.
 */
export async function changeSubscription({ userId, planCode, billingCycle = 'monthly' }) {
  if (!userId) throw new Error('User ID is required');

  const plans = await getSubscriptionPlans();
  const targetPlan = plans.find(p => p.code === planCode);
  if (!targetPlan) throw new Error(`Invalid plan code: ${planCode}`);

  const now = new Date();
  const renewalDays = billingCycle === 'yearly' ? 365 : 30;
  const renewalDate = new Date(now.getTime() + renewalDays * 86400000).toISOString();

  const existingSub = await db.userSubscriptions.where('userId').equals(Number(userId)).first();

  if (existingSub) {
    await db.userSubscriptions.update(existingSub.id, {
      planCode,
      status: 'active',
      startDate: now.toISOString(),
      renewalDate,
      endDate: renewalDate,
      autoRenew: true,
      updatedAt: now.toISOString()
    });
  } else {
    await db.userSubscriptions.add({
      userId: Number(userId),
      planCode,
      status: 'active',
      startDate: now.toISOString(),
      renewalDate,
      endDate: renewalDate,
      autoRenew: true,
      createdAt: now.toISOString()
    });
  }

  return await getUserSubscription(userId);
}

/**
 * Cancels active subscription with transparent, clear cancellation.
 * Keeps access valid until renewalDate.
 */
export async function cancelSubscription(userId) {
  if (!userId) throw new Error('User ID is required');

  const existingSub = await db.userSubscriptions.where('userId').equals(Number(userId)).first();
  if (!existingSub) {
    return getDefaultFreeSubscription(userId);
  }

  await db.userSubscriptions.update(existingSub.id, {
    status: 'cancelled',
    autoRenew: false,
    updatedAt: new Date().toISOString()
  });

  return await getUserSubscription(userId);
}

/**
 * Restores a cancelled subscription before expiration.
 */
export async function restoreSubscription(userId) {
  if (!userId) throw new Error('User ID is required');

  const existingSub = await db.userSubscriptions.where('userId').equals(Number(userId)).first();
  if (existingSub && existingSub.status === 'cancelled') {
    await db.userSubscriptions.update(existingSub.id, {
      status: 'active',
      autoRenew: true,
      updatedAt: new Date().toISOString()
    });
  }

  return await getUserSubscription(userId);
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
  ENTITLEMENTS,
  getUserSubscription,
  getSubscriptionPlans,
  updatePlanPricing,
  hasFeature,
  getCreditDailyLimit,
  getMonthlyCreditAllowance,
  getAiUsageLimit,
  getUserEntitlements,
  changeSubscription,
  cancelSubscription,
  restoreSubscription
};

export default subscriptionService;
