import React, { useState } from 'react';
import { Plus, Trash2, Clock, Check, AlertCircle } from 'lucide-react';
import { saveReminder, deleteReminder } from '../../db/syncService';
import { checkDueReminders } from '../../services/reminderScheduler';
import { useAuth } from '../../context/AuthContext';

export default function ReminderManagerModal({ isOpen, onClose, reminders = [], patientId = null, patientName = '' }) {
  const { currentUser } = useAuth();
  const [label, setLabel] = useState('');
  const [time, setTime] = useState('09:00 AM');
  const [type, setType] = useState('medicine');
  const [recurring, setRecurring] = useState('daily');
  const [priority, setPriority] = useState('normal');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!label.trim() || !patientId) return;

    setIsSaving(true);
    try {
      await saveReminder({
        targetUserId: Number(patientId),
        userId: Number(patientId),
        patientId: Number(patientId),
        label: label.trim(),
        title: label.trim(),
        time,
        scheduledAt: time,
        type,
        recurring,
        priority,
        done: false,
        completed: false,
        status: 'pending',
        createdBy: currentUser?.name || 'Caregiver',
        missedCount: 0
      });
      // Trigger scheduler check in case this reminder is due immediately
      checkDueReminders(Number(patientId));
      setLabel('');
      setTime('09:00 AM');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await deleteReminder(id);
  };

  const typeIcons = {
    medicine: '💊',
    water: '💧',
    routine: '🍲',
    appointment: '🩺'
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131D33] rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl border border-slate-200 dark:border-[#243352] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#243352]">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Patient Care & Schedule
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Target Patient: <span className="font-bold text-smriti-teal-600 dark:text-teal-400">{patientName || `#NER-${patientId}`}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl font-bold p-1"
          >
            ✕
          </button>
        </div>

        {/* Existing Reminders List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2.5">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Active Reminders ({reminders.length})
          </h4>
          {reminders.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E293B]/60 border border-slate-200/80 dark:border-[#243352] hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2 bg-white dark:bg-[#25334D] rounded-xl shadow-xs border border-slate-100 dark:border-[#243352]">
                  {typeIcons[r.type] || '🔔'}
                </span>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-sm md:text-base leading-snug">
                    {r.label}
                  </h5>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="font-semibold text-smriti-teal-700 dark:text-teal-400">{r.time}</span>
                    <span>&bull;</span>
                    <span className="capitalize">{r.recurring}</span>
                    <span>&bull;</span>
                    <span className={r.done ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-semibold'}>
                      {r.done ? '✓ Confirmed' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(r.id)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                title="Delete reminder"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add New Reminder Form */}
        <form onSubmit={handleAdd} className="pt-4 border-t border-slate-200 dark:border-[#243352] mt-auto space-y-3">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Add New Reminder
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="e.g. Afternoon BP tablet"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="sm:col-span-2 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-smriti-teal-500"
              required
            />
            <input
              type="text"
              placeholder="e.g. 03:00 PM"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-smriti-teal-500"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-[#2E4166] text-xs font-semibold bg-white dark:bg-[#162238] text-slate-900 dark:text-white"
            >
              <option value="medicine">💊 Medicine</option>
              <option value="water">💧 Hydration / Water</option>
              <option value="routine">🍲 Meal / Routine</option>
              <option value="appointment">🩺 Doctor / Walk</option>
            </select>

            <select
              value={recurring}
              onChange={(e) => setRecurring(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-[#2E4166] text-xs font-semibold bg-white dark:bg-[#162238] text-slate-900 dark:text-white"
            >
              <option value="daily">Daily</option>
              <option value="once">Once</option>
              <option value="weekly">Weekly</option>
            </select>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-[#2E4166] text-xs font-semibold bg-white dark:bg-[#162238] text-slate-900 dark:text-white"
            >
              <option value="normal">Normal Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>

            <button
              type="submit"
              disabled={isSaving || !label.trim()}
              className="bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
