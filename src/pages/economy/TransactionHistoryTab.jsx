import React, { useState } from 'react';
import { useEconomy } from '../../context/EconomyContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Filter, 
  Search, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  Download,
  AlertCircle
} from 'lucide-react';

export default function TransactionHistoryTab() {
  const { transactions, balance, loading } = useEconomy();
  const { t } = useLanguage();
  const [filterType, setFilterType] = useState('ALL'); // ALL, EARNED, SPENT, ADJUSTMENT
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = transactions.filter(tx => {
    if (filterType === 'EARNED' && tx.type !== 'EARN') return false;
    if (filterType === 'SPENT' && tx.type !== 'SPEND') return false;
    if (filterType === 'ADJUSTMENT' && tx.type !== 'ADMIN_ADJUST' && tx.type !== 'EXPIRY') return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchDesc = (tx.description || '').toLowerCase().includes(q);
      const matchCat = (tx.category || '').toLowerCase().includes(q);
      const matchRef = (tx.referenceId || '').toLowerCase().includes(q);
      if (!matchDesc && !matchCat && !matchRef) return false;
    }

    return true;
  });

  const totalEarned = transactions
    .filter(tx => tx.type === 'EARN' || (tx.type === 'ADMIN_ADJUST' && tx.amount > 0))
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const totalSpent = transactions
    .filter(tx => tx.type === 'SPEND' || (tx.type === 'ADMIN_ADJUST' && tx.amount < 0))
    .reduce((acc, curr) => acc + Math.abs(curr.amount || 0), 0);

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('economy.currentBalance', 'Current Balance')}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              💠 {balance.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t('economy.smritiCredits', 'Smriti Credits')}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            {t('economy.totalEarnedToDate', 'Total Earned to Date')}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              +{totalEarned.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t('economy.creditsEarned', 'credits earned')}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            {t('economy.totalSpentToDate', 'Total Redeemed')}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
              -{totalSpent.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t('economy.creditsRedeemed', 'credits spent')}
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Type Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {[
            { id: 'ALL', label: t('economy.allTransactions', 'All Ledger') },
            { id: 'EARNED', label: t('economy.earnedFilter', 'Earned (+)') },
            { id: 'SPENT', label: t('economy.spentFilter', 'Redeemed (-)') },
            { id: 'ADJUSTMENT', label: t('economy.adjustmentsFilter', 'Adjustments') },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                filterType === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('economy.searchTransactions', 'Search activities...')}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('economy.ledgerTitle', 'Credit Audit Ledger')}
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {filteredTransactions.length} {t('economy.records', 'records')}
          </span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
            <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
              {t('economy.noTransactionsFound', 'No transactions found')}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {searchTerm 
                ? t('economy.tryDifferentFilter', 'Try adjusting your search or category filter.')
                : t('economy.startEarningMessage', 'Play games or complete daily wellness goals to see your credit ledger grow!')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3">{t('economy.date', 'Date & Time')}</th>
                  <th className="px-6 py-3">{t('economy.activity', 'Activity / Details')}</th>
                  <th className="px-6 py-3">{t('economy.category', 'Category')}</th>
                  <th className="px-6 py-3 text-right">{t('economy.change', 'Change')}</th>
                  <th className="px-6 py-3 text-right">{t('economy.balanceAfter', 'Balance After')}</th>
                  <th className="px-6 py-3 text-center">{t('economy.auditRef', 'Reference')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredTransactions.map((tx) => {
                  const isEarn = tx.type === 'EARN' || (tx.type === 'ADMIN_ADJUST' && tx.amount > 0);
                  return (
                    <tr key={tx.id || tx.timestamp} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(tx.timestamp)}
                      </td>

                      {/* Description */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl flex-shrink-0 ${
                            isEarn 
                              ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                          }`}>
                            {isEarn ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                              {tx.description || t('economy.genericTransaction', 'Activity Reward')}
                            </p>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {isEarn ? t('economy.creditGranted', 'Credit added') : t('economy.creditDeducted', 'Credit redeemed')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {tx.category || 'General'}
                        </span>
                      </td>

                      {/* Amount Change */}
                      <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-sm">
                        <span className={isEarn ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {isEarn ? `+${tx.amount}` : `-${Math.abs(tx.amount)}`} 💠
                        </span>
                      </td>

                      {/* Balance After */}
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-700 dark:text-slate-300 text-sm">
                        {tx.balanceAfter != null ? `${tx.balanceAfter.toLocaleString()} 💠` : '—'}
                      </td>

                      {/* Audit Reference ID */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {tx.referenceId ? tx.referenceId.slice(0, 10) + '...' : `#tx-${tx.id || 'N/A'}`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transparency Note */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-900 dark:text-indigo-200">
          <p className="font-semibold">{t('economy.auditIntegrityNotice', 'Ledger Integrity & Non-Cash Notice')}</p>
          <p className="mt-0.5 opacity-90">
            {t('economy.auditNoticeDetail', 'Every Smriti Credit earned and spent is recorded in this tamper-evident local ledger. Smriti Credits are non-transferable reward points designed solely for elderly encouragement and cannot be redeemed for fiat currency.')}
          </p>
        </div>
      </div>
    </div>
  );
}
