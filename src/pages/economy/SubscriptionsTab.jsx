import React, { useState } from 'react';
import {
  Shield,
  Check,
  X,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  Info
} from 'lucide-react';
import { useEconomy } from '../../context/EconomyContext';
import { useLanguage } from '../../context/LanguageContext';
import { isPaymentGatewayConfigured, getPaymentGatewayInfo } from '../../services/paymentService';

export default function SubscriptionsTab() {
  const { entitlements, subscription, plans, changePlan, cancelPlan, refreshEconomy } = useEconomy();
  const { t, formatDate } = useLanguage();

  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [selectedPlanCode, setSelectedPlanCode] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const activePlanCode = entitlements?.planCode || subscription?.planCode || 'FREE';
  const gatewayInfo = getPaymentGatewayInfo();

  const handlePlanAction = async (planCode) => {
    if (planCode === activePlanCode) return;
    setIsProcessing(true);
    setFeedback(null);

    try {
      await changePlan(planCode, billingCycle);
      setFeedback({
        type: 'success',
        text: `Successfully updated your membership plan to ${planCode}!`
      });
      await refreshEconomy();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to update plan'
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your active plan? You will retain access until the end of your billing cycle.')) {
      return;
    }

    setIsProcessing(true);
    setFeedback(null);

    try {
      await cancelPlan();
      setFeedback({
        type: 'info',
        text: 'Your subscription has been cancelled. Auto-renew is turned off.'
      });
      await refreshEconomy();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to cancel plan'
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Billing Toggle */}
      <div className="bg-white dark:bg-[#131D33] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-[#243352] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-bold mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>{t('economy.transparentPlans') || 'Transparent Membership Plans'}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
            {t('economy.subscriptionPlansTitle') || 'Choose the Right Plan for Your Family'}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('economy.subscriptionPlansSub') || 'Ethical dementia-care tools, higher credit allowances, and caregiver visibility with no hidden fees.'}
          </p>
        </div>

        {/* Billing Cycle Switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-[#243352] text-xs font-bold">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-white dark:bg-[#25334D] text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              billingCycle === 'yearly'
                ? 'bg-white dark:bg-[#25334D] text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Annual</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Save 2 Months
            </span>
          </button>
        </div>
      </div>

      {/* Gateway Setup Mode Notice (Principle 8 & 27) */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 text-xs">
        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-900 dark:text-white">
            {gatewayInfo.provider}:
          </span>
          <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
            {gatewayInfo.statusNotice} You can preview plan switching and entitlement updates safely in Sandbox mode with zero real payment charges.
          </p>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold border flex items-center gap-2 animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* 4-Tier Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const isCurrent = plan.code === activePlanCode;
          const isRecommended = plan.code === 'STANDARD';
          const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
          const period = billingCycle === 'yearly' ? '/year' : '/month';

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 border flex flex-col justify-between transition-all relative ${
                isCurrent
                  ? 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-500 ring-2 ring-teal-500/20 shadow-md'
                  : isRecommended
                  ? 'bg-white dark:bg-[#131D33] border-amber-400 dark:border-amber-500 shadow-md'
                  : 'bg-white dark:bg-[#131D33] border-slate-200 dark:border-[#243352] shadow-xs'
              }`}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                    Recommended for Families
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {plan.name}
                  </h3>
                  {isCurrent && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                      Active
                    </span>
                  )}
                </div>

                <div className="my-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">
                      ₹{price.toLocaleString()}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{period}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                {/* Allowance Tag */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-[#243352] text-xs font-bold text-slate-700 dark:text-slate-300 mb-4 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[11px] text-slate-400">Daily Cap:</span>
                    <span>{plan.dailyCreditLimit} Credits/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] text-slate-400">Monthly Bonus:</span>
                    <span className="text-amber-600 dark:text-amber-400">+{plan.monthlyCreditAllowance} 💠</span>
                  </div>
                </div>

                {/* Feature List */}
                <div className="space-y-2 text-xs pt-2 border-t border-slate-100 dark:border-[#243352]">
                  <p className="text-[11px] font-bold uppercase text-slate-400 mb-1">Entitlements:</p>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Basic Cognitive Games</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Medication & Water Reminders</span>
                  </div>

                  <div className={`flex items-center gap-2 ${plan.code !== 'FREE' ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'}`}>
                    {plan.code !== 'FREE' ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                    <span>All Cultural Games & Stages</span>
                  </div>

                  <div className={`flex items-center gap-2 ${plan.code === 'STANDARD' || plan.code === 'PREMIUM' ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'}`}>
                    {plan.code === 'STANDARD' || plan.code === 'PREMIUM' ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                    <span>Caregiver Reports & Telemetry</span>
                  </div>

                  <div className={`flex items-center gap-2 ${plan.code === 'PREMIUM' ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'}`}>
                    {plan.code === 'PREMIUM' ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                    <span>Advanced Voice AI Interaction</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#243352]">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-[#1E293B] text-slate-400 font-bold text-xs cursor-default"
                  >
                    Current Active Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handlePlanAction(plan.code)}
                    disabled={isProcessing}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                      isRecommended
                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                        : 'bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white'
                    }`}
                  >
                    {plan.code === 'FREE' ? 'Downgrade to Free' : 'Switch to Plan'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subscription Management & Cancellation Box (Principle 16) */}
      <div className="bg-white dark:bg-[#131D33] p-6 rounded-3xl border border-slate-200 dark:border-[#243352] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Subscription Management & Transparency
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Active plan: <span className="font-bold text-slate-800 dark:text-slate-200">{activePlanCode}</span>
            {subscription?.renewalDate && ` &bull; Renewal on: ${formatDate(subscription.renewalDate)}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {subscription?.status === 'active' && activePlanCode !== 'FREE' && (
            <button
              onClick={handleCancelSubscription}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-colors"
            >
              Cancel Subscription
            </button>
          )}
        </div>
      </div>

      {/* Medical Disclaimer Banner (Principle 5 & 27) */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1E293B]/60 border border-slate-200 dark:border-[#243352] text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p className="font-bold text-slate-700 dark:text-slate-300">
          Medical & Clinical Disclaimer:
        </p>
        <p className="leading-relaxed text-[11px]">
          Subscription benefits are cognitive wellness tools and supportive companionship features. SmritiCare makes no medical claims that Premium subscriptions prevent, treat, reverse, cure, or clinically alter dementia or Alzheimer\'s disease. All medical therapies must be directed by a licensed medical practitioner.
        </p>
      </div>
    </div>
  );
}
