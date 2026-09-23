import { useMemo } from 'react';
import { useEconomy } from '../context/EconomyContext';
import {
  FEATURE_KEYS,
  PLAN_CODES,
  FEATURE_DEFINITIONS,
  getRequiredPlanForFeature,
  getRequiredPlanNameForFeature,
  canPlanAccessFeature
} from '../services/subscriptionService';

/**
 * useEntitlements hook
 * Provides fast, reactive access to current plan code, active feature permissions,
 * and helper functions to check access or display upgrade requirements.
 */
export function useEntitlements() {
  const {
    activePlan,
    activePlanCode,
    entitlements,
    subscription,
    canAccessFeature,
    canAccessAllGames,
    canAccessReports,
    canAccessVoiceAi,
    changePlan,
    isLoading
  } = useEconomy();

  const planCode = (activePlanCode || 'FREE').toUpperCase();

  const planName = useMemo(() => {
    if (activePlan?.name) return activePlan.name;
    if (planCode === 'CLASSIC') return 'Classic';
    if (planCode === 'STANDARD') return 'Standard';
    if (planCode === 'PREMIUM') return 'Premium';
    return 'Free / Basic';
  }, [activePlan, planCode]);

  return {
    planCode,
    planName,
    activePlan,
    subscription,
    entitlements,
    isLoading,
    // Direct capability booleans
    canAccessAllGames,
    canAccessReports,
    canAccessVoiceAi,
    // Method checks
    hasFeature: canAccessFeature,
    canAccess: canAccessFeature,
    isFeatureLocked: (featKey) => !canAccessFeature(featKey),
    getRequiredPlan: getRequiredPlanForFeature,
    getRequiredPlanName: getRequiredPlanNameForFeature,
    // Constants
    FEATURE_KEYS,
    PLAN_CODES,
    FEATURE_DEFINITIONS,
    changePlan
  };
}

export default useEntitlements;
