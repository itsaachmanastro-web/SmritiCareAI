import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { Gamepad2, Bell, Sparkles, PhoneCall, Heart, Sun, CloudSun, Moon, MapPin, CheckCircle2, ArrowRight, ShieldCheck, Users, Mic, Coins, Award, Play, Brain } from 'lucide-react';
import VoicePromptCard from '../../components/common/VoicePromptCard';
import EmergencyCallModal from '../../components/patient/EmergencyCallModal';
import UserAvatar from '../../components/common/UserAvatar';
import ElderButton from '../../components/common/ElderButton';
import { db } from '../../db/dexie';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAssistant } from '../../context/AssistantContext';
import { useEconomy } from '../../context/EconomyContext';
import { getTodaysChallenge } from '../../services/games';

export default function PatientHome() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { openAssistant } = useAssistant();
  const { balance, dailyEarned, dailyLimit } = useEconomy();
  const [showCallModal, setShowCallModal] = useState(false);
  const [todaysChallenge, setTodaysChallenge] = useState(null);

  // Live queries from Dexie for dynamic badges scoped to current authenticated user
  const currentUserId = currentUser?.id;
  const reminders = useLiveQuery(
    () => currentUserId ? db.reminders.where('userId').equals(currentUserId).toArray() : [],
    [currentUserId]
  ) || [];
  const sessions = useLiveQuery(
    () => currentUserId ? db.gameSessions.where('userId').equals(currentUserId).toArray() : [],
    [currentUserId]
  ) || [];

  const completedRemindersCount = reminders.filter((r) => r.done).length;
  const totalStars = sessions.reduce((acc, s) => acc + (s.score >= 80 ? 3 : s.score >= 60 ? 2 : 1), 0);

  // Load today's personalized adaptive cognitive challenge
  useEffect(() => {
    async function loadChallenge() {
      try {
        const challenge = await getTodaysChallenge(currentUserId || 1);
        setTodaysChallenge(challenge);
      } catch (err) {
        console.warn('Could not load todaysChallenge:', err);
      }
    }
    loadChallenge();
  }, [currentUserId]);

  // Time-aware greeting
  const hour = new Date().getHours();
  const greetingKey = hour < 12 ? 'dashboard.goodMorning' : hour < 17 ? 'dashboard.goodAfternoon' : 'dashboard.goodEvening';
  const GreetingIcon = hour < 12 ? Sun : hour < 17 ? CloudSun : Moon;

  const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : 'there';
  const welcomeText = t('dashboard.welcome', { name: firstName });

  const tiles = [
    {
      id: 'games',
      title: t('dashboard.playGameTile'),
      subtitle: t('dashboard.playGameSub'),
      badge: t('dashboard.fourGamesReady'),
      emoji: '🎯',
      color: 'from-smriti-teal-600 via-teal-600 to-teal-700',
      border: 'border-teal-900',
      shadow: 'shadow-elder',
      action: () => navigate('/patient/games')
    },
    {
      id: 'reminders',
      title: t('dashboard.remindersTile'),
      subtitle: t('dashboard.remindersSub'),
      badge: t('dashboard.remindersProgressBadge', { done: completedRemindersCount, total: reminders.length }),
      emoji: '🔔',
      color: 'from-smriti-orange-500 via-orange-500 to-orange-600',
      border: 'border-orange-900',
      shadow: 'shadow-elder-orange',
      action: () => navigate('/patient/reminders')
    },
    {
      id: 'progress',
      title: t('dashboard.progressTile'),
      subtitle: t('dashboard.progressSub'),
      badge: t('dashboard.starsEarnedBadge', { count: totalStars }),
      emoji: '🌟',
      color: 'from-amber-500 via-amber-500 to-amber-600',
      border: 'border-amber-900',
      shadow: 'shadow-elder-orange',
      action: () => navigate('/patient/progress')
    },
    {
      id: 'call',
      title: t('dashboard.callCaregiverTile'),
      subtitle: t('dashboard.callCaregiverSub'),
      badge: t('dashboard.callCaregiverSub'),
      emoji: '📞',
      color: 'from-rose-600 via-rose-600 to-rose-700',
      border: 'border-rose-950',
      shadow: 'shadow-elder',
      action: () => setShowCallModal(true)
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-8">
      {/* 1. PERSONALIZED WELCOME BANNER (Redesigned) */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-white via-[#FFFBF6] to-teal-50/30 dark:from-[#131D33] dark:via-[#131D33]/95 dark:to-[#1E293B]/70 rounded-4xl p-6 md:p-9 border-2 border-slate-200/90 dark:border-[#243352] shadow-healthcare"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 text-center sm:text-left">
            {/* Avatar with status aura */}
            <div className="relative flex-shrink-0">
              <UserAvatar
                user={currentUser}
                size="xl"
                shape="rounded-3xl"
                className="border-4 border-smriti-teal-500 shadow-md"
              />
              <span className="absolute -bottom-2 -right-2 text-2xl bg-white dark:bg-[#1E293B] p-1 rounded-2xl shadow-sm border border-slate-100 dark:border-[#243352]">
                ☀️
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-black uppercase tracking-wider">
                  <GreetingIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{t(greetingKey)}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#1E293B] px-3 py-1 rounded-full border border-slate-200/50 dark:border-[#243352]">
                  <MapPin className="w-3 h-3 text-smriti-orange-600" />
                  <span>{currentUser?.location || 'Assam, India'}</span>
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white font-display tracking-tight leading-tight">
                {welcomeText} ☀️
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-base md:text-lg font-medium mt-1">
                {t('dashboard.peacefulWish')}
              </p>
            </div>
          </div>

          {/* Quick Caregiver Connection Pill */}
          <div className="flex flex-col items-center sm:items-end gap-2">
            <div className="bg-emerald-50 dark:bg-[#1E293B] border border-emerald-300 dark:border-emerald-800/80 px-4 py-2 rounded-2xl flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-bold text-sm shadow-xs">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>{currentUser?.caregiverName || (currentUser?.isDemo ? t('dashboard.priyaConnected') : t('dashboard.caregiverConnected'))}</span>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              {t('dashboard.carePlanActive', { center: currentUser?.phcCenter || 'Titabar PHC' })}
            </span>
          </div>
        </div>

        {/* Dynamic Voice Assistant Speech Bubble */}
        <VoicePromptCard
          className="mt-6"
          text={`${t(greetingKey)}, ${firstName}! ${t('dashboard.peacefulWish')}`}
          subtext={t('dashboard.promptListenAloud')}
          autoSpeak={false}
        />
      </motion.div>

      {/* TODAY'S ADAPTIVE COGNITIVE CHALLENGE */}
      {todaysChallenge && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#131D33] rounded-4xl p-6 md:p-8 border-2 border-amber-300/80 dark:border-amber-700/60 shadow-lg relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-3xl shadow-xs flex-shrink-0">
                🎯
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                  <span className="text-xs font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    {t('games.adaptive.todaysChallenge') || "Today's Cognitive Challenge"}
                  </span>
                  <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-smriti-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    {t('games.level')}: {todaysChallenge.discreteLevel}
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#243352]">
                    {t('games.adaptive.badge') || "Adaptive"}
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-display">
                  {t(todaysChallenge.titleKey) || todaysChallenge.defaultTitle}
                </h3>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  {todaysChallenge.domainName} • Personalized for your morning routine
                </p>
              </div>
            </div>

            <ElderButton
              variant="orange"
              size="lg"
              icon={Play}
              onClick={() => navigate(todaysChallenge.path)}
            >
              {t('games.adaptive.startPractice') || 'Start Daily Practice'}
            </ElderButton>
          </div>
        </motion.div>
      )}

      {/* VOICE-FIRST SMRITICARE ASSISTANT HERO CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 text-white rounded-4xl p-6 md:p-8 shadow-2xl border-4 border-teal-300/40 relative overflow-hidden flex flex-col items-center text-center"
      >
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">🌸</span>
          <span className="text-xs md:text-sm font-black uppercase tracking-widest text-teal-200">
            {t('navigation.assistant')}
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
          "{t('assistant.askAnything')}"
        </h2>
        <p className="text-teal-100 text-sm md:text-base font-medium max-w-md mb-6">
          {t('assistant.subtitle')}
        </p>

        {/* Big 80px Microphone Button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => openAssistant()}
          className="w-22 h-22 md:w-26 md:h-26 rounded-full bg-white text-smriti-teal-700 hover:text-smriti-teal-800 flex items-center justify-center shadow-2xl ring-8 ring-white/20 transition-all cursor-pointer relative group select-none"
          aria-label={t('assistant.pressToSpeak')}
        >
          <span className="absolute -top-1 -right-1 flex h-6 w-6">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-6 w-6 bg-amber-400 items-center justify-center text-[11px] text-amber-950 font-black">
              AI
            </span>
          </span>
          <Mic className="w-10 h-10 md:w-12 md:h-12 group-hover:scale-110 transition-transform text-teal-700" />
        </motion.button>

        <span className="mt-4 text-sm md:text-base font-black text-white tracking-wide">
          {t('assistant.pressToSpeak')}
        </span>
      </motion.div>

      {/* 2. FOUR HERO ACTION TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
        {tiles.map((tile) => (
          <motion.button
            key={tile.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={tile.action}
            className={`
              relative p-6 md:p-8 rounded-4xl text-left text-white shadow-xl cursor-pointer
              bg-gradient-to-br ${tile.color} border-b-8 ${tile.border} select-none transition-all
              min-h-[160px] md:min-h-[185px] flex items-center gap-5 overflow-hidden group
            `}
          >
            {/* Subtle background motif aura */}
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />

            <div className="w-18 h-18 md:w-20 md:h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl md:text-4xl shadow-inner flex-shrink-0 border border-white/20">
              {tile.emoji}
            </div>

            <div className="flex-1 relative z-10">
              <span className="inline-block text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/25 text-white mb-1.5 backdrop-blur-xs">
                {tile.badge}
              </span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-snug font-display">
                {tile.title}
              </h2>
              <p className="text-white/85 text-sm md:text-base font-medium mt-1 leading-relaxed">
                {tile.subtitle}
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* SMRITI REWARDS & CREDITS CARD */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-4xl p-6 md:p-8 shadow-xl border-2 border-indigo-700/60 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="flex items-center gap-5 text-center md:text-left">
          <div className="w-18 h-18 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-4xl shadow-inner flex-shrink-0">
            💠
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-300 bg-white/10 px-3 py-1 rounded-full border border-white/15 mb-1.5">
              <Coins className="w-3.5 h-3.5" />
              <span>{t('economy.hubTitle')}</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-white font-display">
              💠 {balance.toLocaleString()} {t('economy.credits')}
            </h3>
            <p className="text-indigo-200 text-sm md:text-base font-medium mt-1 max-w-md">
              {t('economy.todayCreditsTitle')}: {dailyEarned} / {dailyLimit} 💠 ({t('economy.dailyEarned')})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => navigate('/economy?tab=rewards')}
            className="flex-1 md:flex-initial px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>{t('economy.browseRewardsButton')}</span>
          </button>
          <button
            onClick={() => navigate('/economy?tab=earn')}
            className="flex-1 md:flex-initial px-6 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t('economy.earnCreditsButton')}</span>
          </button>
        </div>
      </motion.div>

      {/* 3. COMMUNITY SANCTUARY CARD (Refined) */}
      <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 dark:from-[#131D33] dark:via-[#1A253D] dark:to-[#131D33] border-2 border-teal-200/90 dark:border-[#243352] rounded-4xl p-6 md:p-8 shadow-healthcare flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 text-center sm:text-left">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-smriti-teal-600 to-smriti-teal-800 text-white flex items-center justify-center text-3xl shadow-md border-2 border-teal-300/40 flex-shrink-0">
            🌸
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-smriti-teal-800 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800 mb-1">
              <Users className="w-3 h-3" />
              <span>{t('community.youAreNotAlone')}</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-display">
              {t('community.title')}
            </h3>
            <p className="text-slate-600 dark:text-slate-300 font-medium text-sm md:text-base mt-1 max-w-lg leading-relaxed">
              {t('community.subtitle')}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/community')}
          className="px-7 py-4 rounded-3xl bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white font-black text-base shadow-elder whitespace-nowrap cursor-pointer btn-tactile-teal flex items-center gap-2"
        >
          <span>{t('navigation.community')}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Emergency Caregiver Modal */}
      <EmergencyCallModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
      />
    </div>
  );
}
