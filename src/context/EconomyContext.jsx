import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  getCreditBalance,
  getDailyProgress,
  awardCredits as awardCreditsService,
  redeemReward as redeemRewardService,
  getTransactionHistory,
  getUserRewards
} from '../services/economyService';
import {
  getUserSubscription,
  getUserEntitlements,
  getSubscriptionPlans,
  changeSubscription,
  cancelSubscription as cancelSubService,
  canPlanAccessFeature,
  FEATURE_KEYS,
  PLAN_CODES
} from '../services/subscriptionService';

const EconomyContext = createContext();

export function EconomyProvider({ children }) {
  const { currentUser, role } = useAuth();

  const [balance, setBalance] = useState(0);
  const [lifetimeEarned, setLifetimeEarned] = useState(0);
  const [lifetimeSpent, setLifetimeSpent] = useState(0);
  const [dailyProgress, setDailyProgress] = useState({
    earnedToday: 0,
    dailyLimit: 200,
    remaining: 200,
    isLimitReached: false
  });
  const [subscription, setSubscription] = useState(null);
  const [entitlements, setEntitlements] = useState(null);
  const [plans, setPlans] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [userRewards, setUserRewards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Refresh all economy state for current authenticated user
  const refreshEconomy = useCallback(async () => {
    if (!currentUser?.id) {
      setBalance(0);
      setLifetimeEarned(0);
      setLifetimeSpent(0);
      setDailyProgress({ earnedToday: 0, dailyLimit: 200, remaining: 200, isLimitReached: false });
      setSubscription(null);
      setEntitlements(null);
      setRecentTransactions([]);
      setUserRewards([]);
      setIsLoading(false);
      return;
    }

    try {
      const uid = Number(currentUser.id);
      const [bal, progress, sub, ent, allPlans, txs, rewardsList] = await Promise.all([
        getCreditBalance(uid),
        getDailyProgress(uid),
        getUserSubscription(uid),
        getUserEntitlements(uid),
        getSubscriptionPlans(),
        getTransactionHistory(uid, 'all', 10),
        getUserRewards(uid)
      ]);

      setBalance(bal.balance || 0);
      setLifetimeEarned(bal.lifetimeEarned || 0);
      setLifetimeSpent(bal.lifetimeSpent || 0);
      setDailyProgress(progress);
      setSubscription(sub);
      setEntitlements(ent);
      setPlans(allPlans);
      setRecentTransactions(txs || []);
      setUserRewards(rewardsList || []);
    } catch (err) {
      console.warn('Failed to load user economy state:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    refreshEconomy();
  }, [refreshEconomy]);

  // Reactive subscription listener for instant multi-component updates
  useEffect(() => {
    const handleSubUpdate = (e) => {
      if (!currentUser?.id) return;
      const detailUid = e?.detail?.userId;
      if (!detailUid || Number(detailUid) === Number(currentUser.id)) {
        refreshEconomy();
      }
    };

    window.addEventListener('smriti_subscription_updated', handleSubUpdate);
    return () => window.removeEventListener('smriti_subscription_updated', handleSubUpdate);
  }, [currentUser?.id, refreshEconomy]);

  // Award credits wrapper with state refresh
  const earnCredits = useCallback(async (params) => {
    if (!currentUser?.id) return { success: false, reason: 'User not logged in' };
    const res = await awardCreditsService({
      userId: currentUser.id,
      ...params
    });
    await refreshEconomy();
    return res;
  }, [currentUser?.id, refreshEconomy]);

  // Redeem reward wrapper with state refresh
  const redeemReward = useCallback(async (rewardId) => {
    if (!currentUser?.id) return { success: false, reason: 'User not logged in' };
    const res = await redeemRewardService({
      userId: currentUser.id,
      rewardId
    });
    await refreshEconomy();
    return res;
  }, [currentUser?.id, refreshEconomy]);

  // Plan change wrapper with state refresh
  const changePlan = useCallback(async (planCode, billingCycle = 'monthly') => {
    if (!currentUser?.id) return null;
    const res = await changeSubscription({
      userId: currentUser.id,
      planCode,
      billingCycle
    });
    await refreshEconomy();
    return res;
  }, [currentUser?.id, refreshEconomy]);

  // Cancel subscription wrapper
  const cancelPlan = useCallback(async () => {
    if (!currentUser?.id) return null;
    const res = await cancelSubService(currentUser.id);
    await refreshEconomy();
    return res;
  }, [currentUser?.id, refreshEconomy]);

  const activePlanCode = useMemo(() => {
    return (entitlements?.planCode || subscription?.planCode || 'FREE').toUpperCase();
  }, [entitlements?.planCode, subscription?.planCode]);

  const activePlan = useMemo(() => {
    const code = activePlanCode;
    const p = plans.find(plan => plan.code === code);
    return {
      code,
      name: p?.name || entitlements?.planName || (code === 'FREE' ? 'Free / Basic' : code),
      ...p
    };
  }, [activePlanCode, plans, entitlements?.planName]);

  const canAccessFeature = useCallback((featureKey) => {
    return canPlanAccessFeature(activePlanCode, featureKey);
  }, [activePlanCode]);

  const canAccessAllGames = useMemo(() => {
    return canPlanAccessFeature(activePlanCode, FEATURE_KEYS.ALL_CULTURAL_GAMES);
  }, [activePlanCode]);

  const canAccessReports = useMemo(() => {
    return canPlanAccessFeature(activePlanCode, FEATURE_KEYS.EXPORTABLE_REPORTS);
  }, [activePlanCode]);

  const canAccessVoiceAi = useMemo(() => {
    return canPlanAccessFeature(activePlanCode, FEATURE_KEYS.VOICE_AI);
  }, [activePlanCode]);

  const isCaregiverOrAdmin = role === 'caregiver' || role === 'healthcare' || currentUser?.role === 'admin';

  const value = {
    balance,
    lifetimeEarned,
    lifetimeSpent,
    dailyEarned: dailyProgress.earnedToday || 0,
    dailyLimit: dailyProgress.dailyLimit || 200,
    dailyProgress,
    subscription,
    entitlements,
    activePlan,
    activePlanCode,
    plans,
    recentTransactions,
    userRewards,
    isLoading,
    isCaregiverOrAdmin,
    canAccessFeature,
    canAccessAllGames,
    canAccessReports,
    canAccessVoiceAi,
    refreshEconomy,
    earnCredits,
    redeemReward,
    changePlan,
    cancelPlan
  };

  return (
    <EconomyContext.Provider value={value}>
      {children}
    </EconomyContext.Provider>
  );
}

export function useEconomy() {
  const context = useContext(EconomyContext);
  if (!context) {
    throw new Error('useEconomy must be used within an EconomyProvider');
  }
  return context;
}

