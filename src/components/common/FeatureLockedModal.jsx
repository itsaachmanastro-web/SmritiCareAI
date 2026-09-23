import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Lock, Crown, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useEntitlements } from '../../hooks/useEntitlements';
import { FEATURE_DEFINITIONS, getRequiredPlanNameForFeature } from '../../services/subscriptionService';

/**
 * FeatureLockedModal
 * Modal dialog displayed when a user interacts with a locked feature (e.g. Cultural Game, AI Assistant).
 */
export default function FeatureLockedModal({
  isOpen,
  onClose,
  feature,
  title = null,
  description = null
}) {
  const navigate = useNavigate();
  const { planName, planCode } = useEntitlements();

  if (!isOpen) return null;

  const featMeta = FEATURE_DEFINITIONS[feature] || {
    name: title || 'Premium Feature',
    description: description || 'This feature requires an active SmritiCare membership upgrade.',
    requiredPlanName: getRequiredPlanNameForFeature(feature)
  };

  const featureTitle = title || featMeta.name;
  const featureDesc = description || featMeta.description;
  const requiredTier = featMeta.requiredPlanName || 'Premium';

  const handleUpgrade = () => {
    onClose();
    navigate('/economy?tab=subscriptions');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-[#111A24] border-2 border-amber-300 dark:border-amber-600/50 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center space-y-5"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Badge */}
        <div>
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-md">
            <Crown className="w-7 h-7" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs font-black uppercase tracking-wider mt-3">
            <Lock className="w-3.5 h-3.5" />
            <span>{requiredTier} Tier Required</span>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-1.5">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {featureTitle}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {featureDesc}
          </p>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1A2533] border border-slate-200 dark:border-[#28384D] text-xs text-slate-600 dark:text-slate-300 mt-3 flex justify-between items-center">
            <span>Your Current Plan:</span>
            <span className="font-bold text-slate-900 dark:text-white">{planName}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={handleUpgrade}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Sparkles className="w-4 h-4" />
            <span>Upgrade to {requiredTier} Plan</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}
