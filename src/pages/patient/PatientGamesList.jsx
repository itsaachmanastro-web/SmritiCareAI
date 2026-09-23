import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Sparkles, Brain, Award, ShieldCheck, Film, Lock, Crown } from 'lucide-react';
import ElderButton from '../../components/common/ElderButton';
import FeatureLockedModal from '../../components/common/FeatureLockedModal';
import { JaapiIcon, GamosaIcon, TeaLeafIcon, PepaIcon } from '../../components/common/NerIcons';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useEntitlements } from '../../hooks/useEntitlements';
import { FEATURE_KEYS } from '../../services/subscriptionService';
import { getUserDifficultyProfile, scoreToDiscreteLevel, getTodaysChallenge } from '../../services/games';

export default function PatientGamesList() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { canAccessAllGames, planName } = useEntitlements();

  const currentUserId = currentUser?.id || 1;
  const [profile, setProfile] = useState(null);
  const [todaysChallenge, setTodaysChallenge] = useState(null);
  const [lockedModalData, setLockedModalData] = useState({ isOpen: false, title: '', desc: '' });

  useEffect(() => {
    async function loadData() {
      try {
        const [userProfile, challenge] = await Promise.all([
          getUserDifficultyProfile(currentUserId),
          getTodaysChallenge(currentUserId)
        ]);
        setProfile(userProfile);
        setTodaysChallenge(challenge);
      } catch (err) {
        console.warn('Could not load games list profile:', err);
      }
    }
    loadData();
  }, [currentUserId]);

  const games = [
    {
      id: 'bihu',
      domainKey: 'memoryMatch',
      title: t('games.bihu.title'),
      domain: t('progress.memoryDomain'),
      desc: t('games.bihu.desc'),
      culturalTag: 'Bihu Cultural Motifs',
      path: '/patient/games/bihu',
      icon: JaapiIcon,
      isCultural: true,
      color: 'bg-emerald-50/90 dark:bg-[#131D33] border-emerald-300 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-100',
      btnVariant: 'primary'
    },
    {
      id: 'mekhela',
      domainKey: 'patternRecognition',
      title: t('games.mekhela.title'),
      domain: t('progress.attentionDomain'),
      desc: t('games.mekhela.desc'),
      culturalTag: 'Assamese & Naga Weaves',
      path: '/patient/games/mekhela',
      icon: GamosaIcon,
      isCultural: true,
      color: 'bg-amber-50/90 dark:bg-[#131D33] border-amber-300 dark:border-amber-800/80 text-amber-950 dark:text-amber-100',
      btnVariant: 'orange'
    },
    {
      id: 'teagarden',
      domainKey: 'sequenceMemory',
      title: t('games.teagarden.title'),
      domain: t('progress.executiveDomain'),
      desc: t('games.teagarden.desc'),
      culturalTag: 'Tea Garden Heritage',
      path: '/patient/games/teagarden',
      icon: TeaLeafIcon,
      isCultural: true,
      color: 'bg-teal-50/90 dark:bg-[#131D33] border-teal-300 dark:border-teal-800/80 text-teal-950 dark:text-teal-100',
      btnVariant: 'primary'
    },
    {
      id: 'soundshills',
      domainKey: 'auditoryAttention',
      title: t('games.soundshills.title'),
      domain: t('progress.orientationDomain'),
      desc: t('games.soundshills.desc'),
      culturalTag: 'Hill Melodies & Birds',
      path: '/patient/games/soundshills',
      icon: PepaIcon,
      isCultural: true,
      color: 'bg-orange-50/90 dark:bg-[#131D33] border-orange-300 dark:border-orange-800/80 text-orange-950 dark:text-orange-100',
      btnVariant: 'orange'
    },
    {
      id: 'memorymotion',
      domainKey: 'videoMemory',
      title: t('games.memorymotion.title') || 'Memory Motion 3D',
      domain: t('games.memorymotion.subtitle') || 'Watch • Remember • Respond',
      desc: t('games.memorymotion.introDesc') || 'Experience realistic 3D everyday scenes. Observe the actions, colors, and objects, then answer simple questions to keep your memory sharp and active.',
      culturalTag: '3D Simulation & Video Training',
      path: '/patient/games/memorymotion',
      icon: Film,
      isCultural: false,
      color: 'bg-indigo-50/90 dark:bg-[#131D33] border-indigo-300 dark:border-indigo-800/80 text-indigo-950 dark:text-indigo-100',
      btnVariant: 'primary'
    }
  ];

  const handleGameLaunch = (game) => {
    if (game.isCultural && !canAccessAllGames) {
      setLockedModalData({
        isOpen: true,
        title: game.title,
        desc: `${game.title} is a Cultural Heritage cognitive game. Unlock all cultural games and stages with Classic, Standard, or Premium membership.`
      });
      return;
    }
    navigate(game.path);
  };

  const isChallengeLocked = todaysChallenge?.isCultural && !canAccessAllGames;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-6">
      {/* Back Button & Title */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/patient/home')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-[#131D33] hover:bg-slate-100 dark:hover:bg-[#1E293B] border border-slate-200 dark:border-[#243352] text-slate-700 dark:text-slate-200 font-bold text-base md:text-lg min-h-[48px] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('common.back')}</span>
        </button>

        <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#131D33] px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-[#243352] shadow-xs">
          {t('dashboard.fiveGamesReady') || t('dashboard.fourGamesReady') || '5 Games Ready'}
        </span>
      </div>

      <div className="text-center max-w-xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white font-display">
          {t('games.hubTitle')}
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-base md:text-lg font-medium mt-1">
          {t('games.hubSubtitle')}
        </p>
      </div>

      {/* TODAY'S ADAPTIVE DAILY CHALLENGE QUICK BANNER */}
      {todaysChallenge && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500/10 via-teal-500/10 to-emerald-500/10 dark:from-[#131D33] dark:to-[#1E293B] p-5 md:p-6 rounded-3xl border-2 border-amber-300/80 dark:border-amber-700/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#1E293B] border border-amber-200 dark:border-amber-800 flex items-center justify-center text-3xl shadow-xs flex-shrink-0">
              🌟
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 text-[11px] font-black uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3" />
                <span>{t('games.adaptive.todaysChallenge') || "Today's Featured Challenge"}</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug">
                {t(todaysChallenge.titleKey) || todaysChallenge.defaultTitle}
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {todaysChallenge.domainName} • Adapted Level: <span className="uppercase font-bold text-smriti-teal-700 dark:text-teal-400">{todaysChallenge.discreteLevel}</span>
              </p>
            </div>
          </div>

          <ElderButton
            variant={isChallengeLocked ? 'neutral' : 'orange'}
            size="md"
            icon={isChallengeLocked ? Lock : Play}
            onClick={() => {
              if (isChallengeLocked) {
                setLockedModalData({
                  isOpen: true,
                  title: t(todaysChallenge.titleKey) || todaysChallenge.defaultTitle,
                  desc: 'This featured cultural challenge requires Classic, Standard, or Premium membership.'
                });
              } else {
                navigate(todaysChallenge.path);
              }
            }}
          >
            {isChallengeLocked ? 'Unlock Challenge' : t('games.playNow')}
          </ElderButton>
        </motion.div>
      )}

      {/* Game Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {games.map((game) => {
          const IconComp = game.icon;
          const currentContinuous = profile ? Number(profile[game.domainKey]) || 0.5 : 0.5;
          const discreteLevel = scoreToDiscreteLevel(currentContinuous);
          const isLocked = game.isCultural && !canAccessAllGames;

          return (
            <motion.div
              key={game.id}
              whileHover={{ y: -4 }}
              className={`rounded-3xl md:rounded-4xl p-6 md:p-8 border-3 shadow-md flex flex-col justify-between transition-all ${
                isLocked
                  ? 'bg-slate-50/90 dark:bg-[#121A28] border-amber-300/70 dark:border-amber-800/60 opacity-95'
                  : game.color
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="p-3 bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border border-slate-200/60 dark:border-[#243352] relative">
                    <IconComp className="w-12 h-12" />
                    {isLocked && (
                      <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-black uppercase tracking-wider bg-white/80 dark:bg-[#1E293B] px-3 py-1 rounded-full border border-slate-200 dark:border-[#243352] text-slate-700 dark:text-slate-200">
                      {game.culturalTag}
                    </span>
                    {isLocked ? (
                      <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        🔒 Classic+ Required
                      </span>
                    ) : (
                      <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-100/90 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                        Level: {discreteLevel} (Adapted)
                      </span>
                    )}
                  </div>
                </div>

                <h2 className="text-2xl font-black font-display text-slate-900 dark:text-white leading-snug flex items-center gap-2">
                  <span>{game.title}</span>
                  {isLocked && <Lock className="w-5 h-5 text-amber-500 shrink-0" />}
                </h2>
                <div className="text-xs font-bold text-smriti-teal-700 dark:text-teal-400 uppercase tracking-wide mt-1">
                  {game.domain}
                </div>
                <p className="text-slate-700 dark:text-slate-200 text-base font-medium mt-2 leading-relaxed">
                  {game.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-[#243352]">
                <ElderButton
                  variant={isLocked ? 'orange' : game.btnVariant}
                  size="md"
                  fullWidth
                  icon={isLocked ? Crown : Play}
                  onClick={() => handleGameLaunch(game)}
                >
                  {isLocked ? 'Unlock with Classic' : t('games.playNow')}
                </ElderButton>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Feature Locked Modal for Game Access */}
      <FeatureLockedModal
        isOpen={lockedModalData.isOpen}
        onClose={() => setLockedModalData({ isOpen: false, title: '', desc: '' })}
        feature={FEATURE_KEYS.ALL_CULTURAL_GAMES}
        title={lockedModalData.title}
        description={lockedModalData.desc}
      />
    </div>
  );
}
