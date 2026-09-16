import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, UserCheck, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ElderButton from '../common/ElderButton';
import UserAvatar from '../common/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { db } from '../../db/dexie';

export default function EmergencyCallModal({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [callState, setCallState] = useState('ringing'); // 'ringing' -> 'connected'
  const [caregiver, setCaregiver] = useState(null);

  useEffect(() => {
    async function loadCaregiver() {
      try {
        const cg = await db.users.where('role').equals('caregiver').first();
        if (cg) setCaregiver(cg);
      } catch (err) {
        console.warn('Caregiver lookup error:', err);
      }
    }
    loadCaregiver();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCallState('ringing');
      const timer = setTimeout(() => {
        setCallState('connected');
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-[#131D33] rounded-3xl md:rounded-4xl p-8 max-w-lg w-full text-center shadow-2xl border-4 border-rose-300 dark:border-rose-800/80"
        >
          {/* Animated Avatar / Ringing Indicator */}
          <div className="relative w-32 h-32 mx-auto mb-6 flex items-center justify-center">
            {callState === 'ringing' && (
              <span className="absolute inset-0 rounded-full bg-rose-400 opacity-40 animate-ping"></span>
            )}
            <UserAvatar
              user={caregiver || { name: 'Priya Borah', role: 'caregiver' }}
              size="2xl"
              className="border-4 border-rose-500 shadow-xl relative z-10"
            />
          </div>

          <h3 className="text-3xl font-black text-slate-800 dark:text-white font-display">
            {caregiver?.name || t('dashboard.caregiverConnected')}
          </h3>
          <p className="text-xl font-bold text-smriti-teal-700 dark:text-teal-400 mt-1">
            {caregiver?.relation || t('profile.relation')}
          </p>
          <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg mt-1">
            {caregiver?.phone || '+91 94350 12345'} &bull; {caregiver?.location || 'Assam, India'}
          </p>

          {/* Call Status Badge */}
          <div className="my-6">
            {callState === 'ringing' ? (
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-amber-50 dark:bg-[#1E293B] text-amber-900 dark:text-amber-200 border-2 border-amber-300 dark:border-amber-700 font-extrabold text-xl animate-pulse">
                <Phone className="w-6 h-6 text-amber-600 animate-bounce" />
                <span>{t('modals.callingRinging')}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-emerald-50 dark:bg-[#1E293B] text-emerald-900 dark:text-emerald-200 border-2 border-emerald-300 dark:border-emerald-700 font-extrabold text-xl">
                <UserCheck className="w-6 h-6 text-emerald-600" />
                <span>{t('modals.callConnected')}</span>
              </div>
            )}
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-lg mb-8 font-medium">
            {t('modals.locationSharedNotice')}
          </p>

          <ElderButton
            variant="danger"
            size="lg"
            icon={PhoneOff}
            fullWidth
            onClick={onClose}
          >
            {t('modals.endCall')}
          </ElderButton>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
