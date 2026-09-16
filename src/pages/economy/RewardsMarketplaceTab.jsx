import React, { useState, useEffect } from 'react';
import {
  Gift,
  Search,
  Filter,
  Check,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  X,
  Lock
} from 'lucide-react';
import { useEconomy } from '../../context/EconomyContext';
import { useLanguage } from '../../context/LanguageContext';
import { db } from '../../db/dexie';

const CATEGORIES = [
  'All',
  'Wellness',
  'Books',
  'Memory & Learning',
  'Digital Rewards',
  'Caregiver Resources',
  'Lifestyle',
  'SmritiCare Premium Benefits'
];

export default function RewardsMarketplaceTab({ onNavigateTab }) {
  const { balance, redeemReward, refreshEconomy } = useEconomy();
  const { t } = useLanguage();

  const [rewards, setRewards] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalReward, setActiveModalReward] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redemptionSuccess, setRedemptionSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Load rewards from database
  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      const items = await db.rewards.toArray();
      setRewards(items || []);
    } catch (err) {
      console.warn('Failed to load rewards:', err);
    }
  };

  // Filter rewards
  const filteredRewards = rewards.filter((r) => {
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle redemption confirmation
  const handleConfirmRedeem = async () => {
    if (!activeModalReward) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await redeemReward(activeModalReward.id);
      if (res.success) {
        setRedemptionSuccess(res);
        await loadRewards();
      } else {
        setErrorMessage(res.reason || 'Failed to complete redemption');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error processing redemption');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setActiveModalReward(null);
    setRedemptionSuccess(null);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Marketplace Header & Search */}
      <div className="bg-white dark:bg-[#131D33] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-[#243352] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 text-xs font-bold mb-2">
            <Gift className="w-3.5 h-3.5" />
            <span>{t('economy.rewardsCatalog') || 'Smriti Rewards Marketplace'}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
            {t('economy.redeemCreditsTitle') || 'Spend Your Smriti Credits'}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('economy.redeemCreditsSub') || 'Redeem your earned engagement credits for wholesome wellness goods, memory journals, and digital passes.'}
          </p>
        </div>

        {/* Current Balance Tag */}
        <div className="bg-slate-100 dark:bg-[#1E293B] px-5 py-3 rounded-2xl border border-slate-200 dark:border-[#243352] flex items-center gap-3">
          <span className="text-2xl">💠</span>
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400">
              {t('economy.availableBalance') || 'Your Balance'}
            </span>
            <p className="text-xl font-black text-slate-900 dark:text-white leading-tight">
              {balance.toLocaleString()} <span className="text-xs font-bold text-slate-500">Credits</span>
            </p>
          </div>
        </div>
      </div>

      {/* Search & Category Pills */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Search rewards by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-smriti-teal-500 outline-none"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all border cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-smriti-teal-600 text-white border-smriti-teal-700 shadow-xs'
                  : 'bg-white dark:bg-[#131D33] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#243352] hover:bg-slate-50 dark:hover:bg-[#1E293B]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Rewards Catalog Grid */}
      {filteredRewards.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#131D33] rounded-3xl border border-dashed border-slate-200 dark:border-[#243352] text-slate-400">
          <p className="font-bold text-sm">No rewards match your current filter.</p>
          <p className="text-xs mt-1">Try selecting another category or clearing your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRewards.map((reward) => {
            const canAfford = balance >= reward.creditCost;
            const inStock = reward.inventory > 0;

            return (
              <div
                key={reward.id}
                className="bg-white dark:bg-[#131D33] rounded-3xl border border-slate-200 dark:border-[#243352] shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                {/* Reward Image */}
                <div className="relative h-44 bg-slate-100 dark:bg-[#1E293B] overflow-hidden">
                  <img
                    src={reward.image}
                    alt={reward.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm text-white uppercase tracking-wider">
                      {reward.category}
                    </span>
                  </div>
                  {reward.isDigital && (
                    <div className="absolute top-3 right-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/90 text-white">
                        Digital Delivery
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                      {reward.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-3 leading-relaxed">
                      {reward.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#243352] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Cost</span>
                      <p className="text-lg font-black text-amber-600 dark:text-amber-400 leading-none">
                        {reward.creditCost.toLocaleString()} 💠
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveModalReward(reward)}
                      disabled={!inStock}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                        !inStock
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                          : canAfford
                          ? 'bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white shadow-xs active:scale-95'
                          : 'bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#25334D] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#243352]'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{!inStock ? 'Out of Stock' : canAfford ? 'Redeem' : 'Details'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Redemption Confirmation Modal */}
      {activeModalReward && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#131D33] rounded-3xl md:rounded-4xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-[#243352] space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#243352]">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-smriti-teal-600 dark:text-teal-400" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {redemptionSuccess ? 'Redemption Confirmed!' : 'Confirm Reward Redemption'}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {!redemptionSuccess ? (
              <>
                {/* Reward Summary */}
                <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-[#1E293B]/60 rounded-2xl border border-slate-200 dark:border-[#243352]">
                  <img
                    src={activeModalReward.image}
                    alt={activeModalReward.title}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      {activeModalReward.category}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                      {activeModalReward.title}
                    </h4>
                  </div>
                </div>

                {/* Balance Calculation Breakdown (Principle 10) */}
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span>Current Credit Balance:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {balance.toLocaleString()} 💠
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-rose-600 dark:text-rose-400 font-bold">
                    <span>Reward Credit Cost:</span>
                    <span className="font-mono">-{activeModalReward.creditCost.toLocaleString()} 💠</span>
                  </div>
                  <div className="pt-2 border-t border-amber-200 dark:border-amber-700/60 flex justify-between items-center text-sm font-black text-slate-900 dark:text-white">
                    <span>Balance After Redemption:</span>
                    <span
                      className={`font-mono ${
                        balance >= activeModalReward.creditCost
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {(balance - activeModalReward.creditCost).toLocaleString()} 💠
                    </span>
                  </div>
                </div>

                {balance < activeModalReward.creditCost ? (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-semibold">
                    ⚠️ You need {(activeModalReward.creditCost - balance).toLocaleString()} more credits to redeem this item. Play a memory game today to earn credits!
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Upon confirmation, {activeModalReward.creditCost} credits will be deducted from your ledger. This action cannot be reversed without caregiver or admin approval.
                  </p>
                )}

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-[#243352]">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#243352] text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-[#1E293B]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmRedeem}
                    disabled={isSubmitting || balance < activeModalReward.creditCost}
                    className="px-6 py-2.5 rounded-xl bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Validating & Deducting...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Confirm Redemption</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Success State */
              <div className="text-center py-4 space-y-4 animate-fade-in">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-2xl">
                  ✓
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white">
                    {redemptionSuccess.requiresApproval
                      ? 'Redemption Submitted for Caregiver Approval'
                      : 'Reward Successfully Claimed!'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    {redemptionSuccess.requiresApproval
                      ? 'Because caregiver confirmation is active on your profile, your order has been held for caregiver sign-off.'
                      : 'Your credits have been updated on the ledger. You can review this voucher anytime under My Rewards.'}
                  </p>
                </div>

                {redemptionSuccess.digitalCode && (
                  <div className="p-3.5 bg-slate-100 dark:bg-[#1E293B] rounded-2xl border border-dashed border-teal-500 max-w-xs mx-auto">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Digital Access Code:</span>
                    <p className="text-base font-black font-mono text-smriti-teal-700 dark:text-teal-300 mt-0.5">
                      {redemptionSuccess.digitalCode}
                    </p>
                  </div>
                )}

                <div className="pt-3 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      closeModal();
                      onNavigateTab('my-rewards');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white font-bold text-xs shadow-xs"
                  >
                    View My Rewards
                  </button>
                  <button
                    onClick={closeModal}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1E293B] text-slate-700 dark:text-slate-300 font-bold text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
