import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, AlertTriangle, CheckCircle, Trash2, UserX, Flag, Check } from 'lucide-react';
import { communityService } from '../../services/communityService';
import { playCardFlipSound } from '../../audio/synthAudio';

export default function ModeratorModal({ isOpen, onClose, onModerationComplete }) {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadReports();
    }
  }, [isOpen]);

  const loadReports = async () => {
    setIsLoading(true);
    const list = await communityService.getPendingReports();
    setReports(list);
    setIsLoading(false);
  };

  const handleAction = async (reportId, action) => {
    playCardFlipSound();
    await communityService.moderateReport(reportId, action, 'Moderator resolution via dashboard');
    setActionSuccessMsg(`Action recorded: ${action}`);
    await loadReports();
    if (onModerationComplete) onModerationComplete();
    setTimeout(() => setActionSuccessMsg(''), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131D33] rounded-3xl md:rounded-4xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-[#243352] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#243352]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-800 dark:text-amber-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                Community Safety & Moderation Portal
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Protecting vulnerable elders & caregivers from misinformation, scams, and spam
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Action Confirmation Banner */}
        {actionSuccessMsg && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Reports Queue */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            <span>Pending Flagged Items ({reports.length})</span>
            <span>Review Queue</span>
          </div>

          {reports.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-[#1E293B]/60 rounded-2xl border border-dashed border-slate-200 dark:border-[#243352] text-slate-400 dark:text-slate-400 font-medium text-sm">
              ✨ Moderation queue is clean. No active safety violations or unaddressed reports!
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className="p-4 rounded-2xl border-2 border-amber-200 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/30 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800/60">
                    <Flag className="w-3 h-3" />
                    {report.reason}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    Target: {report.target_type.toUpperCase()} ({report.target_id})
                  </span>
                </div>

                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {report.details || 'Community member flagged this content for review.'}
                </p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-700/60 text-xs font-bold">
                  <button
                    onClick={() => handleAction(report.id, 'dismiss')}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E293B] hover:bg-slate-100 dark:hover:bg-[#25334D] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#243352]"
                  >
                    Dismiss Report
                  </button>
                  <button
                    onClick={() => handleAction(report.id, 'remove_content')}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove Content
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-[#243352] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#25334D] text-slate-700 dark:text-slate-200 font-bold text-sm transition-colors"
          >
            Close Portal
          </button>
        </div>
      </div>
    </div>
  );
}
