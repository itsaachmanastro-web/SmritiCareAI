import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Lock, ArrowRight, ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react';
import { useEntitlements } from '../../hooks/useEntitlements';
import { FEATURE_DEFINITIONS, getRequiredPlanNameForFeature } from '../../services/subscriptionService';

/**
 * FeatureGate Component
 * Wraps routes and UI sections to strictly enforce active plan feature entitlements.
 * If user has access, renders children.
 * If locked, renders a dignified, elder-friendly upgrade prompt with direct subscription navigation.
 */
export default function FeatureGate({
  feature,
  children,
  fallback = null,
  title = null,
  description = null,
  backPath = null,
  compact = false
}) {
  const navigate = useNavigate();
  const { hasFeature, planName, planCode } = useEntitlements();

  const isUnlocked = hasFeature(feature);

  if (isUnlocked) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const featMeta = FEATURE_DEFINITIONS[feature] || {
    name: title || 'Premium Feature',
    description: description || 'This feature requires an active SmritiCare membership upgrade.',
    requiredPlanName: getRequiredPlanNameForFeature(feature)
  };

  const featureTitle = title || featMeta.name;
  const featureDesc = description || featMeta.description;
  const requiredTier = featMeta.requiredPlanName || 'Premium';

  if (compact) {
    return (
      <div className="p-5 rounded-2xl bg-amber-50/90 dark:bg-[#1A2332] border border-amber-300 dark:border-amber-700/60 text-slate-800 dark:text-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                {requiredTier} Tier Required
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Current: <strong>{planName}</strong></span>
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{featureTitle}</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{featureDesc}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/economy?tab=subscriptions')}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <span>Upgrade to {requiredTier}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-lg w-full bg-white dark:bg-[#111A24] border-2 border-amber-300/80 dark:border-amber-600/50 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-5 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* Lock / Crown Badge */}
        <div className="relative z-10">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-white dark:bg-[#111A24] rounded-[22px] flex items-center justify-center">
              <Crown className="w-8 h-8 text-amber-500" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs font-black uppercase tracking-wider mt-4">
            <Lock className="w-3.5 h-3.5" />
            <span>{requiredTier} Tier Required</span>
          </div>
        </div>

        {/* Headline & Description */}
        <div className="space-y-2 relative z-10">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {featureTitle} is Locked
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
            {featureDesc}
          </p>
          <div className="inline-block p-2 rounded-xl bg-slate-100 dark:bg-[#1A2533] border border-slate-200 dark:border-[#28384D] text-xs text-slate-500 dark:text-slate-400 mt-2">
            Your current active plan is <strong className="text-slate-800 dark:text-slate-200">{planName}</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 space-y-2.5 relative z-10">
          <button
            type="button"
            onClick={() => navigate('/economy?tab=subscriptions')}
            className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Sparkles className="w-4 h-4" />
            <span>Upgrade to {requiredTier} Plan</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          {backPath ? (
            <button
              type="button"
              onClick={() => navigate(backPath)}
              className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-[#1A2533] hover:bg-slate-200 dark:hover:bg-[#223042] text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Previous View</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-[#1A2533] hover:bg-slate-200 dark:hover:bg-[#223042] text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
