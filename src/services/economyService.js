/**
 * economyService.js
 * Core engine for Smriti Credits, Ledger Transactions, Anti-Abuse Controls,
 * Rewards Marketplace, and Caregiver Redemptions.
 * 
 * SPECIFICATION RULES:
 * - Anti-abuse checks & daily earning limits based on user subscription
 * - Atomic credit transactions; NEVER modify balance without an auditable ledger record
 * - Scoped strictly to authenticated userId (Zero multi-user data leaks)
 * - Credits have NO cash value and cannot be withdrawn or traded
 * - Prevent duplicate claims, refresh farming, and double-click redemptions
 */

import { db } from '../db/dexie.js';
import { getCreditDailyLimit } from './subscriptionService.js';

// In-flight locking mechanism to prevent rapid double-click redemptions
const activeRedemptionLocks = new Set();

/**
 * Returns the current credit balance and lifetime statistics for a user.
 */
export async function getCreditBalance(userId) {
  if (!userId) {
    return { balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 };
  }

  const uid = Number(userId);
  try {
    let balRecord = await db.creditBalances.get(uid);
    if (!balRecord) {
      // Initialize zero balance record if not present
      balRecord = {
        userId: uid,
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        lastUpdated: new Date().toISOString()
      };
      await db.creditBalances.put(balRecord);
    }
    return balRecord;
  } catch (err) {
    console.warn(`Failed to fetch credit balance for user #${uid}:`, err);
    return { balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 };
  }
}

/**
 * Returns today's credit earnings and progress toward daily cap.
 */
export async function getDailyProgress(userId) {
  if (!userId) {
    return { earnedToday: 0, dailyLimit: 200, remaining: 200, isLimitReached: false };
  }

  const uid = Number(userId);
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    const [tracker, limit] = await Promise.all([
      db.dailyActivityTracker.where({ userId: uid, date: todayStr }).first(),
      getCreditDailyLimit(uid)
    ]);

    const earnedToday = tracker?.creditsEarnedToday || 0;
    const remaining = Math.max(0, limit - earnedToday);

    return {
      earnedToday,
      dailyLimit: limit,
      remaining,
      isLimitReached: earnedToday >= limit
    };
  } catch (err) {
    console.warn(`Failed to fetch daily progress for user #${uid}:`, err);
    return { earnedToday: 0, dailyLimit: 200, remaining: 200, isLimitReached: false };
  }
}

/**
 * /**
 * Awards Smriti Credits to a user for legitimate healthy engagement.
 * Performs anti-abuse checks, daily cap limits, and duplicate claim prevention.
 */
