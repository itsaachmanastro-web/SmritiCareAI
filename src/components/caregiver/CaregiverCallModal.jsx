import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneOff,
  PhoneCall,
  UserCheck,
  ShieldCheck,
  X,
  Volume2,
  Building2,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { playNotificationChime } from '../../audio/synthAudio';

export default function CaregiverCallModal({ isOpen, onClose, patient }) {
  const { t } = useLanguage();
  const [callState, setCallState] = useState('ringing'); // 'ringing' -> 'connected'

  const patientName = patient?.displayName || patient?.name || 'Amma';
  const patientPhone = patient?.phone || '+91 94350 56789';
  const phcCenter = patient?.phcCenter || 'Titabar PHC, Jorhat';

  useEffect(() => {
    if (isOpen) {
      setCallState('ringing');
      try {
        playNotificationChime();
      } catch (e) {}

      const timer = setTimeout(() => {
        setCallState('connected');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          className="bg-white dark:bg-[#0E1719] rounded-3xl p-6 md:p-8 max-w-md w-full text-center shadow-2xl border border-[#ECE7DE] dark:border-[#18292D] relative space-y-5"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Avatar with pulsing halo */}
          <div className="relative w-24 h-24 mx-auto mt-2 flex items-center justify-center">
            {callState === 'ringing' && (
              <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-40 animate-ping" />
            )}
            <div className="w-20 h-20 rounded-full bg-[#143D30] dark:bg-[#122A26] border-3 border-emerald-400 dark:border-[#2DD4BF] text-white flex items-center justify-center text-2xl font-bold shadow-xl relative z-10">
              {patientName.charAt(0).toUpperCase()}
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-serif font-bold text-[#192320] dark:text-white">
              {patientName}
            </h3>
            <p className="text-xs font-semibold text-emerald-700 dark:text-[#2DD4BF] mt-0.5">
              {patient?.relation || 'Loved One (Patient)'}
            </p>
            <p className="text-xs font-mono text-[#6E7D76] dark:text-[#889B95] mt-1 font-medium">
              {patientPhone}
            </p>
          </div>

          {/* Call Status Badge */}
          <div className="py-1">
            {callState === 'ringing' ? (
              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-amber-50 dark:bg-[#251A0E] text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 text-xs font-bold animate-pulse">
                <Phone className="w-4 h-4 text-amber-600 animate-bounce" />
                <span>{t('location.callingPatient') || `Calling ${patientName}...`}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-emerald-50 dark:bg-[#0E2420] text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 text-xs font-bold">
                <UserCheck className="w-4 h-4 text-emerald-600 dark:text-[#2DD4BF]" />
                <span>{t('location.callConnected') || 'Connected · Active Line'}</span>
              </div>
            )}
          </div>

          {/* PHC Center Tag */}
          <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#121E22] border border-[#ECE7DE] dark:border-[#18292D] flex items-center justify-between text-left text-xs">
            <div className="flex items-center gap-2 text-[#6E7D76] dark:text-[#889B95]">
              <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{phcCenter}</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-[#2DD4BF] bg-emerald-50 dark:bg-[#0E2420] px-2 py-0.5 rounded-full">
              PHC Center
            </span>
          </div>

          {/* Action Buttons: Native Tel Link + End Call */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <a
              href={`tel:${patientPhone.replace(/\s+/g, '')}`}
              className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{t('location.directDial') || 'Direct Dial'}</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span>{t('location.endCall') || 'End Call'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
