import React, { useState } from 'react';
import { X, UserPlus, Heart, MapPin, Hospital, KeyRound, Calendar } from 'lucide-react';
import { db } from '../../db/dexie';
import { queueSyncItem } from '../../db/syncService';
import { useAuth } from '../../context/AuthContext';

export default function AddPatientModal({ isOpen, onClose, onPatientCreated }) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    age: '72',
    relation: 'Mother (Amma)',
    location: 'Titabar, Jorhat, Assam',
    phcCenter: 'Titabar PHC, Jorhat',
    pin: '1234'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Patient name is required');
      return;
    }

    if (formData.pin && !/^\d{4}$/.test(formData.pin)) {
      setError('Patient PIN must be exactly 4 digits');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const now = new Date().toISOString();
      const patientAge = Number(formData.age) || 72;

      let newPatientUserId;

      await db.transaction('rw', [db.users, db.patientProfiles, db.syncQueue], async () => {
        // 1. Create Patient User in db.users
        newPatientUserId = await db.users.add({
          name: formData.name.trim(),
          role: 'patient',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256',
          pin: formData.pin || '1234',
          language: 'as',
          age: patientAge,
          location: formData.location.trim(),
          isDemo: false,
          isVerified: true,
          status: 'active',
          createdByCaregiverId: currentUser?.id || null,
          createdAt: now,
          updatedAt: now
        });

        // 2. Create Patient Profile in db.patientProfiles
        const profileId = await db.patientProfiles.add({
          userId: newPatientUserId,
          isDemo: false,
          name: formData.name.trim(),
          age: patientAge,
          location: formData.location.trim(),
          phcCenter: formData.phcCenter.trim(),
          primaryCaregiver: currentUser?.name || 'Primary Caregiver',
          relation: formData.relation,
          createdAt: now,
          updatedAt: now
        });

        // 3. Queue both entries for sync
        await queueSyncItem('users', newPatientUserId, 'INSERT', {
          id: newPatientUserId,
          name: formData.name.trim(),
          role: 'patient',
          age: patientAge,
          location: formData.location.trim()
        });

        await queueSyncItem('patientProfiles', profileId, 'INSERT', {
          id: profileId,
          userId: newPatientUserId,
          name: formData.name.trim(),
          age: patientAge,
          location: formData.location.trim(),
          phcCenter: formData.phcCenter.trim()
        });

        // 4. If current logged in caregiver has an ID, link them
        if (currentUser?.id) {
          await db.users.update(currentUser.id, {
            linkedPatientId: newPatientUserId,
            updatedAt: now
          });
        }
      });

      if (onPatientCreated) {
        onPatientCreated(newPatientUserId);
      }
      onClose();
    } catch (err) {
      console.error('Failed to create patient profile:', err);
      setError(err.message || 'Failed to persist patient profile in database');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#131D33] rounded-3xl p-6 md:p-8 max-w-lg w-full border border-slate-200 dark:border-[#243352] shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#243352]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-smriti-teal-700 dark:text-teal-300 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Add New Patient Profile
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Directly saved to local Dexie IndexedDB with cloud sync queue
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Elder Full Name *
            </label>
            <div className="relative">
              <Heart className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Ramesh Chandra Borah"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-smriti-teal-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Age *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  min="40"
                  max="120"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-smriti-teal-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Relationship
              </label>
              <select
                name="relation"
                value={formData.relation}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-smriti-teal-500 outline-none"
              >
                <option value="Mother (Amma)">Mother (Amma)</option>
                <option value="Father (Deuta)">Father (Deuta)</option>
                <option value="Grandmother (Aita)">Grandmother (Aita)</option>
                <option value="Grandfather (Koka)">Grandfather (Koka)</option>
                <option value="Spouse">Spouse</option>
                <option value="Other Relative">Other Relative</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Village / Town / Location
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Titabar, Jorhat, Assam"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-smriti-teal-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Primary Health Center (PHC)
            </label>
            <div className="relative">
              <Hospital className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                name="phcCenter"
                value={formData.phcCenter}
                onChange={handleChange}
                placeholder="e.g. Titabar PHC, Jorhat"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-smriti-teal-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              4-Digit Patient PIN (for direct elder login)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                name="pin"
                maxLength="4"
                value={formData.pin}
                onChange={handleChange}
                placeholder="1234"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-smriti-teal-500 outline-none tracking-widest font-mono"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Elderly patients can log in instantly by entering this 4-digit PIN on the PIN login tab.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#243352]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-[#243352] text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white font-bold text-sm shadow-md transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving to IndexedDB...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Save Patient Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