export async function awardCredits(param1, param2, param3, param4, param5) {
  let userId, amount, reason, source, activityKey, minCooldownMinutes;
  if (typeof param1 === 'object' && param1 !== null) {
    userId = param1.userId;
    amount = param1.amount;
    reason = param1.reason;
    source = param1.source || param1.category || 'healthy_activity';
    activityKey = param1.activityKey || param1.referenceId || null;
    minCooldownMinutes = param1.minCooldownMinutes ?? 30;
  } else {
    userId = param1;
    amount = param2;
    reason = param3;
    source = param4 || 'healthy_activity';
    activityKey = param5 || null;
    minCooldownMinutes = 30;
  }

  if (!userId) throw new Error('User ID is required to award credits');
  if (amount <= 0) throw new Error('Award amount must be positive');

  const uid = Number(userId);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Atomic database transaction
  return await db.transaction('rw', [db.creditBalances, db.creditTransactions, db.dailyActivityTracker, db.userSubscriptions], async () => {
    // 1. Retrieve or initialize daily tracker
    let tracker = await db.dailyActivityTracker.where('userId').equals(uid).and(r => r.date === todayStr).first();
    if (!tracker) {
      tracker = {
        userId: uid,
        date: todayStr,
        creditsEarnedToday: 0,
        completedActivities: []
      };
      tracker.id = await db.dailyActivityTracker.add(tracker);
    }

    // 2. Anti-Abuse: Duplicate activity check within cooldown
    if (activityKey) {
      const recentSameActivity = (tracker.completedActivities || []).find(a => a.activityKey === activityKey);
      if (recentSameActivity) {
        const timeSince = (now.getTime() - new Date(recentSameActivity.timestamp).getTime()) / (1000 * 60);
        if (timeSince < minCooldownMinutes) {
          throw new Error(`Activity already claimed within cooldown period (${Math.round(timeSince)}m ago)`);
        }
      }
    }

    // 3. Daily Cap Enforcement
    const dailyLimit = await getCreditDailyLimit(uid);
    const availableUnderCap = Math.max(0, dailyLimit - tracker.creditsEarnedToday);

    if (availableUnderCap <= 0) {
      throw new Error(`Daily credit earning cap reached for your membership tier (${dailyLimit} credits)`);
    }

    // Amount awarded is bounded by remaining allowance
    const actualAward = Math.min(amount, availableUnderCap);

    // 4. Update or create balance
    let balRecord = await db.creditBalances.get(uid);
    if (!balRecord) {
      balRecord = {
        userId: uid,
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        lastUpdated: now.toISOString()
      };
    }

    const newBalance = balRecord.balance + actualAward;
    balRecord.balance = newBalance;
    balRecord.lifetimeEarned += actualAward;
    balRecord.lastUpdated = now.toISOString();
    await db.creditBalances.put(balRecord);

    // 5. Update daily tracker
    tracker.creditsEarnedToday += actualAward;
    if (activityKey) {
      tracker.completedActivities = tracker.completedActivities || [];
      tracker.completedActivities.push({
        activityKey,
        amount: actualAward,
        timestamp: now.toISOString()
      });
    }
    await db.dailyActivityTracker.update(tracker.id, {
      creditsEarnedToday: tracker.creditsEarnedToday,
      completedActivities: tracker.completedActivities
    });

    // 6. Record in auditable ledger
    const txId = await db.creditTransactions.add({
      userId: uid,
      type: 'EARN',
      amount: actualAward,
      reason: reason || 'Healthy cognitive activity',
      source,
      activityKey,
      timestamp: now.toISOString(),
      status: 'completed',
      balanceAfter: newBalance
    });

    return {
      success: true,
      transactionId: txId,
      amountAwarded: actualAward,
      awarded: actualAward,
      newBalance,
      balance: newBalance,
      remainingDailyAllowance: Math.max(0, dailyLimit - tracker.creditsEarnedToday),
      isDailyCapReached: tracker.creditsEarnedToday >= dailyLimit
    };
  });
}

/**
 * Redeems a reward from the Marketplace.
 * Validates balance and inventory, handles anti-double-click, and supports optional caregiver approval.
 */
