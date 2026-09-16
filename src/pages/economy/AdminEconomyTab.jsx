import React, { useState, useEffect } from 'react';
import { useEconomy } from '../../context/EconomyContext';
import { useLanguage } from '../../context/LanguageContext';
import { economyService } from '../../services/economyService';
import { subscriptionService } from '../../services/subscriptionService';
import { 
  ShieldCheck, 
  TrendingUp, 
  Coins, 
  Users, 
  ShoppingBag, 
  Clock, 
  Check, 
  X, 
  Sliders, 
  RefreshCw, 
  AlertTriangle,
  Award,
  Edit2,
  Plus
} from 'lucide-react';

export default function AdminEconomyTab() {
  const { isCaregiverOrAdmin, currentUser, refreshEconomy } = useEconomy();
  const { t } = useLanguage();

  const [metrics, setMetrics] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [allRewards, setAllRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState({ message: '', type: '' });

  // Manual Adjustment State
  const [adjustUserId, setAdjustUserId] = useState('1'); // Default to Amma (ID: 1) or Priya (ID: 2)
  const [adjustAmount, setAdjustAmount] = useState(50);
  const [adjustReason, setAdjustReason] = useState('Caregiver Encouragement Bonus');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Quick user options for demo convenience
  const demoUsers = [
    { id: '1', name: 'Amma (Patient)' },
    { id: '2', name: 'Priya (Caregiver)' },
  ];

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const bMetrics = await economyService.getBusinessMetrics();
      const pApprovals = await economyService.fetchPendingApprovals();
      const rewards = await economyService.fetchRewardCatalog({ includeInactive: true });
      
      setMetrics(bMetrics);
      setPendingApprovals(pApprovals);
      setAllRewards(rewards);
    } catch (err) {
      console.error('Error loading admin economy data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleReview = async (redemptionId, approved) => {
    try {
      await economyService.reviewRedemption(
        redemptionId, 
        currentUser?.id || 1, 
        approved, 
        approved ? 'Approved by caregiver' : 'Rejected by caregiver'
      );
      setActionStatus({
        message: approved ? 'Reward redemption approved!' : 'Redemption rejected and credits refunded.',
        type: approved ? 'success' : 'info'
      });
      await loadAdminData();
      await refreshEconomy();
    } catch (err) {
      setActionStatus({ message: err.message, type: 'error' });
    }
  };

  const handleAdjustCredits = async (e) => {
    e.preventDefault();
    if (!adjustReason.trim()) {
      setActionStatus({ message: 'A valid audit reason is required for adjustments.', type: 'error' });
      return;
    }

    setIsAdjusting(true);
    try {
      await economyService.adminAdjustCredits(
        currentUser?.id || 2,
        adjustUserId,
        Number(adjustAmount),
        adjustReason.trim()
      );

      setActionStatus({
        message: `Successfully adjusted ${adjustAmount > 0 ? '+' : ''}${adjustAmount} credits for User #${adjustUserId}!`,
        type: 'success'
      });
      await loadAdminData();
      await refreshEconomy();
    } catch (err) {
      setActionStatus({ message: err.message, type: 'error' });
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleToggleRewardActive = async (reward) => {
    try {
      await economyService.updateReward(reward.id, { isActive: !reward.isActive });
      await loadAdminData();
      setActionStatus({
        message: `Reward "${reward.title}" status toggled to ${!reward.isActive ? 'Active' : 'Inactive'}.`,
        type: 'success'
      });
    } catch (err) {
      setActionStatus({ message: err.message, type: 'error' });
    }
  };

  if (!isCaregiverOrAdmin) {
    return (
      <div className="p-8 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200">
          {t('economy.adminRestrictedTitle', 'Caregiver & Admin Access Only')}
        </h3>
        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1 max-w-md mx-auto">
          {t('economy.adminRestrictedDesc', 'This management console is restricted to caregivers and administrators to supervise reward approvals, subscriptions, and economy stability.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Admin Notice Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600 text-white">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              {t('economy.adminHubTitle', 'SmritiCare Business & Economy Governance')}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t('economy.adminHubSubtitle', 'Real-time metrics, plan subscriptions, caregiver reward approvals, and audit log controls.')}
            </p>
          </div>
        </div>
        <button
          onClick={loadAdminData}
          disabled={loading}
          className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t('economy.refresh', 'Refresh')}
        </button>
      </div>

      {actionStatus.message && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
          actionStatus.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
            : actionStatus.type === 'error'
            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
        }`}>
          <span>{actionStatus.message}</span>
          <button onClick={() => setActionStatus({ message: '', type: '' })} className="hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
              {t('economy.circulatingCredits', 'Circulating Credits')}
            </span>
            <Coins className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              💠 {metrics?.totalCreditsCirculating?.toLocaleString() || '0'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Across all active user balances
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
              {t('economy.totalIssued', 'Credits Issued')}
            </span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              +{metrics?.totalEarnedAllTime?.toLocaleString() || '0'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Lifetime healthy engagement
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
              {t('economy.totalRedemptions', 'Redemptions')}
            </span>
            <ShoppingBag className="w-5 h-5 text-purple-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {metrics?.totalRedemptionsCount || '0'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {metrics?.totalSpentAllTime?.toLocaleString() || '0'} credits redeemed
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
              {t('economy.pendingApprovals', 'Pending Approvals')}
            </span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {pendingApprovals.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Awaiting caregiver review
          </p>
        </div>
      </div>

      {/* Subscription Breakdown & Plan Metrics */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          {t('economy.activeSubscriptionBreakdown', 'Active Member Tier Breakdown')}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { plan: 'FREE', label: 'Free Tier', color: 'slate', count: metrics?.planBreakdown?.FREE || 0 },
            { plan: 'CLASSIC', label: 'Classic Tier', color: 'blue', count: metrics?.planBreakdown?.CLASSIC || 0 },
            { plan: 'STANDARD', label: 'Standard Tier', color: 'emerald', count: metrics?.planBreakdown?.STANDARD || 0 },
            { plan: 'PREMIUM', label: 'Premium Tier', color: 'purple', count: metrics?.planBreakdown?.PREMIUM || 0 },
          ].map(item => (
            <div key={item.plan} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {item.label}
              </span>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {item.count} <span className="text-xs font-normal text-slate-500">users</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Caregiver Approvals Queue */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('economy.pendingApprovalsQueue', 'Caregiver Reward Approval Queue')}
            </h3>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
            {pendingApprovals.length} {t('economy.awaiting', 'awaiting')}
          </span>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
            <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            {t('economy.noPendingApprovals', 'All reward claims are up to date! No orders require caregiver approval.')}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pendingApprovals.map((item) => (
              <div key={item.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    {item.rewardTitle}
                  </h4>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 space-x-2">
                    <span>User #{item.userId}</span>
                    <span>•</span>
                    <span>Cost: 💠 {item.creditsSpent}</span>
                    <span>•</span>
                    <span>{new Date(item.redeemedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleReview(item.id, true)}
                    className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {t('economy.approve', 'Approve')}
                  </button>
                  <button
                    onClick={() => handleReview(item.id, false)}
                    className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    {t('economy.rejectRefund', 'Reject & Refund')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Credit Adjustment & Audit Tool */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          {t('economy.manualAdjustmentTitle', 'Auditable Manual Credit Adjustment')}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Caregivers can credit bonus points or make manual balance corrections. Every adjustment creates an indelible audit entry with reason.
        </p>

        <form onSubmit={handleAdjustCredits} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('economy.targetUser', 'Target Member')}
            </label>
            <select
              value={adjustUserId}
              onChange={(e) => setAdjustUserId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {demoUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name} (ID #{u.id})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('economy.adjustmentAmount', 'Credit Amount (+/-)')}
            </label>
            <input
              type="number"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="+50 or -50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('economy.auditReason', 'Audit Justification Reason')}
            </label>
            <input
              type="text"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="e.g. Completed walking exercise"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isAdjusting}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isAdjusting ? t('economy.recording', 'Recording...') : t('economy.postAdjustment', 'Post Adjustment')}
            </button>
          </div>
        </form>
      </div>

      {/* Catalog & Inventory Supervisor */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('economy.rewardCatalogManager', 'Reward Marketplace Catalog Management')}
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {allRewards.length} items configured
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">{t('economy.item', 'Item')}</th>
                <th className="px-4 py-3">{t('economy.category', 'Category')}</th>
                <th className="px-4 py-3">{t('economy.cost', 'Credit Price')}</th>
                <th className="px-4 py-3">{t('economy.stock', 'Stock')}</th>
                <th className="px-4 py-3">{t('economy.requiresApproval', 'Caregiver Gate')}</th>
                <th className="px-4 py-3">{t('economy.status', 'Status')}</th>
                <th className="px-4 py-3 text-right">{t('economy.action', 'Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {allRewards.map((reward) => (
                <tr key={reward.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                    {reward.title}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 capitalize">
                    {reward.category}
                  </td>
                  <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">
                    💠 {reward.costCredits}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {reward.stockQuantity != null ? reward.stockQuantity : 'Unlimited'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      reward.requiresCaregiverApproval 
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' 
                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    }`}>
                      {reward.requiresCaregiverApproval ? 'Required' : 'Instant'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      reward.isActive 
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {reward.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleToggleRewardActive(reward)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all"
                    >
                      {reward.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
