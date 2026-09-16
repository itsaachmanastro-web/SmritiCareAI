import React from 'react';
import {
  Gift,
  CheckCircle2,
  Clock,
  KeyRound,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';
import { useEconomy } from '../../context/EconomyContext';
import { useLanguage } from '../../context/LanguageContext';

export default function MyRewardsTab({ onNavigateTab }) {
  const { userRewards } = useEconomy();
  const { t, formatDate, formatTime } = useLanguage();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white dark:bg-[#131D33] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-[#243352] shadow-xs flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-bold mb-2">
            <Gift className="w-3.5 h-3.5" />
            <span>{t('economy.myClaimedRewards') || 'My Claimed Rewards'}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
            {t('economy.orderHistory') || 'Order History & Vouchers'}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('economy.orderHistorySub') || 'Track your redeemed wellness packages, audio files, and digital subscription passes.'}
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('marketplace')}
          className="px-4 py-2.5 rounded-xl bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Browse Rewards</span>
        </button>
      </div>

      {userRewards.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#131D33] rounded-3xl border border-dashed border-slate-200 dark:border-[#243352] text-slate-400 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#1E293B] mx-auto flex items-center justify-center text-slate-400">
            <Gift className="w-6 h-6" />
          </div>
          <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No rewards redeemed yet</p>
          <p className="text-xs max-w-sm mx-auto">
            Use your earned Smriti Credits to claim calming herbal tea, illustrated folk books, or digital wellness passes.
          </p>
          <button
            onClick={() => onNavigateTab('marketplace')}
            className="px-5 py-2.5 rounded-xl bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white font-bold text-xs shadow-xs"
          >
            Explore Rewards Catalog
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {userRewards.map((order) => {
            const isPendingApproval = order.status === 'pending_caregiver_approval';
            const isCompleted = order.status === 'completed';

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-[#131D33] p-5 md:p-6 rounded-3xl border border-slate-200 dark:border-[#243352] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                        : isPendingApproval
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                    }`}
                  >
                    <Gift className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                            : isPendingApproval
                            ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                            : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {isPendingApproval ? 'Pending Caregiver Approval' : order.status}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        #{order.id}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                      {order.rewardTitle}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Redeemed on {formatDate(order.redeemedAt)} at {formatTime(order.redeemedAt)}
                    </p>

                    {order.digitalCode && (
                      <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-[#243352]">
                        <KeyRound className="w-3.5 h-3.5 text-smriti-teal-600 dark:text-teal-400" />
                        <span className="text-[11px] text-slate-500 font-semibold">Voucher Code:</span>
                        <span className="font-mono font-black text-xs text-smriti-teal-700 dark:text-teal-300">
                          {order.digitalCode}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right self-stretch sm:self-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-[#243352] flex sm:flex-col justify-between items-center sm:items-end">
                  <span className="text-xs font-black text-purple-600 dark:text-purple-400 font-mono">
                    -{order.creditCost.toLocaleString()} 💠
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {order.isDigital ? 'Instant Digital Key' : 'Physical Packaging'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