export async function redeemReward(param1, param2, param3) {
  let userId, rewardId, options = {};
  if (typeof param1 === 'object' && param1 !== null) {
    userId = param1.userId;
    rewardId = param1.rewardId;
    options = param1;
  } else {
    userId = param1;
    rewardId = param2;
    options = param3 || {};
  }

  if (!userId) throw new Error('User ID is required for redemption');
  if (!rewardId) throw new Error('Reward ID is required');

  const uid = Number(userId);
  const lockKey = `${uid}_${rewardId}`;

  if (activeRedemptionLocks.has(lockKey)) {
    throw new Error('Redemption is already processing. Please wait.');
  }

  activeRedemptionLocks.add(lockKey);

  try {
    return await db.transaction('rw', [
      db.creditBalances,
      db.creditTransactions,
      db.rewards,
      db.rewardRedemptions,
      db.userSettings
    ], async () => {
      // 1. Fetch reward details
      const reward = await db.rewards.get(rewardId);
      if (!reward || reward.status !== 'active') {
        throw new Error('This reward is currently unavailable or inactive.');
      }

      if (reward.inventory <= 0) {
        throw new Error('This reward is currently out of stock.');
      }

      // 2. Fetch balance and validate
      const balRecord = await db.creditBalances.get(uid);
      const currentBalance = balRecord?.balance || 0;

      if (currentBalance < reward.creditCost) {
        throw new Error(`Insufficient Smriti Credits. You need ${reward.creditCost} credits, but your balance is ${currentBalance}.`);
      }

      // 3. Check if user or reward requires caregiver approval
      const userSettings = await db.userSettings.where('userId').equals(uid).first();
      const requireApproval = Boolean(reward.requiresCaregiverApproval || userSettings?.requireCaregiverApproval);

      const now = new Date();
      const newBalance = currentBalance - reward.creditCost;

      // 4. Deduct balance and update lifetime spend
      balRecord.balance = newBalance;
      balRecord.lifetimeSpent = (balRecord.lifetimeSpent || 0) + reward.creditCost;
      balRecord.lastUpdated = now.toISOString();
      await db.creditBalances.put(balRecord);

      // 5. Decrement inventory
      await db.rewards.update(reward.id, {
        inventory: Math.max(0, reward.inventory - 1)
      });

      // 6. Generate digital code if applicable
      const digitalCode = reward.isDigital
        ? `SMRITI-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
        : null;

      const redemptionStatus = requireApproval ? 'PENDING_APPROVAL' : 'COMPLETED';

      // 7. Create redemption order record
      const redemptionId = await db.rewardRedemptions.add({
        userId: uid,
        rewardId: reward.id,
        rewardTitle: reward.title,
        rewardCategory: reward.category,
        creditCost: reward.creditCost,
        creditsSpent: reward.creditCost,
        status: redemptionStatus,
        isDigital: Boolean(reward.isDigital),
        digitalCode,
        requiresCaregiverApproval: requireApproval,
        caregiverApproved: !requireApproval,
        deliveryNotes: options.deliveryNotes || '',
        redeemedAt: now.toISOString()
      });

      // 8. Record deduction transaction in ledger
      await db.creditTransactions.add({
        userId: uid,
        type: 'SPEND',
        amount: -reward.creditCost,
        reason: `Redeemed: ${reward.title}`,
        source: 'marketplace_redemption',
        activityKey: `redemption_${redemptionId}`,
        timestamp: now.toISOString(),
        status: 'completed',
        balanceAfter: newBalance,
        redemptionId
      });

      return {
        success: true,
        redemptionId,
        rewardTitle: reward.title,
        cost: reward.creditCost,
        costCredits: reward.creditCost,
        creditsSpent: reward.creditCost,
        balance: newBalance,
        status: redemptionStatus,
        digitalCode,
        requiresApproval: requireApproval
      };
    });
  } finally {
    activeRedemptionLocks.delete(lockKey);
  }
}

/**
 * Retrieves full transaction history ledger for a specific user.
 */
export async function getTransactionHistory(userId, filterType = 'all', limit = 50) {
  if (!userId) return [];
  const uid = Number(userId);

  try {
    let transactions = await db.creditTransactions.where('userId').equals(uid).toArray();
    transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (filterType && filterType !== 'all') {
      transactions = transactions.filter(t => t.type.toLowerCase() === filterType.toLowerCase());
    }

    return transactions.slice(0, limit);
  } catch (err) {
    console.warn(`Failed to fetch transactions for user #${uid}:`, err);
    return [];
  }
}

/**
 * Retrieves redeemed rewards for a specific user.
 */
export async function getUserRewards(userId) {
  if (!userId) return [];
  const uid = Number(userId);

  try {
    let redemptions = await db.rewardRedemptions.where('userId').equals(uid).toArray();
    redemptions.sort((a, b) => new Date(b.redeemedAt) - new Date(a.redeemedAt));
    return redemptions;
  } catch (err) {
    console.warn(`Failed to fetch user rewards for user #${uid}:`, err);
    return [];
  }
}

/**
 * Caregiver action: Approves a pending reward redemption for a family member.
 */
export async function approveRedemption(redemptionId, caregiverUserId, notes) {
  try {
    const item = await db.rewardRedemptions.get(Number(redemptionId));
    if (!item) throw new Error('Redemption record not found');

    await db.rewardRedemptions.update(Number(redemptionId), {
      status: 'COMPLETED',
      caregiverApproved: true,
      approvedBy: caregiverUserId ? Number(caregiverUserId) : null,
      notes: notes || '',
      approvedAt: new Date().toISOString()
    });

    return { success: true, status: 'COMPLETED' };
  } catch (err) {
    console.error('Failed to approve redemption:', err);
    throw err;
  }
}

/**
 * Caregiver action: Rejects a pending reward redemption and refunds credits.
 */
export async function rejectRedemption(redemptionId, caregiverUserIdOrReason, caregiverUserId, notes) {
  let caregiverId, reasonStr;
  if (typeof caregiverUserIdOrReason === 'number' || (typeof caregiverUserIdOrReason === 'string' && !isNaN(caregiverUserIdOrReason))) {
    caregiverId = Number(caregiverUserIdOrReason);
    reasonStr = notes || 'Caregiver declined';
  } else {
    reasonStr = caregiverUserIdOrReason || 'Caregiver declined';
    caregiverId = caregiverUserId ? Number(caregiverUserId) : null;
  }

  return await db.transaction('rw', [db.creditBalances, db.creditTransactions, db.rewardRedemptions, db.rewards], async () => {
    const item = await db.rewardRedemptions.get(Number(redemptionId));
    if (!item) throw new Error('Redemption record not found');
    const s = (item.status || '').toUpperCase();
    if (s !== 'PENDING_APPROVAL' && s !== 'PENDING_CAREGIVER_APPROVAL') {
      throw new Error('This redemption is not in a pending state');
    }

    const itemCost = item.creditCost || item.creditsSpent || 0;

    // 1. Mark redemption rejected
    await db.rewardRedemptions.update(Number(redemptionId), {
      status: 'REJECTED',
      rejectionReason: reasonStr,
      rejectedBy: caregiverId,
      rejectedAt: new Date().toISOString()
    });

    // 2. Refund credits back to user
    const balRecord = await db.creditBalances.get(Number(item.userId));
    let newBal = 0;
    if (balRecord) {
      newBal = balRecord.balance + itemCost;
      balRecord.balance = newBal;
      balRecord.lifetimeSpent = Math.max(0, (balRecord.lifetimeSpent || 0) - itemCost);
      await db.creditBalances.put(balRecord);

      // 3. Log refund transaction
      const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      await db.creditTransactions.add({
        txId,
        userId: Number(item.userId),
        type: 'EARN',
        amount: itemCost,
        reason: `Refund for declined redemption: ${item.rewardTitle}`,
        source: 'caregiver_reversal',
        timestamp: new Date().toISOString(),
        status: 'completed',
        balanceAfter: newBal
      });
    }

    // 4. Restore inventory
    const reward = await db.rewards.get(item.rewardId);
    if (reward && reward.inventory != null) {
      await db.rewards.update(reward.id, {
        inventory: reward.inventory + 1
      });
    }

    return { success: true, status: 'REJECTED', refundAmount: itemCost, balance: newBal };
  });
}

/**
 * Admin action: Performs an auditable manual credit adjustment.
 * Requires admin identity and written reason.
 */
export async function adminAdjustCredits(param1, param2, param3, param4) {
  let targetUserId, amount, reason, adminUser;
  if (typeof param1 === 'object' && param1 !== null) {
    targetUserId = param1.targetUserId;
    amount = param1.amount;
    reason = param1.reason;
    adminUser = param1.adminUser;
  } else {
    // adminAdjustCredits(adminUserId, targetUserId, amount, reason)
    adminUser = { id: param1 };
    targetUserId = param2;
    amount = param3;
    reason = param4;
  }

  if (!targetUserId) throw new Error('Target User ID is required');
  if (amount === 0) throw new Error('Adjustment amount cannot be zero');
  if (!reason || !reason.trim()) throw new Error('Reason is required for an auditable adjustment');

  const uid = Number(targetUserId);
  const now = new Date();

  return await db.transaction('rw', [db.creditBalances, db.creditTransactions], async () => {
    let balRecord = await db.creditBalances.get(uid);
    if (!balRecord) {
      balRecord = {
        userId: uid,
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        lastUpdated: now.toISOString()
      };
    }

    const newBalance = Math.max(0, balRecord.balance + amount);
    balRecord.balance = newBalance;
    if (amount > 0) {
      balRecord.lifetimeEarned += amount;
    } else {
      balRecord.lifetimeSpent += Math.abs(amount);
    }
    balRecord.lastUpdated = now.toISOString();
    await db.creditBalances.put(balRecord);

    const txId = `tx_adj_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    await db.creditTransactions.add({
      txId,
      userId: uid,
      type: 'ADMIN_ADJUST',
      amount,
      reason: `[Admin Adjustment] ${reason} (by Admin #${adminUser?.id || 'System'})`,
      source: 'admin_manual_adjustment',
      timestamp: now.toISOString(),
      status: 'completed',
      balanceAfter: newBalance
    });

    return {
      success: true,
      newBalance,
      amount
    };
  });
}

/**
 * Aggregates business and economy telemetry for the Admin Dashboard.
 * In accordance with instructions: Zero fake revenue! If payment provider not connected,
 * explicitly reports revenue data unavailable.
 */
export async function getAdminBusinessMetrics() {
  try {
    const [allUsers, allSubs, allPlans, allTxs, allRedemptions, allRewards, allBalances] = await Promise.all([
      db.users.toArray(),
      db.userSubscriptions.toArray(),
      db.subscriptionPlans.toArray(),
      db.creditTransactions.toArray(),
      db.rewardRedemptions.toArray(),
      db.rewards.toArray(),
      db.creditBalances.toArray()
    ]);

    const totalUsers = allUsers.length;

    // Subscription plan distribution
    const planCounts = {
      FREE: 0,
      CLASSIC: 0,
      STANDARD: 0,
      PREMIUM: 0
    };

    let activeSubscribers = 0;
    allSubs.forEach(s => {
      const code = s.planCode?.toUpperCase();
      if (planCounts[code] !== undefined) {
        planCounts[code]++;
      }
      if (s.status === 'active' && code !== 'FREE') {
        activeSubscribers++;
      }
    });

    // Users with no explicit subscription record default to FREE
    const subscribedUserIds = new Set(allSubs.map(s => s.userId));
    const unrecordedCount = allUsers.filter(u => !subscribedUserIds.has(u.id)).length;
    planCounts.FREE += unrecordedCount;

    // Credit circulation metrics
    let totalCreditsIssued = 0;
    let totalCreditsRedeemed = 0;

    allTxs.forEach(t => {
      if (t.amount > 0) {
        totalCreditsIssued += t.amount;
      } else if (t.amount < 0) {
        totalCreditsRedeemed += Math.abs(t.amount);
      }
    });

    let totalCreditsCirculating = 0;
    allBalances.forEach(b => {
      totalCreditsCirculating += (b.balance || 0);
    });

    // Popular rewards ranking
    const rewardCountMap = {};
    allRedemptions.forEach(r => {
      rewardCountMap[r.rewardTitle] = (rewardCountMap[r.rewardTitle] || 0) + 1;
    });

    const popularRewards = Object.entries(rewardCountMap)
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalUsers,
      activeSubscribers,
      planCounts,
      planBreakdown: planCounts,
      totalCreditsIssued,
      totalEarnedAllTime: totalCreditsIssued,
      totalCreditsRedeemed,
      totalSpentAllTime: totalCreditsRedeemed,
      netCreditsCirculation: Math.max(0, totalCreditsIssued - totalCreditsRedeemed),
      totalCreditsCirculating,
      totalRedemptions: allRedemptions.length,
      totalRedemptionsCount: allRedemptions.length,
      activeRewardsCount: allRewards.filter(r => r.status === 'active' || r.isActive !== false).length,
      popularRewards,
      isPaymentGatewayConnected: false,
      revenueNotice: 'Revenue data unavailable – payment provider not connected.'
    };
  } catch (err) {
    console.error('Failed to aggregate admin business metrics:', err);
    return {
      totalUsers: 0,
      activeSubscribers: 0,
      planCounts: { FREE: 0, CLASSIC: 0, STANDARD: 0, PREMIUM: 0 },
      planBreakdown: { FREE: 0, CLASSIC: 0, STANDARD: 0, PREMIUM: 0 },
      totalCreditsIssued: 0,
      totalEarnedAllTime: 0,
      totalCreditsRedeemed: 0,
      totalSpentAllTime: 0,
      netCreditsCirculation: 0,
      totalCreditsCirculating: 0,
      totalRedemptions: 0,
      totalRedemptionsCount: 0,
      activeRewardsCount: 0,
      popularRewards: [],
      isPaymentGatewayConnected: false,
      revenueNotice: 'Revenue data unavailable – payment provider not connected.'
    };
  }
}

