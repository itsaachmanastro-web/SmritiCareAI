import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { 
  Play, 
  Brain, 
  Flame, 
  Star, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  MessageSquare, 
  Leaf, 
  ChevronRight, 
  Heart, 
  Volume2, 
  Grid,
  Lock,
  Crown
} from 'lucide-react';
import EmergencyCallModal from '../../components/patient/EmergencyCallModal';
import FeatureLockedModal from '../../components/common/FeatureLockedModal';
import { usePatientLocation } from '../../hooks/usePatientLocation';
import { db } from '../../db/dexie';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAssistant } from '../../context/AssistantContext';
import { useEntitlements } from '../../hooks/useEntitlements';
import { FEATURE_KEYS } from '../../services/subscriptionService';
import { getTodaysChallenge } from '../../services/games';

export default function PatientHome() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { openAssistant } = useAssistant();
  const { canAccessAllGames, canAccessVoiceAi } = useEntitlements();
  const [showCallModal, setShowCallModal] = useState(false);
  const [todaysChallenge, setTodaysChallenge] = useState(null);
  const [lockedModal, setLockedModal] = useState({ isOpen: false, feature: FEATURE_KEYS.ALL_CULTURAL_GAMES, title: '', desc: '' });

  // Maintain active background location broadcasting for caregiver safety
  usePatientLocation(currentUser?.id || 1, true);

  // Live queries from Dexie scoped to current user
  const currentUserId = currentUser?.id;
  const reminders = useLiveQuery(
    async () => {
      if (!currentUserId) return [];
      const all = await db.reminders.toArray();
      return all.filter(r => 
        Number(r.targetUserId) === Number(currentUserId) || 
        Number(r.userId) === Number(currentUserId) || 
        Number(r.patientId) === Number(currentUserId)
      );
    },
    [currentUserId]
  ) || [];
  const sessions = useLiveQuery(
    () => currentUserId ? db.gameSessions.where('userId').equals(currentUserId).toArray() : [],
    [currentUserId]
  ) || [];

  // Load today's adaptive challenge
  useEffect(() => {
    async function loadChallenge() {
      try {
        const challenge = await getTodaysChallenge(currentUserId || 1);
        setTodaysChallenge(challenge);
      } catch (err) {
        console.warn('Could not load challenge:', err);
      }
    }
    loadChallenge();
  }, [currentUserId]);

  // Real Metrics Calculations
  const gamesPlayedCount = sessions.length;

  // Streak calculation (days with at least 1 session)
  const calculateStreak = () => {
    if (!sessions || sessions.length === 0) return currentUser?.streak || 0;
    const sessionDates = new Set(
      sessions.map((s) => new Date(s.playedAt || s.timestamp || Date.now()).toISOString().split('T')[0])
    );
    const sortedDates = Array.from(sessionDates).sort().reverse();
    let streak = 0;
    let checkDate = new Date();
    
    // Check if played today
    const todayStr = checkDate.toISOString().split('T')[0];
    if (!sessionDates.has(todayStr)) {
      // Check if played yesterday
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayStr = checkDate.toISOString().split('T')[0];
      if (!sessionDates.has(yesterdayStr)) {
        return 0;
      }
    }

    while (sessionDates.has(checkDate.toISOString().split('T')[0])) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return Math.max(streak, 1);
  };

  const streakCount = calculateStreak();

  // Average Score
  const averageScore = sessions.length > 0 
    ? Math.round(sessions.reduce((acc, s) => acc + (Number(s.score) || 0), 0) / sessions.length) 
    : 0;

  // Time Spent (in hours)
  const totalDurationSeconds = sessions.reduce((acc, s) => acc + (Number(s.durationSeconds) || 0), 0);
  const timeSpentHours = totalDurationSeconds > 0 
    ? (totalDurationSeconds / 3600).toFixed(1) 
    : '0.0';

  const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : 'there';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* 1. HERO BANNER */}
      <div className="relative w-full rounded-3xl sm:rounded-4xl overflow-hidden border border-[#E8E3DA] dark:border-[#1A303A] shadow-sm transition-all">
        {/* Background Image with Theme Support */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 transform scale-100"
          style={{
            backgroundImage: `url('${isDark ? '/assets/images/hero-dark.jpg' : '/assets/images/hero-light.jpg'}')`
          }}
        />
        
        {/* Subtle atmospheric gradient overlay to guarantee perfect text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/30 dark:from-[#091116]/95 dark:via-[#091116]/80 dark:to-[#091116]/30 backdrop-blur-[0.5px]" />

        {/* Hero Content */}
        <div className="relative z-10 px-6 sm:px-10 lg:px-12 py-8 sm:py-12 flex flex-col justify-between min-h-[280px] sm:min-h-[320px]">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="max-w-xl space-y-3">
              {/* Uppercase Tag */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5EFEB] dark:bg-[#122A25] border border-[#CADBD4] dark:border-[#14B8A6]/30 text-[11px] font-bold uppercase tracking-wider text-[#183C33] dark:text-[#5EEAD4]">
                <span>{t('patient.heroBadge') || 'SMRITICARE'}</span>
              </div>

              {/* Serif Headline */}
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#13221E] dark:text-[#F1F5F7] leading-tight">
                {isDark ? (
                  <>
                    {t('patient.heroTitleDark1')}<br />
                    <span className="font-serif italic font-normal text-[#2DD4BF]">{t('patient.heroTitleDark2')}</span>
                  </>
                ) : (
                  <>
                    {t('patient.heroTitleLight1')}<br />
                    <span className="font-serif italic font-normal text-[#183C33]">{t('patient.heroTitleLight2')}</span>
                  </>
                )}
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-[#495C55] dark:text-[#A1B5AF] font-medium max-w-md leading-relaxed">
                {isDark 
                  ? t('patient.heroDescDark') 
                  : t('patient.heroDescLight')}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => navigate(todaysChallenge?.path || '/patient/games/mekhela')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm cursor-pointer bg-[#183C33] hover:bg-[#132E27] text-white dark:bg-[#2DD4BF] dark:hover:bg-[#14B8A6] dark:text-[#091116] active:scale-95"
                >
                  <span>{t('patient.continuePlaying')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/patient/games')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all border cursor-pointer bg-white/80 hover:bg-white text-[#183C33] border-[#CADBD4] dark:bg-[#0F1C23]/80 dark:hover:bg-[#0F1C23] dark:text-[#F1F5F7] dark:border-[#1A303A] active:scale-95"
                >
                  <span>{t('patient.exploreActivities')}</span>
                </button>
              </div>
            </div>

            {/* Right-Side Pull Quote */}
            <div className="hidden md:flex flex-col items-end text-right self-start pt-2">
              <p className="font-serif italic text-base lg:text-lg text-[#31473F] dark:text-[#C5D6D0] max-w-xs leading-snug">
                {isDark 
                  ? t('patient.pullQuoteDark')
                  : t('patient.pullQuoteLight')}
              </p>
              <div className="w-16 h-0.5 bg-[#CADBD4] dark:bg-[#1A303A] mt-2" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. FOUR QUICK STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Games Played */}
        <div className="bg-white dark:bg-[#0F1C23] border border-[#E8E3DA] dark:border-[#1A303A] rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs hover:border-[#183C33]/40 dark:hover:border-[#2DD4BF]/40 transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-orange-50 dark:bg-[#2B1B15] border border-orange-200/60 dark:border-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <span className="block font-sans font-extrabold text-xl sm:text-2xl text-[#13221E] dark:text-[#F1F5F7] leading-none">
                {gamesPlayedCount}
              </span>
              <span className="text-xs text-[#6B7E77] dark:text-[#8EA19B] font-medium mt-1 block">
                {t('patient.statGamesPlayed')}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/50 px-2 py-0.5 rounded-full">
            ↑ 20%
          </span>
        </div>

        {/* Day Streak */}
        <div className="bg-white dark:bg-[#0F1C23] border border-[#E8E3DA] dark:border-[#1A303A] rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs hover:border-[#183C33]/40 dark:hover:border-[#2DD4BF]/40 transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-[#122822] border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <span className="block font-sans font-extrabold text-xl sm:text-2xl text-[#13221E] dark:text-[#F1F5F7] leading-none">
                {streakCount}
              </span>
              <span className="text-xs text-[#6B7E77] dark:text-[#8EA19B] font-medium mt-1 block">
                {t('patient.statDayStreak')}
              </span>
            </div>
          </div>
          <span className="text-base" title="Active Streak">
            🔥
          </span>
        </div>

        {/* Average Score */}
        <div className="bg-white dark:bg-[#0F1C23] border border-[#E8E3DA] dark:border-[#1A303A] rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs hover:border-[#183C33]/40 dark:hover:border-[#2DD4BF]/40 transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-[#282110] border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-center text-amber-500 shrink-0">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <span className="block font-sans font-extrabold text-xl sm:text-2xl text-[#13221E] dark:text-[#F1F5F7] leading-none">
                {averageScore}%
              </span>
              <span className="text-xs text-[#6B7E77] dark:text-[#8EA19B] font-medium mt-1 block">
                {t('patient.statAverageScore')}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/50 px-2 py-0.5 rounded-full">
            ↑ 12%
          </span>
        </div>

        {/* Time Spent */}
        <div className="bg-white dark:bg-[#0F1C23] border border-[#E8E3DA] dark:border-[#1A303A] rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs hover:border-[#183C33]/40 dark:hover:border-[#2DD4BF]/40 transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-[#122A29] border border-teal-200/60 dark:border-teal-900/40 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="block font-sans font-extrabold text-xl sm:text-2xl text-[#13221E] dark:text-[#F1F5F7] leading-none">
                {timeSpentHours} {t('patient.hoursShort') || 'hrs'}
              </span>
              <span className="text-xs text-[#6B7E77] dark:text-[#8EA19B] font-medium mt-1 block">
                {t('patient.statTimeSpent')}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/50 px-2 py-0.5 rounded-full">
            ↑ 18%
          </span>
        </div>
      </div>

      {/* 3. MAIN CONTENT: 2-COLUMN SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: COGNITIVE GAMES (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-2xl text-[#13221E] dark:text-[#F1F5F7]">
                {t('patient.cognitiveGamesTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-[#6B7E77] dark:text-[#8EA19B] mt-0.5 font-medium">
                {t('patient.cognitiveGamesSub')}
              </p>
            </div>
            <button
              onClick={() => navigate('/patient/games')}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#183C33] dark:text-[#2DD4BF] hover:underline cursor-pointer"
            >
              <span>{t('patient.viewAll')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3 Game Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Card 1: Pattern Match */}
            <div 
              onClick={() => {
                if (!canAccessAllGames) {
                  setLockedModal({
                    isOpen: true,
                    feature: FEATURE_KEYS.ALL_CULTURAL_GAMES,
                    title: t('patient.gamePatternTitle') || 'Mekhela Pattern Weaver',
                    desc: 'Mekhela Pattern Weaver is a Cultural Heritage game. Upgrade to Classic or higher to play.'
                  });
                } else {
                  navigate('/patient/games/mekhela');
                }
              }}
              className="group bg-white dark:bg-[#0F1C23] border border-[#E8E3DA] dark:border-[#1A303A] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:border-[#183C33]/50 dark:hover:border-[#2DD4BF]/50 transition-all cursor-pointer min-h-[270px] relative"
            >
              {/* Artwork Box */}
              <div className="w-full h-32 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-[#132A26] dark:to-[#0D1C1A] border border-emerald-200/50 dark:border-emerald-900/30 overflow-hidden relative flex items-center justify-center p-3">
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-70 group-hover:scale-105 transition-transform duration-500"
                  style={{ backgroundImage: `url('/assets/images/pattern-art.jpg')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="relative z-10 w-10 h-10 rounded-xl bg-white/90 dark:bg-[#0F1C23]/90 backdrop-blur-xs flex items-center justify-center shadow-xs">
                  <Grid className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                </div>
                {!canAccessAllGames && (
                  <div className="absolute top-2.5 right-2.5 z-20 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center gap-1 shadow-sm">
                    <Lock className="w-3 h-3" />
                    <span>Classic+</span>
                  </div>
                )}
              </div>

              {/* Meta & Title */}
              <div className="pt-3.5">
                <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#E5EFEB] dark:bg-[#122A25] text-[#183C33] dark:text-[#5EEAD4]">
                  {t('patient.gameMemory')}
                </span>
                <h3 className="font-serif font-bold text-base text-[#13221E] dark:text-[#F1F5F7] mt-1.5 group-hover:text-[#183C33] dark:group-hover:text-[#2DD4BF] transition-colors flex items-center gap-1.5">
                  <span>{t('patient.gamePatternTitle')}</span>
                  {!canAccessAllGames && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                </h3>
                <p className="text-xs text-[#6B7E77] dark:text-[#8EA19B] mt-1 leading-relaxed">
                  {t('patient.gamePatternDesc')}
                </p>
              </div>

              {/* Play Button Row */}
              <div className="pt-3 flex justify-end">
                <div className="w-9 h-9 rounded-full bg-[#183C33] group-hover:bg-[#132E27] dark:bg-[#2DD4BF] dark:group-hover:bg-[#14B8A6] text-white dark:text-[#091116] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  {!canAccessAllGames ? <Crown className="w-4 h-4 ml-0.5" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
                </div>
              </div>
            </div>

            {/* Card 2: Sound of the Hills */}
            <div 
              onClick={() => {
                if (!canAccessAllGames) {
                  setLockedModal({
                    isOpen: true,
                    feature: FEATURE_KEYS.ALL_CULTURAL_GAMES,
                    title: t('patient.gameSoundsTitle') || 'Sounds of the Hills',
                    desc: 'Sounds of the Hills is a Cultural Heritage auditory game. Upgrade to Classic or higher to play.'
                  });
                } else {
                  navigate('/patient/games/soundshills');
                }
              }}
              className="group bg-white dark:bg-[#0F1C23] border border-[#E8E3DA] dark:border-[#1A303A] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:border-[#183C33]/50 dark:hover:border-[#2DD4BF]/50 transition-all cursor-pointer min-h-[270px] relative"
            >
              {/* Artwork Box */}
              <div className="w-full h-32 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-100 dark:from-[#0E2320] dark:to-[#0B1B18] border border-teal-200/50 dark:border-teal-900/30 overflow-hidden relative flex items-center justify-center p-3">
                <svg className="w-full h-full text-teal-600 dark:text-teal-400 opacity-60 group-hover:scale-105 transition-transform duration-500" viewBox="0 0 200 100" fill="none">
                  <path d="M10 80 Q 50 20, 90 70 T 170 30 T 200 80" stroke="currentColor" strokeWidth="2.5" fill="none" />
                  <path d="M20 90 Q 60 40, 100 80 T 180 50 T 200 90" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
                </svg>
                <div className="relative z-10 w-10 h-10 rounded-xl bg-white/90 dark:bg-[#0F1C23]/90 backdrop-blur-xs flex items-center justify-center shadow-xs">
                  <Volume2 className="w-5 h-5 text-teal-700 dark:text-teal-400" />
                </div>
                {!canAccessAllGames && (
                  <div className="absolute top-2.5 right-2.5 z-20 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center gap-1 shadow-sm">
                    <Lock className="w-3 h-3" />
                    <span>Classic+</span>
                  </div>
                )}
              </div>

              {/* Meta & Title */}
              <div className="pt-3.5">
                <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 dark:bg-[#282110] text-amber-800 dark:text-amber-300">
                  {t('patient.gameAuditory')}
                </span>
                <h3 className="font-serif font-bold text-base text-[#13221E] dark:text-[#F1F5F7] mt-1.5 group-hover:text-[#183C33] dark:group-hover:text-[#2DD4BF] transition-colors flex items-center gap-1.5">
                  <span>{t('patient.gameSoundsTitle')}</span>
                  {!canAccessAllGames && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                </h3>
                <p className="text-xs text-[#6B7E77] dark:text-[#8EA19B] mt-1 leading-relaxed">
                  {t('patient.gameSoundsDesc')}
                </p>
              </div>

              {/* Play Button Row */}
              <div className="pt-3 flex justify-end">
                <div className="w-9 h-9 rounded-full bg-[#183C33] group-hover:bg-[#132E27] dark:bg-[#2DD4BF] dark:group-hover:bg-[#14B8A6] text-white dark:text-[#091116] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  {!canAccessAllGames ? <Crown className="w-4 h-4 ml-0.5" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
                </div>
              </div>
            </div>

            {/* Card 3: Bihu Memory / Mind Math */}
            <div 
              onClick={() => {
                if (!canAccessAllGames) {
                  setLockedModal({
                    isOpen: true,
                    feature: FEATURE_KEYS.ALL_CULTURAL_GAMES,
                    title: t('patient.gameBihuTitle') || 'Bihu Memory Pairs',
                    desc: 'Bihu Memory Pairs is a Cultural Heritage memory game. Upgrade to Classic or higher to play.'
                  });
                } else {
                  navigate('/patient/games/bihu');
                }
              }}
              className="group bg-white dark:bg-[#0F1C23] border border-[#E8E3DA] dark:border-[#1A303A] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:border-[#183C33]/50 dark:hover:border-[#2DD4BF]/50 transition-all cursor-pointer min-h-[270px] relative"
            >
              {/* Artwork Box */}
              <div className="w-full h-32 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-[#131B2A] dark:to-[#0D1520] border border-blue-200/50 dark:border-blue-900/30 overflow-hidden relative flex items-center justify-center p-3">
                <div className="flex items-center gap-1.5 opacity-80 group-hover:scale-105 transition-transform duration-500">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/40 transform rotate-12 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-300">
                    +
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/30 border border-indigo-500/50 transform -rotate-6 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-300">
                    🧩
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/40 transform rotate-45 flex items-center justify-center text-xs font-bold text-teal-600 dark:text-teal-300">
                    ×
                  </div>
                </div>
                <div className="relative z-10 w-10 h-10 rounded-xl bg-white/90 dark:bg-[#0F1C23]/90 backdrop-blur-xs flex items-center justify-center shadow-xs">
                  <Brain className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
                </div>
                {!canAccessAllGames && (
                  <div className="absolute top-2.5 right-2.5 z-20 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center gap-1 shadow-sm">
                    <Lock className="w-3 h-3" />
                    <span>Classic+</span>
                  </div>
                )}
              </div>

              {/* Meta & Title */}
              <div className="pt-3.5">
                <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-[#12213A] text-blue-800 dark:text-blue-300">
                  {t('patient.gameLogic')}
                </span>
                <h3 className="font-serif font-bold text-base text-[#13221E] dark:text-[#F1F5F7] mt-1.5 group-hover:text-[#183C33] dark:group-hover:text-[#2DD4BF] transition-colors flex items-center gap-1.5">
                  <span>{t('patient.gameBihuTitle')}</span>
                  {!canAccessAllGames && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                </h3>
                <p className="text-xs text-[#6B7E77] dark:text-[#8EA19B] mt-1 leading-relaxed">
                  {t('patient.gameBihuDesc')}
                </p>
              </div>

              {/* Play Button Row */}
              <div className="pt-3 flex justify-end">
                <div className="w-9 h-9 rounded-full bg-[#183C33] group-hover:bg-[#132E27] dark:bg-[#2DD4BF] dark:group-hover:bg-[#14B8A6] text-white dark:text-[#091116] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  {!canAccessAllGames ? <Crown className="w-4 h-4 ml-0.5" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI COMPANION & INSPIRATION (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. Micro Progress Banner */}
          <div 
            onClick={() => navigate('/patient/progress')}
            className="bg-[#EBF3F0] dark:bg-[#112420] border border-[#CADBD4] dark:border-[#14B8A6]/30 rounded-2xl p-4 flex items-center justify-between shadow-xs cursor-pointer hover:bg-[#E3EEEA] dark:hover:bg-[#152E29] transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Leaf className="w-4 h-4" />
              </div>
              <p className="font-serif italic text-xs text-[#183C33] dark:text-[#5EEAD4] leading-tight">
                {isDark 
                  ? t('patient.microProgressQuoteDark') 
                  : t('patient.microProgressQuoteLight')}
              </p>
            </div>
            <div className="w-7 h-7 rounded-full bg-white dark:bg-[#0D171D] flex items-center justify-center text-[#183C33] dark:text-[#5EEAD4] group-hover:translate-x-0.5 transition-transform shrink-0">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* 2. AI Companion Card matching Reference Image */}
          <div className="bg-white dark:bg-[#0F1C23] border border-[#E8E3DA] dark:border-[#1A303A] rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-[#13221E] dark:text-[#F1F5F7]">
                {t('patient.companionTitle')}
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#183C33] text-white dark:bg-[#2DD4BF] dark:text-[#091116]">
                {t('patient.badgeNew') || 'New'}
              </span>
            </div>

            {/* Avatar & Bubble */}
            <div className="flex items-center gap-4">
              {/* Friendly Robot Avatar */}
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-[#132A26] dark:to-[#0D1C1A] border border-[#CADBD4] dark:border-[#14B8A6]/30 flex-shrink-0 relative shadow-inner">
                <img 
                  src={isDark ? '/assets/images/companion-dark.jpg' : '/assets/images/companion-light.jpg'} 
                  alt="Smriti AI Companion"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Chat Bubble Text */}
              <div className="flex-1 text-xs text-[#495C55] dark:text-[#A1B5AF] leading-relaxed">
                <p className="font-bold text-[#13221E] dark:text-[#F1F5F7] mb-1">
                  {t('patient.companionGreeting')} {firstName}!
                </p>
                <p>
                  {t('patient.companionPrompt')}
                </p>
              </div>
            </div>

            {/* Action CTA Button */}
            <button
              type="button"
              onClick={() => openAssistant()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-sm font-semibold transition-all shadow-sm cursor-pointer bg-[#183C33] hover:bg-[#132E27] text-white dark:bg-[#2DD4BF] dark:hover:bg-[#14B8A6] dark:text-[#091116] active:scale-95"
            >
              <span>{t('patient.startConversation')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 3. Today's Motivation Card */}
          <div className="bg-white dark:bg-[#0F1C23] border border-[#E8E3DA] dark:border-[#1A303A] rounded-2xl p-4 flex items-start gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-[#122822] text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B7E77] dark:text-[#8EA19B] block">
                {t('patient.motivationTitle')}
              </span>
              <p className="font-serif italic text-xs sm:text-sm text-[#13221E] dark:text-[#F1F5F7] mt-1 leading-snug">
                {isDark
                  ? t('patient.motivationQuoteDark')
                  : t('patient.motivationQuoteLight')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Caregiver Modal */}
      <EmergencyCallModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
      />

      {/* Plan-Locked Feature Modal */}
      <FeatureLockedModal
        isOpen={lockedModal.isOpen}
        onClose={() => setLockedModal(prev => ({ ...prev, isOpen: false }))}
        feature={lockedModal.feature}
        title={lockedModal.title}
        description={lockedModal.desc}
      />
    </div>
  );
}
