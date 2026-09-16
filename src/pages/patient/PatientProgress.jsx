import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Star, Heart, Award, Sparkles, Smile, Sun } from 'lucide-react';
import { db } from '../../db/dexie';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export default function PatientProgress() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const currentUserId = currentUser?.id;

  // Read sessions to count stars scoped to authenticated patient
  const sessions = useLiveQuery(
    () => currentUserId ? db.gameSessions.where('userId').equals(currentUserId).toArray() : [],
    [currentUserId]
  ) || [];

  const totalStars = sessions.reduce((acc, s) => {
    return acc + (s.score >= 80 ? 3 : s.score >= 60 ? 2 : 1);
  }, 0);

  const badges = [
    { title: t('games.bihu.title'), desc: t('games.bihu.desc'), emoji: '🥁', color: 'bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-700/60' },
    { title: t('games.teagarden.title'), desc: t('games.teagarden.desc'), emoji: '🍵', color: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60' },
    { title: t('games.mekhela.title'), desc: t('games.mekhela.desc'), emoji: '🧵', color: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60' },
    { title: t('games.soundshills.title'), desc: t('games.soundshills.desc'), emoji: '🎺', color: 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-700/60' }
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={() => navigate('/patient/home')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-[#131D33] hover:bg-slate-100 dark:hover:bg-[#1E293B] border border-slate-200 dark:border-[#243352] text-slate-700 dark:text-slate-200 font-bold text-base md:text-lg min-h-[48px] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('common.back')}</span>
        </button>

        <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 font-extrabold text-sm md:text-base">
          <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
          <span>{t('dashboard.starsEarnedBadge', { count: totalStars })}</span>
        </div>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white font-display">
          {t('progress.title')}
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-lg font-medium mt-1">
          {t('progress.subtitle')}
        </p>
      </div>

      {/* Main Happiness & Vitality Card */}
      <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 text-white rounded-3xl md:rounded-4xl p-6 md:p-8 shadow-xl text-center mb-8">
        <div className="w-24 h-24 mx-auto rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-5xl mb-3 shadow-inner">
          🌸
        </div>
        <h2 className="text-3xl md:text-4xl font-black">
          {t('dashboard.peacefulWish')}
        </h2>
        <p className="text-white/90 text-lg md:text-xl font-medium mt-2 max-w-lg mx-auto">
          {t('progress.improvingNotice')}
        </p>
      </div>

      {/* Badges Section */}
      <div className="bg-white dark:bg-[#131D33] rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-[#243352] shadow-sm">
        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-500" />
          <span>{t('progress.cognitiveDomains')}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {badges.map((badge, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl border-2 flex items-center gap-4 ${badge.color}`}
            >
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#1E293B] dark:border dark:border-[#243352] shadow-xs flex items-center justify-center text-3xl flex-shrink-0">
                {badge.emoji}
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white leading-snug">
                  {badge.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                  {badge.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
