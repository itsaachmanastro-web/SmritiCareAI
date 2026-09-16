import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Heart, Shield, Cpu, Volume2, Database, Users, Activity, CheckCircle2, Lock, Globe, Brain } from 'lucide-react';
import ElderButton from '../components/common/ElderButton';
import { SmritiLogo, JaapiIcon, GamosaIcon, TeaLeafIcon } from '../components/common/NerIcons';
import { useLanguage } from '../context/LanguageContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col justify-between relative z-10">
      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 pt-8 pb-16 md:pt-14 md:pb-20 text-center">
        {/* Healthcare Platform Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50/90 dark:bg-teal-950/70 text-teal-900 dark:text-teal-200 border border-teal-200 dark:border-teal-800/80 text-xs md:text-sm font-bold mb-6 shadow-xs backdrop-blur-md"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Cognitive Health & Dementia Platform &bull; Offline-First Clinical AI</span>
        </motion.div>

        {/* Central Logo & Brand */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex justify-center mb-5"
        >
          <div className="p-3.5 rounded-3xl bg-white/80 dark:bg-[#131D33]/80 backdrop-blur-xl border border-white/80 dark:border-[#243352]/90 shadow-xl shadow-teal-900/5 dark:shadow-black/40">
            <SmritiLogo className="w-16 h-16 md:w-20 md:h-20 drop-shadow-md" showText={false} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white font-display tracking-tight leading-tight">
            Smriti<span className="text-smriti-teal-600 dark:text-teal-400">Care</span>
          </h1>
          <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-smriti-teal-700 dark:text-teal-300 mt-1.5 mb-3">
            {t('hero.brandLine') || t('common.brandLine') || 'AI FOR BRIGHTER MINDS'}
          </p>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight mt-2">
            {t('hero.tagline') || t('common.tagline') || 'Empowering Every Memory. Enriching Every Moment.'}
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 font-medium max-w-2xl mx-auto mt-4 leading-relaxed">
            {t('hero.subtagline') || t('common.subtagline') || 'SmritiCare brings together AI-powered cognitive games, personalized memory support, gentle reminders and voice-enabled assistance to help older adults stay engaged, independent and connected — while giving caregivers meaningful insight into their everyday cognitive journey.'}
          </p>
        </motion.div>

        {/* Tactile High-Contrast Get Started CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => navigate('/role-select')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-smriti-teal-600 via-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-base md:text-lg shadow-xl shadow-teal-700/25 hover:shadow-2xl hover:shadow-teal-700/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>{t('getStarted') || 'Get Started'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigate('/login?role=patient')}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/90 dark:bg-[#131D33]/90 hover:bg-slate-50 dark:hover:bg-[#1A2844] text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-[#243352] font-extrabold text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md"
          >
            <Brain className="w-5 h-5 text-smriti-teal-600 dark:text-teal-400" />
            <span>Senior PIN Sign-in</span>
          </button>
        </motion.div>

        {/* Subtle Voice & Trust Feature Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-teal-50/80 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/80 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>AI Assistance</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 text-xs font-bold shadow-xs">
            <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Voice-Enabled: "Talk naturally with SmritiCare"</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 text-xs font-bold shadow-xs">
            <Brain className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Personalized Cognitive Training</span>
          </div>
        </div>

        {/* Quick Cultural Motif Showcase */}
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 mt-12 opacity-85">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-[#131D33]/60 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-[#243352]/50 backdrop-blur-xs">
            <JaapiIcon className="w-6 h-6" />
            <span>Assam Jaapi Heritage</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-[#131D33]/60 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-[#243352]/50 backdrop-blur-xs">
            <GamosaIcon className="w-6 h-6" />
            <span>Sacred Gamosa Motifs</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-[#131D33]/60 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-[#243352]/50 backdrop-blur-xs">
            <TeaLeafIcon className="w-6 h-6" />
            <span>Tea Garden Routines</span>
          </div>
        </div>

        {/* Key Feature Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-14 text-left">
          {/* Pillar 1 */}
          <div className="bg-white/85 dark:bg-[#131D33]/85 backdrop-blur-xl p-6 md:p-7 rounded-3xl border border-white/70 dark:border-[#243352]/80 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/70 flex items-center justify-center text-teal-700 dark:text-teal-300 mb-4 shadow-xs">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Adaptive Cognitive Games</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-2 leading-relaxed">
              Culturally grounded memory, pattern, and attention exercises that dynamically adjust difficulty based on performance to strengthen cognitive resilience.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white/85 dark:bg-[#131D33]/85 backdrop-blur-xl p-6 md:p-7 rounded-3xl border border-white/70 dark:border-[#243352]/80 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/70 flex items-center justify-center text-orange-700 dark:text-orange-300 mb-4 shadow-xs">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Caregiver Vitality Analytics</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-2 leading-relaxed">
              Honest 7, 14, and 30-day longitudinal trajectory tracking, medication adherence monitoring, and automated clinical decline alerts for families and doctors.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white/85 dark:bg-[#131D33]/85 backdrop-blur-xl p-6 md:p-7 rounded-3xl border border-white/70 dark:border-[#243352]/80 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 flex items-center justify-center text-emerald-700 dark:text-emerald-300 mb-4 shadow-xs">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">100% Offline-First Privacy</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-2 leading-relaxed">
              Powered by local Dexie IndexedDB architecture. All cognitive interactions and clinical logs stay securely on device with optional background synchronization.
            </p>
          </div>
        </div>

        {/* Clinical Trust Strip */}
        <div className="mt-12 p-4 md:p-5 rounded-2xl bg-slate-100/70 dark:bg-[#162238]/70 border border-slate-200/60 dark:border-[#243352] backdrop-blur-md flex flex-wrap items-center justify-around gap-4 text-xs font-bold text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>WCAG 2.1 AA Accessible (56px+ Touch Targets)</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Private Local Storage &bull; Zero Forced Cloud Telemetry</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Multilingual Spoken Audio (Assamese, Hindi, English, Bengali)</span>
          </div>
        </div>
      </main>

      {/* Polished Healthcare Footer */}
      <footer className="py-8 border-t border-slate-200/80 dark:border-[#243352] text-center text-xs text-slate-500 dark:text-slate-400 font-semibold bg-white/50 dark:bg-[#0B1120]/60 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SmritiLogo className="w-5 h-5" showText={false} />
            <span className="font-extrabold text-slate-800 dark:text-white">SmritiCare</span>
            <span className="opacity-60">&bull; {t('footerText') || '© 2026 SmritiCare. All rights reserved.'}</span>
          </div>

          <div className="flex items-center gap-5 text-slate-600 dark:text-slate-400 font-bold">
            <button onClick={() => navigate('/role-select')} className="hover:text-smriti-teal-600 dark:hover:text-teal-400 transition-colors">
              Role Selection
            </button>
            <button onClick={() => navigate('/community')} className="hover:text-smriti-teal-600 dark:hover:text-teal-400 transition-colors">
              Community
            </button>
            <button onClick={() => navigate('/login?role=caregiver')} className="hover:text-smriti-teal-600 dark:hover:text-teal-400 transition-colors">
              Caregiver Portal
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
