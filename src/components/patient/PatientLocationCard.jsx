import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, MapPin, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { usePatientLocation } from '../../hooks/usePatientLocation';
import { playPositiveChime } from '../../audio/synthAudio';

export default function PatientLocationCard({ patientId = 1, caregiverName = 'Priya' }) {
  const { t } = useLanguage();
  const [isSharingEnabled, setIsSharingEnabled] = useState(true);
  const { location, permissionState, isAcquiring, error, lastSyncTime, requestCurrentLocation } = usePatientLocation(patientId, isSharingEnabled);

  const handleToggle = () => {
    const nextState = !isSharingEnabled;
    setIsSharingEnabled(nextState);
    if (nextState) {
      playPositiveChime();
      requestCurrentLocation();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white dark:from-[#132220] dark:via-[#0F1C23] dark:to-[#0F1C23] border-2 border-emerald-300/80 dark:border-emerald-800/60 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0 shadow-xs">
            {isSharingEnabled ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 text-[11px] font-black uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{t('location.caregiverSafetyActive') || 'Caregiver Safety Active'}</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug">
              {t('location.helpingKeepSafe', { name: caregiverName }) || ('Helping ' + caregiverName + ' keep you safe')}
            </h3>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
              {t('location.patientSafetyDesc') || 'Your family can see if you take a walk away from home.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          className={'relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ' + (isSharingEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700')}
          role="switch"
          aria-checked={isSharingEnabled}
          title={isSharingEnabled ? 'Turn Off Location Sharing' : 'Turn On Location Sharing'}
        >
          <span
            aria-hidden="true"
            className={'pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ' + (isSharingEnabled ? 'translate-x-6' : 'translate-x-0')}
          />
        </button>
      </div>

      <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
          <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>
            {isSharingEnabled 
              ? (isAcquiring ? (t('location.acquiringSignal') || 'Acquiring GPS...') : (t('location.sharingOn') || 'Location Sharing: ON')) 
              : (t('location.sharingOff') || 'Location Sharing: OFF')}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <Lock className="w-3.5 h-3.5" />
          <span>{t('location.privateEncrypted') || 'Private & Encrypted'}</span>
        </div>
      </div>
    </motion.div>
  );
}
