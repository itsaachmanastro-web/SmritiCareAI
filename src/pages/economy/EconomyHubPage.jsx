import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEconomy } from '../../context/EconomyContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Coins, 
  Sparkles, 
  ShoppingBag, 
  Crown, 
  Clock, 
  Receipt, 
  ShieldCheck, 
  Award,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

import EconomyDashboardTab from './EconomyDashboardTab';
import EarnCreditsTab from './EarnCreditsTab';
import RewardsMarketplaceTab from './RewardsMarketplaceTab';
import MyRewardsTab from './MyRewardsTab';
import SubscriptionsTab from './SubscriptionsTab';
import TransactionHistoryTab from './TransactionHistoryTab';
import AdminEconomyTab from './AdminEconomyTab';

export default function EconomyHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { 
    balance, 
    dailyEarned, 
    dailyLimit, 
    activePlan, 
    isCaregiverOrAdmin 
  } = useEconomy();

  const tabParam = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(tabParam);

  useEffect(() => {
    if (tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const tabs = [
    { id: 'dashboard', label: t('economy.tabOverview', 'Overview'), icon: Coins },
    { id: 'earn', label: t('economy.tabEarn', 'Earn Credits'), icon: Sparkles },
    { id: 'rewards', label: t('economy.tabMarketplace', 'Rewards Store'), icon: ShoppingBag },
    { id: 'my-rewards', label: t('economy.tabMyRewards', 'My Rewards'), icon: Award },
    { id: 'subscriptions', label: t('economy.tabSubscriptions', 'Plans & Tiers'), icon: Crown },
    { id: 'transactions', label: t('economy.tabLedger', 'Credit Ledger'), icon: Receipt },
  ];

  if (isCaregiverOrAdmin) {
    tabs.push({ id: 'admin', label: t('economy.tabAdmin', 'Admin & Business'), icon: ShieldCheck });
  }

  const dailyProgressPercent = Math.min(100, Math.round((dailyEarned / (dailyLimit || 1)) * 100));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Main Hub Top Card / Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-700/50">
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-1/4 -bottom-16 w-48 h-48 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-semibold uppercase tracking-wider text-indigo-200">
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span>{activePlan?.name || 'Free'} {t('economy.tierPlan', 'Tier')}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                {t('economy.hubTitle', 'Smriti Economy & Rewards')}
              </h1>
              <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed">
                {t('economy.hubSubtitle', 'Earn Smriti Credits through daily cognitive workouts, memory milestones, and wellness habits to redeem tangible care packages and digital gifts.')}
              </p>
            </div>

            {/* Live Stats Pill Cards */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              {/* Credit Balance Card */}
              <div className="flex-1 sm:flex-initial min-w-[170px] bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-3 shadow-inner">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-2xl">
                  💠
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider">
                    {t('economy.yourBalance', 'Your Credits')}
                  </p>
                  <p className="text-2xl font-black text-white">
                    {balance.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Today's Cap Card */}
              <div className="flex-1 sm:flex-initial min-w-[170px] bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-3 shadow-inner">
                <div className="w-12 h-12 rounded-2xl bg-emerald-400/20 border border-emerald-300/30 flex items-center justify-center text-emerald-300">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider">
                    {t('economy.dailyEarned', "Today's Limit")}
                  </p>
                  <p className="text-lg font-bold text-white">
                    {dailyEarned} <span className="text-xs font-normal text-indigo-200">/ {dailyLimit} 💠</span>
                  </p>
                  <div className="w-24 bg-white/20 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div 
                      className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${dailyProgressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div className="border-b border-slate-200 dark:border-slate-800">
          <nav className="-mb-px flex space-x-2 sm:space-x-4 overflow-x-auto pb-2 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`group inline-flex items-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content Container */}
        <div className="transition-opacity duration-200">
          {activeTab === 'dashboard' && <EconomyDashboardTab onNavigateTab={handleTabChange} />}
          {activeTab === 'earn' && <EarnCreditsTab onNavigateTab={handleTabChange} />}
          {activeTab === 'rewards' && <RewardsMarketplaceTab onNavigateTab={handleTabChange} />}
          {activeTab === 'my-rewards' && <MyRewardsTab onNavigateTab={handleTabChange} />}
          {activeTab === 'subscriptions' && <SubscriptionsTab />}
          {activeTab === 'transactions' && <TransactionHistoryTab />}
          {activeTab === 'admin' && <AdminEconomyTab />}
        </div>

      </div>
    </div>
  );
}
