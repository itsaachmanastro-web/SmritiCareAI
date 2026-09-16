import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import UserAvatar from './UserAvatar';

/**
 * Reusable Confirmation Modal for Safe User / Patient Deletion & Archival.
 */
export default function DeleteUserModal({
  isOpen,
  onClose,
  user,
  currentUser,
  onConfirmDelete,
  isSelf = false
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !user) return null;

  const requiresTyping = isSelf || user.role === 'healthcare';
  const expectedText = isSelf ? 'DELETE' : user.name;
  const isInputValid = !requiresTyping || confirmInput.trim().toLowerCase() === expectedText.trim().toLowerCase();

  const handleConfirm = async () => {
    if (!isInputValid) {
      setErrorMsg(`Please type "${expectedText}" to confirm.`);
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');

    try {
      await onConfirmDelete(user);
      setIsProcessing(false);
      onClose();
    } catch (err) {
      setIsProcessing(false);
      setErrorMsg(err.message || 'Failed to complete user deletion.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-[#131D33] rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 dark:border-[#243352] shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {isSelf ? 'Delete Your Account?' : `Archive Profile: ${user.name}?`}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {isSelf
              ? 'This action will terminate your active session and archive your profile.'
              : `Are you sure you want to remove or archive this user profile from the active registry?`}
          </p>
        </div>

        {/* User Card Preview */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-[#243352] flex items-center gap-3">
          <UserAvatar user={user} size="md" />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
              {user.name}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>#{user.id}</span>
              <span>&bull;</span>
              <span className="capitalize font-semibold text-smriti-teal-700 dark:text-teal-400">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Safety & Compliance Notice */}
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Safe Database & Audit Integrity</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800/90 dark:text-amber-300/90">
            <li>Active login sessions will be immediately revoked.</li>
            <li>Caregiver and patient linkages will be cleanly unassigned.</li>
            <li>Historical game sessions & cognitive scores remain preserved for clinical audit records.</li>
          </ul>
        </div>

        {/* Optional Confirmation Typing for High-Risk Deletions */}
        {requiresTyping && (
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Type <strong className="text-rose-600 dark:text-rose-400">{expectedText}</strong> to confirm:
            </label>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => {
                setConfirmInput(e.target.value);
                setErrorMsg('');
              }}
              placeholder={expectedText}
              className="w-full px-3.5 py-2 rounded-xl text-sm font-semibold border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>
        )}

        {errorMsg && (
          <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
            {errorMsg}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[#243352]">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing || !isInputValid}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Processing...' : (isSelf ? 'Delete Account' : 'Confirm Archive / Delete')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
