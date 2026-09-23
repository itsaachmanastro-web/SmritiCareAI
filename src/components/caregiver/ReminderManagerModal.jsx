import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Plus, 
  Trash2, 
  Clock, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Pill, 
  Droplet, 
  Utensils, 
  Stethoscope, 
  Footprints, 
  Brain, 
  Bell,
  Sparkles,
  X
} from 'lucide-react';
import { db } from '../../db/dexie';
import { saveReminder, deleteReminder, toggleReminder } from '../../db/syncService';
import { checkDueReminders } from '../../services/reminderScheduler';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { playMatchSuccessSound, playTokaBambooSound } from '../../audio/synthAudio';

export default function ReminderManagerModal({ 
  isOpen, 
  onClose, 
  targetUserId, 
  patientId, 
  patientName = '', 
  onReminderAdded 
}) {
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  // Robust Target Patient ID Resolution
  const resolvedPatientId = Number(patientId || targetUserId || (currentUser?.role === 'patient' ? currentUser?.id : 1));

  // Live Query patient record for accurate display name
  const patientRecord = useLiveQuery(
    async () => {
      if (!resolvedPatientId) return null;
      return await db.users.get(resolvedPatientId);
    },
    [resolvedPatientId]
  );

  const displayPatientName = patientName && patientName !== 'Patient' && patientName !== 'Loved One'
    ? patientName 
    : (patientRecord?.name || 'Bimala Borah (Amma)');

  // Form State
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('09:00 AM');
  const [category, setCategory] = useState('medicine');
  const [frequency, setFrequency] = useState('daily');
  const [priority, setPriority] = useState('normal');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Live Query active reminders directly from Dexie scoped to target patient
  const activeReminders = useLiveQuery(
    async () => {
      if (!resolvedPatientId) return [];
      const all = await db.reminders.toArray();
      return all.filter(r => 
        Number(r.targetUserId) === resolvedPatientId ||
        Number(r.userId) === resolvedPatientId ||
        Number(r.patientId) === resolvedPatientId
      );
    },
    [resolvedPatientId]
  ) || [];

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Form Submission Handler
  const handleAdd = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage(t('reminders.emptyTitleError') || 'Please enter a reminder.');
      return;
    }

    const trimmedTime = time.trim();
    if (!trimmedTime) {
      setErrorMessage(t('reminders.emptyTimeError') || 'Please select a time.');
      return;
    }

    if (!resolvedPatientId || isNaN(resolvedPatientId)) {
      setErrorMessage('Target patient is required.');
      return;
    }

    setIsSaving(true);
    try {
      const reminderPayload = {
        targetUserId: resolvedPatientId,
        userId: resolvedPatientId,
        patientId: resolvedPatientId,
        title: trimmedTitle,
        label: trimmedTitle,
        time: trimmedTime,
        scheduledAt: trimmedTime,
        dueAt: trimmedTime,
        type: category,
        category: category,
        recurring: frequency,
        frequency: frequency,
        priority: priority,
        done: false,
        completed: false,
        status: 'pending',
        createdBy: currentUser?.name || 'Caregiver',
        missedCount: 0
      };

      const newId = await saveReminder(reminderPayload);

      // Trigger reminder scheduler evaluation
      checkDueReminders(resolvedPatientId);

      // Play success audio
      playMatchSuccessSound();

      // Reset form fields
      setTitle('');
      setTime('09:00 AM');
      setCategory('medicine');
      setFrequency('daily');
      setPriority('normal');

      setSuccessMessage(t('reminders.successAdded') || '✓ Reminder added successfully.');
      if (onReminderAdded) {
        onReminderAdded(newId);
      }

      // Auto-clear success message after 4s
      setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
    } catch (err) {
      console.error('Failed to add reminder:', err);
      setErrorMessage(err.message || (t('reminders.unableToAddError') || 'Unable to add reminder. Please try again.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      playTokaBambooSound();
      await deleteReminder(id);
    } catch (err) {
      console.error('Failed to delete reminder:', err);
    }
  };

  const handleToggle = async (id, currentDone) => {
    try {
      await toggleReminder(id, !currentDone);
    } catch (err) {
      console.error('Failed to toggle reminder:', err);
    }
  };

  const categoryIcons = {
    medicine: '💊',
    appointment: '🩺',
    routine: '🍲',
    water: '💧',
    exercise: '🚶',
    memory: '🧩',
    other: '🔔'
  };

  const categoryBadgeColors = {
    medicine: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    appointment: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    routine: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    water: 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    exercise: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    memory: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    other: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#0E1726] rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl border border-slate-200 dark:border-[#1E2E48] max-h-[92vh] flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1E2E48] shrink-0">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{t('reminders.title') || 'Patient Care & Schedule'}</span>
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
              Target Patient: <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">{displayPatientName}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Existing Reminders List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 my-2 pr-1 min-h-[140px] max-h-[220px]">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('reminders.activeReminders') || 'Active Reminders'} ({activeReminders.length})
            </h4>
            {activeReminders.length > 0 && (
              <span className="text-[11px] text-slate-400">
                {activeReminders.filter(r => r.done || r.completed).length} confirmed
              </span>
            )}
          </div>

          {activeReminders.length === 0 ? (
            <div className="py-6 text-center rounded-2xl bg-slate-50 dark:bg-[#131F33] border border-dashed border-slate-200 dark:border-[#223554] text-slate-400 text-xs">
              <Bell className="w-6 h-6 mx-auto mb-1.5 opacity-40 text-emerald-500" />
              <span>No reminders scheduled for this patient yet. Use the form below to add one.</span>
            </div>
          ) : (
            activeReminders.map((r) => {
              const itemType = (r.category || r.type || 'medicine').toLowerCase();
              const isConfirmed = Boolean(r.done || r.completed);

              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#131F33] border border-slate-200/80 dark:border-[#1E2E48] hover:bg-slate-100/80 dark:hover:bg-[#182740] transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggle(r.id, isConfirmed)}
                      className="text-xl p-2 bg-white dark:bg-[#1A2A44] rounded-xl shadow-xs border border-slate-100 dark:border-[#243756] hover:scale-105 active:scale-95 transition-transform cursor-pointer shrink-0"
                      title="Click to toggle status"
                    >
                      {categoryIcons[itemType] || '🔔'}
                    </button>

                    <div className="min-w-0">
                      <h5 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm leading-snug truncate">
                        {r.title || r.label}
                      </h5>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">{r.time}</span>
                        <span>•</span>
                        <span className="capitalize">{r.frequency || r.recurring || 'Daily'}</span>
                        <span>•</span>
                        <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-semibold border ${categoryBadgeColors[itemType] || categoryBadgeColors.other}`}>
                          {itemType}
                        </span>
                        {r.priority && r.priority !== 'normal' && (
                          <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 capitalize">
                            {r.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => handleToggle(r.id, isConfirmed)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer ${
                        isConfirmed
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:text-emerald-600'
                      }`}
                    >
                      {isConfirmed ? '✓ Confirmed' : 'Pending'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Delete reminder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add New Reminder Form */}
        <form onSubmit={handleAdd} className="pt-3 border-t border-slate-200 dark:border-[#1E2E48] shrink-0 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('reminders.addNewReminder') || 'Add New Reminder'}</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="e.g. Afternoon BP tablet"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="sm:col-span-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-[#283C5C] bg-white dark:bg-[#131F33] text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400"
              required
            />
            <input
              type="text"
              placeholder="09:00 AM"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-[#283C5C] bg-white dark:bg-[#131F33] text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-slate-300 dark:border-[#283C5C] text-xs font-semibold bg-white dark:bg-[#131F33] text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="medicine">💊 Medicine</option>
              <option value="appointment">🩺 Doctor / PHC Visit</option>
              <option value="routine">🍲 Meal / Routine</option>
              <option value="water">💧 Hydration / Water</option>
              <option value="exercise">🚶 Exercise / Walk</option>
              <option value="memory">🧩 Memory Activity</option>
              <option value="other">🔔 Other Task</option>
            </select>

            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-slate-300 dark:border-[#283C5C] text-xs font-semibold bg-white dark:bg-[#131F33] text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="daily">Daily</option>
              <option value="once">Once</option>
              <option value="weekly">Weekly</option>
              <option value="twice_daily">Twice Daily</option>
              <option value="three_times_daily">Three Times Daily</option>
            </select>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-slate-300 dark:border-[#283C5C] text-xs font-semibold bg-white dark:bg-[#131F33] text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="normal">Normal Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving || !title.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>+ Add</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
