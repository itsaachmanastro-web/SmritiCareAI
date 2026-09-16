import React from 'react';
import {
  Coins,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  ShieldCheck,
  Zap,
  TrendingUp,
  Clock,
  ChevronRight,
  Flame,
  Award
} from 'lucide-react';
import { useEconomy } from '../../context/EconomyContext';
import { useLanguage } from '../../context/LanguageContext';

export default function EconomyDashboardTab({ onNavigateTab }) {
  const { balance, lifetimeEarned, lifetimeSpent, dailyProgress, subscription, entitlements, recentTransactions } = useEconomy();
  const { t, formatDate, formatTime } = useLanguage();

  const planName = entitlements?.planName || subscription?.planCode || 'Free / Basic';
  const planCode = entitlements?.planCode || subscription?.planCode || 'FREE';
  const dailyCap = dailyProgress?.dailyLimit || 200;
  const earnedToday = dailyProgress?.earnedToday || 0;
  const capPercent = Math.min(100, Math.round((earnedToday / dailyCap) * 100));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Primary Balance Centerpiece Card (Elder-Friendly) */}
      <div className="bg-gradient-to-br from-teal-900 via-slate-900 to-[#0B1120] text-white rounded-3xl md:rounded-4xl p-6 md:p-8 shadow-xl border border-teal-500/30 relative overflow-hidden">
        {/* Subtle decorative background pattern */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-300 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('economy.rewardCurrencyBadge') || 'Smriti In-App Rewards'}</span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl md:text-5xl font-black text-amber-400">💠</span>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
                {balance.toLocaleString()}
              </h1>
              <span className="text-sm md:text-lg font-bold text-slate-300">
                {t('economy.credits') || 'Smriti Credits'}
              </span>
            </div>

            <p className="text-xs md:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
              {t('economy.noCashDisclaimer') || 'Smriti Credits are in-app reward points earned through cognitive engagement. They have no cash value and cannot be withdrawn or traded.'}
            </p>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto">
            <button
              onClick={() => onNavigateTab('earn')}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-md transition-transform active:scale-95 inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>{t('economy.earnCreditsButton') || 'Earn More Credits'}</span>
            </button>
            <button
              onClick={() => onNavigateTab('marketplace')}
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Gift className="w-4 h-4 text-pink-300" />
              <span>{t('economy.browseRewardsButton') || 'Explore Marketplace'}</span>
            </button>
          </div>
        </div>

        {/* Daily Earning Progress Bar */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>{t('economy.todayAllowance') || 'Today\'s Healthy Engagement Allowance:'}</span>
            </span>
            <span className="text-amber-300 font-mono">
              {earnedToday} / {dailyCap} {t('economy.credits') || 'Credits'} ({capPercent}%)
            </span>
          </div>
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${capPercent}%` }}
            />
          </div>
          {dailyProgress?.isLimitReached && (
            <p className="text-[11px] text-amber-300 mt-1.5 font-semibold">
              ✓ {t('economy.dailyLimitReachedNotice') || 'You have achieved today\'s healthy engagement cap! Rest well and return tomorrow for more credits.'}
            </p>
          )}
        </div>
      </div>

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Active Plan Card */}
        <div className="bg-white dark:bg-[#131D33] p-5 md:p-6 rounded-3xl border border-slate-200 dark:border-[#243352] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('economy.currentMembership') || 'Active Membership'}
            </span>
            <ShieldCheck className="w-5 h-5 text-smriti-teal-600 dark:text-teal-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {planName}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {subscription?.status === 'active' ? '● Active' : '● Free Tier'}
            </span>
            <button
              onClick={() => onNavigateTab('subscriptions')}
              className="text-xs font-bold text-smriti-teal-600 dark:text-teal-400 hover:underline"
            >
              {t('economy.viewPlans') || 'View Plans'} &rarr;
            </button>
          </div>
        </div>

        {/* Lifetime Credits Earned */}
        <div className="bg-white dark:bg-[#131D33] p-5 md:p-6 rounded-3xl border border-slate-200 dark:border-[#243352] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('economy.lifetimeEarned') || 'Total Earned'}
            </span>
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            +{lifetimeEarned.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('economy.fromAppActivities') || 'From cognitive games & daily habits'}
          </p>
        </div>

        {/* Credits Redeemed */}
        <div className="bg-white dark:bg-[#131D33] p-5 md:p-6 rounded-3xl border border-slate-200 dark:border-[#243352] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('economy.creditsSpent') || 'Credits Redeemed'}
            </span>
            <Gift className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
            -{lifetimeSpent.toLocaleString()}
          </p>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t('economy.onCareRewards') || 'On wellness & learning rewards'}
            </span>
            <button
              onClick={() => onNavigateTab('my-rewards')}
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
            >
              {t('economy.myRewards') || 'My Orders'} &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Engagement Streak Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-3xl p-5 md:p-6 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl shadow-sm shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white">
              {t('economy.streakTitle') || 'Healthy Daily Engagement Streak'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {t('economy.streakSubtitle') || 'Engage in at least one cognitive game daily to maintain your streak and earn milestone bonuses.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 self-center sm:self-auto">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <div
              key={day}
              className={`w-8 h-9 rounded-xl flex flex-col items-center justify-center text-xs font-bold border transition-all ${
                day <= 4
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-white dark:bg-[#1E293B] text-slate-400 dark:text-slate-500 border-slate-200 dark:border-[#243352]'
              }`}
            >
              <span className="text-[10px]">D{day}</span>
              <span className="text-[10px]">{day <= 4 ? '✓' : '•'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Ledger Transactions */}
      <div className="bg-white dark:bg-[#131D33] rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-[#243352] shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#243352]">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {t('economy.recentTransactions') || 'Recent Credit Movements'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('economy.ledgerDisclaimer') || 'Every credit earned or spent is recorded permanently on your personal ledger.'}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs font-bold text-smriti-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
          >
            <span>{t('economy.viewFullLedger') || 'View Full Ledger'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            {t('economy.noTransactionsYet') || 'No transactions yet. Complete a cognitive game or challenge to earn your first credits!'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-[#243352] mt-2">
            {recentTransactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'earn'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : tx.type === 'refund'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {tx.type === 'earn' || tx.type === 'refund' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{tx.reason}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {formatDate(tx.timestamp)} &bull; {formatTime(tx.timestamp)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-black font-mono text-sm ${
                      tx.amount > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount} 💠
                  </span>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Bal: {tx.balanceAfter?.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