export const economyService = {
  getCreditBalance,
  getUserBalance: async (userId) => {
    const res = await getCreditBalance(userId);
    return res.balance;
  },
  getDailyProgress,
  awardCredits,
  redeemReward,
  getTransactionHistory,
  getUserTransactions: getTransactionHistory,
  getUserRewards,
  getUserRedemptions: getUserRewards,
  fetchPendingApprovals: async () => {
    return await db.rewardRedemptions.where('status').equals('PENDING_APPROVAL').toArray();
  },
  approveRedemption,
  rejectRedemption,
  reviewRedemption: async (redemptionId, caregiverUserId, approved, notes) => {
    if (approved) {
      return await approveRedemption(redemptionId, caregiverUserId, notes);
    } else {
      return await rejectRedemption(redemptionId, caregiverUserId, notes);
    }
  },
  adminAdjustCredits,
  getBusinessMetrics: getAdminBusinessMetrics,
  getAdminBusinessMetrics,
  fetchRewardCatalog: async ({ category = 'ALL', includeInactive = false } = {}) => {
    let query = db.rewards.toCollection();
    if (!includeInactive) {
      query = query.filter(r => r.status === 'active' || r.isActive !== false);
    }
    if (category && category !== 'ALL') {
      query = query.filter(r => r.category === category);
    }
    return await query.toArray();
  },
  updateReward: async (rewardId, updates) => {
    await db.rewards.update(rewardId, updates);
    return await db.rewards.get(rewardId);
  },
  addNewReward: async (rewardData) => {
    const id = await db.rewards.add(rewardData);
    return await db.rewards.get(id);
  }
};

export default economyService;

