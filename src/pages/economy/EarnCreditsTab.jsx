import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Gamepad2,
  CalendarCheck,
  Flame,
  BookOpen,
  HeartHandshake,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useEconomy } from '../../context/EconomyContext';
import { useLanguage } from '../../context/LanguageContext';

export default function EarnCreditsTab() {
  const navigate = useNavigate();
  const { dailyProgress, earnCredits, refreshEconomy } = useEconomy();
  const { t } = useLanguage();

  const [claimingActivity, setClaimingActivity] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const earnedToday = dailyProgress?.earnedToday || 0;
  const dailyLimit = dailyProgress?.dailyLimit || 200;
  const remaining = dailyProgress?.remaining || 0;
  const isLimitReached = dailyProgress?.isLimitReached || false;
  const percent = Math.min(100, Math.round((earnedToday / dailyLimit) * 100));

  const activities = [
    {
      id: 'act_bihu_memory',
      title: t('economy.actBihuTitle') || 'Complete Bihu Cultural Memory Game',
      description: t('economy.actBihuDesc') || 'Match all heritage instruments, gamochas, and rhinos to sharpen recall.',
      reward: 50,
      icon: Gamepad2,
      category: 'Cognitive Game',
      actionText: t('economy.playNow') || 'Play Game',
      route: '/patient/games/bihu',
      source: 'cognitive_games'
    },
    {
      id: 'act_daily_challenge',
      title: t('economy.actChallengeTitle') || 'Daily Cognitive Challenge',
      description: t('economy.actChallengeDesc') || 'Complete today\'s randomized 3-minute pattern and sequence stimulation.',
      reward: 100,
      icon: CalendarCheck,
      category: 'Daily Routine',
      actionText: t('economy.playNow') || 'Start Challenge',
      route: '/patient/games/mekhela',
      source: 'daily_challenge'
    },
    {
      id: 'act_learning_module',
      title: t('economy.actLearningTitle') || 'Complete Memory Exercise Routine',
      description: t('economy.actLearningDesc') || 'Walk through a gentle tea garden harvest sequence or sound identification.',
      reward: 50,
      icon: BookOpen,
      category: 'Memory Exercise',
      actionText: t('economy.playNow') || 'Begin Exercise',
      route: '/patient/games/teagarden',
      source: 'learning_activity'
    },
    {
      id: 'act_community_positive',
      title: t('economy.actCommunityTitle') || 'Community Compassion Interaction',
      description: t('economy.actCommunityDesc') || 'Post an uplifting encouragement or reply to a peer caregiver in the community.',
      reward: 30,
      icon: HeartHandshake,
      category: 'Social Engagement',
      actionText: t('economy.goToCommunity') || 'Visit Community',
      route: '/community',
      source: 'community_activity'
    },
    {
      id: 'act_streak_7day',
      title: t('economy.actStreakTitle') || '7-Day Engagement Milestone Bonus',
      description: t('economy.actStreakDesc') || 'Awarded automatically when you engage in cognitive activities 7 days consecutively.',
      reward: 200,
      icon: Flame,
      category: 'Consistency Milestone',
      actionText: t('economy.viewProgress') || 'View Streaks',
      isStreakBonus: true,
      source: 'streak_milestone'
    }
  ];

  // Quick claim handler for simulated activities (e.g. mindfulness or breathing challenge)
  const handleQuickClaim = async (act) => {
    if (isLimitReached) {
      setFeedback({ type: 'warning', text: 'Daily earning cap reached. Great job today!' });
      return;
    }

    setClaimingActivity(act.id);
    setFeedback(null);

    try {
      const res = await earnCredits({
        amount: act.reward,
        reason: act.title,
        source: act.source,
        activityKey: act.id,
        minCooldownMinutes: 10
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          text: `🎉 +${res.awarded} Smriti Credits awarded for: "${act.title}"!`
        });
      } else {
        setFeedback({
          type: 'warning',
          text: res.reason === 'Daily earning limit reached'
            ? 'Daily cap reached for today! Rest well and return tomorrow.'
            : 'Activity completed recently. Please try another cognitive activity.'
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to award credits' });
    } finally {
      setClaimingActivity(null);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Daily Cap Progress Banner */}
      <div className="bg-white dark:bg-[#131D33] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-[#243352] shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-bold mb-2">
              <Zap className="w-3.5 h-3.5" />
              <span>{t('economy.healthyEngagementGoal') || 'Healthy Engagement Cap'}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
              {t('economy.todayCreditsTitle') || 'Today\'s Earning Progress'}
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('economy.healthyPacingNote') || 'To protect cognitive wellness and prevent excessive screen time, daily credit earnings are healthy and capped.'}
            </p>
          </div>

          <div className="text-left md:text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('economy.allowanceRemaining') || 'Available Today:'}
            </span>
            <p className="text-2xl md:text-3xl font-black text-smriti-teal-600 dark:text-teal-400">
              {remaining} <span className="text-sm font-bold text-slate-500">/ {dailyLimit} Credits</span>
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5">
          <div className="w-full h-4 bg-slate-100 dark:bg-[#1E293B] rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-[#243352]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isLimitReached
                  ? 'bg-gradient-to-r from-amber-500 to-emerald-500'
                  : 'bg-gradient-to-r from-smriti-teal-500 to-teal-400'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-slate-400 font-semibold mt-2">
            <span>{earnedToday} Credits Earned</span>
            <span>{percent}% of Daily Cap</span>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedback && (
          <div
            className={`mt-4 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border animate-fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                : feedback.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback.text}</span>
          </div>
        )}
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activities.map((act) => {
          const Icon = act.icon;
          return (
            <div
              key={act.id}
              className="bg-white dark:bg-[#131D33] p-5 md:p-6 rounded-3xl border border-slate-200 dark:border-[#243352] shadow-xs flex flex-col justify-between gap-4 transition-all hover:border-teal-500/50"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#243352]">
                    {act.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-black text-emerald-600 dark:text-emerald-400">
                    +{act.reward} 💠
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-smriti-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {act.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {act.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#243352] flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  {act.isStreakBonus ? 'Auto-awarded at Day 7' : 'Earnable via completion'}
                </span>

                {act.route ? (
                  <button
                    onClick={() => navigate(act.route)}
                    className="px-4 py-2 rounded-xl bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>{act.actionText}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleQuickClaim(act)}
                    disabled={claimingActivity === act.id || isLimitReached}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#25334D] text-slate-700 dark:text-slate-200 font-bold text-xs inline-flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <span>{claimingActivity === act.id ? 'Claiming...' : 'Claim Milestone'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ethical Pacing Disclaimer */}
      <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-800 dark:text-white">Healthy Screen-Time Protection</p>
          <p className="mt-0.5 leading-relaxed">
            SmritiCare strictly limits daily earning to maintain balanced screen habits for elderly users. Once your daily cap is attained, cognitive games and memory exercises remain 100% playable for health benefits without additional credit generation.
          </p>
        </div>
      </div>
    </div>
  );
}
