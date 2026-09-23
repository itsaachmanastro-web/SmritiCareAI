import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  MapPin,
  Lock,
  UserCheck,
  Clock,
  PhoneCall,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Radio,
  Heart
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { usePatientLocation } from '../../hooks/usePatientLocation';
import EmergencyCallModal from '../../components/patient/EmergencyCallModal';
import { playPositiveChime } from '../../audio/synthAudio';

export default function PatientSafetyView() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const [isSharingEnabled, setIsSharingEnabled] = useState(true);
  const [showCallModal, setShowCallModal] = useState(false);
  const [notice, setNotice] = useState('');

  const patientId = currentUser?.id || 1;
  const caregiverName = currentUser?.caregiverName || 'Priya (Family Caregiver)';

  const {
    location,
    permissionState,
    isAcquiring,
    lastSyncTime,
    requestCurrentPosition
  } = usePatientLocation(patientId, isSharingEnabled);

  const handleToggleSharing = () => {
    const nextState = !isSharingEnabled;
    setIsSharingEnabled(nextState);
    try {
      playPositiveChime();
    } catch (e) {}

    setNotice(nextState ? 'Location sharing is active.' : 'Location sharing paused.');
    setTimeout(() => setNotice(''), 3500);
  };

  const formatTime = (ts) => {
    if (!ts) return 'Just now';
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Just now';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-fade-in">
      {/* Back Button */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/patient/home')}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#143D30] dark:text-[#2DD4BF] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.backToHome') || '← Back to Dashboard'}</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-[#0E2420] text-emerald-700 dark:text-[#2DD4BF] border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#192320] dark:text-white">
                {t('location.locationAndSafety') || 'Location & Safety'}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isSharingEnabled
                  ? 'bg-emerald-100 dark:bg-[#0E2420] text-emerald-800 dark:text-[#2DD4BF]'
                  : 'bg-amber-100 dark:bg-[#251A0E] text-amber-800 dark:text-amber-400'
              }`}>
                {isSharingEnabled ? '● Sharing On' : '○ Sharing Paused'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#6E7D76] dark:text-[#889B95] mt-1 font-medium">
              {t('location.safetyDesc') || 'Your location is securely shared with your caregiver to help keep you safe.'}
            </p>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          type="button"
          onClick={handleToggleSharing}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${
            isSharingEnabled
              ? 'bg-[#143D30] hover:bg-[#0E2F25] text-white dark:bg-[#2DD4BF] dark:text-[#091113]'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isSharingEnabled ? (t('location.pauseSharing') || 'Pause Sharing') : (t('location.resumeSharing') || 'Resume Sharing')}
        </button>
      </div>

      {/* Temporary Notice */}
      {notice && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-2xl bg-[#143D30] dark:bg-[#122C27] text-white text-xs font-bold flex items-center gap-2.5 shadow-lg border border-emerald-400/30"
        >
          <CheckCircle2 className="w-4 h-4 text-[#86EFAC]" />
          <span>{notice}</span>
        </motion.div>
      )}

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Card 1: Shared With */}
        <div className="bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-[#2DD4BF]">
            <UserCheck className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('location.sharedWith') || 'Shared With'}
            </span>
          </div>
          <p className="text-lg font-bold text-[#192320] dark:text-white">
            {caregiverName}
          </p>
          <p className="text-xs text-[#6E7D76] dark:text-[#889B95]">
            Authorized Family Caregiver
          </p>
        </div>

        {/* Card 2: Status */}
        <div className="bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-[#2DD4BF]">
            <Radio className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('location.locationStatus') || 'Location Status'}
            </span>
          </div>
          <p className="text-lg font-bold text-emerald-700 dark:text-[#4ADE80]">
            {isSharingEnabled ? (t('location.sharingActive') || 'Active · Live Protected') : (t('location.sharingPaused') || 'Paused')}
          </p>
          <p className="text-xs text-[#6E7D76] dark:text-[#889B95]">
            Continuous background guardian active
          </p>
        </div>

        {/* Card 3: Last Updated */}
        <div className="bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-[#2DD4BF]">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('location.lastUpdated') || 'Last Updated'}
            </span>
          </div>
          <p className="text-lg font-bold text-[#192320] dark:text-white">
            {formatTime(lastSyncTime || location?.timestamp)}
          </p>
          <p className="text-xs text-[#6E7D76] dark:text-[#889B95]">
            Automatically updates as you move
          </p>
        </div>

        {/* Card 4: Privacy & Encryption */}
        <div className="bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-[#2DD4BF]">
            <Lock className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('location.privacy') || 'Privacy & Encryption'}
            </span>
          </div>
          <p className="text-lg font-bold text-[#192320] dark:text-white">
            {t('location.privateEncrypted') || 'Private & Encrypted'}
          </p>
          <p className="text-xs text-[#6E7D76] dark:text-[#889B95]">
            Visible only to your verified caregiver
          </p>
        </div>

      </div>

      {/* Emergency Contact Quick Action */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#FAF8F5] dark:bg-[#121E22] border border-[#ECE7DE] dark:border-[#18292D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900/40">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#192320] dark:text-white">
              {t('location.needHelp') || 'Need help or want to speak with Priya?'}
            </h4>
            <p className="text-xs text-[#6E7D76] dark:text-[#889B95] mt-0.5">
              Press the button to place an immediate call to your caregiver.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCallModal(true)}
          className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap"
        >
          {t('navigation.emergencyCall') || 'Call Caregiver'}
        </button>
      </div>

      {/* Emergency Modal */}
      <EmergencyCallModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
      />
    </div>
  );
}
