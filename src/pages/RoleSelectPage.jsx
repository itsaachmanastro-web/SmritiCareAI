import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Sun, 
  Moon, 
  Bell, 
  Gamepad2, 
  Mic, 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  FileText, 
  BarChart3, 
  Activity,
  User,
  Stethoscope,
  Sparkles,
  Globe,
  ChevronDown,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';
import { SmritiLogo } from '../components/common/NerIcons';

export default function RoleSelectPage() {
  const navigate = useNavigate();
  const { loginDemo, loginContinuous } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(null);

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  const handleSelectRole = (role) => {
    navigate(`/login?role=${role}`);
  };

  const handleInstantDemo = async (e, role) => {
    e.stopPropagation();
    setIsSwitching(true);
    setSwitchingRole(role);
    try {
      const user = await loginDemo(role);
      const finalRole = user?.role || role;
      if (finalRole === 'patient') {
        navigate('/patient/home');
      } else if (finalRole === 'healthcare' || finalRole === 'clinician') {
        navigate('/clinician/dashboard');
      } else {
        navigate('/caregiver/dashboard');
      }
    } finally {
      setIsSwitching(false);
      setSwitchingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B0E] text-slate-100 flex flex-col justify-between relative selection:bg-emerald-500/20 selection:text-emerald-300 font-sans overflow-x-hidden">
      {/* Ambient Photographic Living-Room Backdrop with Sophisticated Near-Black Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center pointer-events-none opacity-20"
        style={{ backgroundImage: `url('/assets/images/role-bg.jpg')` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-[#070B0E]/95 via-[#070B0E]/85 to-[#070B0E]/95 pointer-events-none" />

      {/* 1. MINIMAL PROFESSIONAL NAVIGATION BAR */}
      <header className="relative z-20 w-full border-b border-white/10 backdrop-blur-md bg-[#070B0E]/80">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4 flex items-center justify-between">
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-[#142A24] border border-[#1E4339] flex items-center justify-center p-1 shadow-xs">
              <SmritiLogo className="w-full h-full text-[#86EFAC]" showText={false} />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">
              SmritiCare
            </span>
          </div>

          {/* Center Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-7 text-xs font-medium text-slate-300">
            <button onClick={() => navigate('/')} className="hover:text-white transition-colors cursor-pointer">
              Home
            </button>
            <button onClick={() => navigate('/#about')} className="hover:text-white transition-colors cursor-pointer">
              About
            </button>
            <button onClick={() => navigate('/#pillars')} className="hover:text-white transition-colors cursor-pointer">
              Our Approach
            </button>
            <button onClick={() => navigate('/economy')} className="hover:text-white transition-colors cursor-pointer">
              Resources
            </button>
            <button onClick={() => navigate('/#contact')} className="hover:text-white transition-colors cursor-pointer">
              Contact
            </button>
          </nav>

          {/* Right Controls: Theme Toggle, Language Selector, Notifications, Sign In Button */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-slate-300" />}
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-all cursor-pointer"
                aria-label="Select Language"
              >
                <Globe className="w-3.5 h-3.5 text-[#5EEAD4]" />
                <span className="hidden sm:inline">{currentLangObj.label.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#0E151D] border border-white/15 rounded-2xl shadow-xl py-1.5 z-50">
                  {SUPPORTED_LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setLanguage(l.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition-colors cursor-pointer ${
                        language === l.code
                          ? 'bg-[#142A24] text-[#86EFAC] font-bold'
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{l.flag}</span>
                        <span>{l.label}</span>
                      </span>
                      {language === l.code && <Check className="w-3.5 h-3.5 text-[#86EFAC]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white hidden sm:flex items-center justify-center transition-all cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-4 py-1.5 rounded-full text-xs font-medium text-white border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all cursor-pointer"
            >
              {t('navigation.signIn') || 'Sign in'}
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 pt-10 sm:pt-14 pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          {/* Eyebrow */}
          <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-[#5EEAD4] mb-3">
            {t('auth.roleBasedAccess') || 'ROLE-BASED ACCESS'}
          </span>

          {/* Editorial Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-white tracking-tight leading-tight">
            {t('auth.howWillYouUse') || 'How will you use SmritiCare?'}
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-300/90 font-normal mt-3">
            {t('auth.chooseExperience') || 'Choose the experience that’s right for you.'}
          </p>
        </div>

        {/* Right Editorial Callouts */}
        <div className="flex flex-col items-start lg:items-end text-left lg:text-right pt-2 lg:pt-0">
          <div className="inline-block relative">
            <p className="font-handwriting text-3xl sm:text-4xl text-slate-200/90 leading-[1.1] transform -rotate-2">
              {t('auth.caringTodayQuote') || 'Caring Today for Brighter Tomorrows.'}
            </p>
            <div className="w-16 h-[1px] bg-slate-400/50 mt-1 ml-auto" />
          </div>

          <p className="font-serif italic text-xs text-slate-400 mt-4 leading-relaxed max-w-xs">
            {t('auth.techWithHumanTouch') || '“Technology with a human touch.”'}<br />
            <span className="not-italic text-slate-500">— SmritiCare</span>
          </p>
        </div>
      </div>

      {/* 3. THREE EDITORIAL ROLE CARDS */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 py-4 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {/* CARD 1 — SENIOR / PATIENT */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-[#0E151D]/90 border border-white/10 rounded-2xl p-5 lg:p-6 flex flex-col justify-between shadow-2xl backdrop-blur-md hover:border-white/20 transition-all duration-300"
          >
            <div>
              {/* Photo Header with Overlaid Serif Quote */}
              <div className="h-48 sm:h-52 rounded-xl overflow-hidden relative mb-5 border border-white/5">
                <img
                  src="/assets/images/role-patient.jpg"
                  alt="Senior Patient"
                  className="w-full h-full object-cover object-center transform scale-100 hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/40" />

                {/* Overlaid Quote */}
                <div className="absolute top-3.5 left-4 right-4 z-10">
                  <p className="font-serif italic text-white/95 text-sm sm:text-base leading-snug drop-shadow-sm whitespace-pre-line">
                    {t('auth.patientTagline') || 'Live fully. Remember more.'}
                  </p>
                </div>

                {/* Floating Circle Icon Badge */}
                <div className="absolute bottom-3 left-4 z-20 w-11 h-11 rounded-full bg-[#16382E] text-[#86EFAC] border border-[#235848] flex items-center justify-center shadow-lg">
                  <User className="w-5 h-5" />
                </div>
              </div>

              {/* Title & Description */}
              <h2 className="font-serif font-bold text-2xl text-white tracking-tight">
                {t('auth.seniorPatient') || 'Senior / Patient'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300/85 leading-relaxed mt-2.5 min-h-[44px]">
                {t('auth.patientDesc') || 'Voice-guided routines, cognitive games, and a simplified 4-digit PIN login designed for seniors.'}
              </p>

              {/* Feature Highlights */}
              <div className="mt-5 space-y-2.5 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
                  <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                    <Gamepad2 className="w-3.5 h-3.5" />
                  </div>
                  <span>{t('navigation.games') || 'Memory Games'}</span>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
                  <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                    <Mic className="w-3.5 h-3.5" />
                  </div>
                  <span>{t('navigation.assistant') || 'Voice Assistant'}</span>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
                  <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span>{t('auth.patientTag') || 'Safe & Simple'}</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-7 pt-4 space-y-2">
              <button
                type="button"
                disabled={isSwitching}
                onClick={() => handleSelectRole('patient')}
                className="w-full py-3 px-4 rounded-full font-semibold text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 bg-[#99D5B7] hover:bg-[#86EFAC] text-[#091D16] active:scale-98 disabled:opacity-75"
              >
                {isSwitching && switchingRole === 'patient' ? (
                  <span className="inline-flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-[#091D16] border-t-transparent animate-spin" />
                    <span>Loading Patient Account...</span>
                  </span>
                ) : (
                  <>
                    <span>{t('auth.continueAsPatient') || 'Continue as Patient'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isSwitching}
                onClick={(e) => handleInstantDemo(e, 'patient')}
                className="w-full text-center py-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
              >
                <Sparkles className="w-3 h-3 text-[#86EFAC]" />
                <span>{t('auth.instantDemoAmma') || 'Instant Demo: Amma'}</span>
              </button>
            </div>
          </motion.div>

          {/* CARD 2 — FAMILY CAREGIVER */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="bg-[#0E151D]/90 border border-white/10 rounded-2xl p-5 lg:p-6 flex flex-col justify-between shadow-2xl backdrop-blur-md hover:border-white/20 transition-all duration-300"
          >
            <div>
              {/* Photo Header with Overlaid Serif Quote */}
              <div className="h-48 sm:h-52 rounded-xl overflow-hidden relative mb-5 border border-white/5">
                <img
                  src="/assets/images/role-caregiver.jpg"
                  alt="Family Caregiver"
                  className="w-full h-full object-cover object-center transform scale-100 hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/40" />

                {/* Overlaid Quote */}
                <div className="absolute top-3.5 left-4 right-4 z-10">
                  <p className="font-serif italic text-white/95 text-sm sm:text-base leading-snug drop-shadow-sm whitespace-pre-line">
                    {t('auth.caregiverTagline') || 'Never alone. Always guided.'}
                  </p>
                </div>

                {/* Floating Circle Icon Badge */}
                <div className="absolute bottom-3 left-4 z-20 w-11 h-11 rounded-full bg-[#3E231C] text-[#FCA5A5] border border-[#653328] flex items-center justify-center shadow-lg">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              {/* Title & Description */}
              <h2 className="font-serif font-bold text-2xl text-white tracking-tight">
                {t('auth.familyCaregiver') || 'Family Caregiver'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300/85 leading-relaxed mt-2.5 min-h-[44px]">
                {t('auth.caregiverDesc') || 'Track cognitive trends, medication adherence, and daily activities — all in one place.'}
              </p>

              {/* Feature Highlights */}
              <div className="mt-5 space-y-2.5 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
                  <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <span>{t('navigation.progress') || 'Progress Tracking'}</span>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
                  <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <span>{t('caregiver.clinicalAlerts') || 'Care Alerts'}</span>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
                  <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <span>{t('caregiver.patientOverview') || 'Family Collaboration'}</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-7 pt-4 space-y-2">
              <button
                type="button"
                disabled={isSwitching}
                onClick={() => handleSelectRole('caregiver')}
                className="w-full py-3 px-4 rounded-full font-semibold text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 bg-[#F4A88E] hover:bg-[#FCA590] text-[#280F08] active:scale-98 disabled:opacity-75"
              >
                {isSwitching && switchingRole === 'caregiver' ? (
                  <span className="inline-flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-[#280F08] border-t-transparent animate-spin" />
                    <span>Loading Caregiver Account...</span>
                  </span>
                ) : (
                  <>
                    <span>{t('auth.continueAsCaregiver') || 'Continue as Caregiver'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isSwitching}
                onClick={(e) => handleInstantDemo(e, 'caregiver')}
                className="w-full text-center py-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
              >
                <Sparkles className="w-3 h-3 text-[#FCA5A5]" />
                <span>{t('auth.instantDemoPriya') || 'Instant Demo: Priya'}</span>
              </button>
            </div>
          </motion.div>

          {/* CARD 3 — HEALTHCARE PROFESSIONAL */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16 }}
            className="bg-[#0E151D]/90 border border-white/10 rounded-2xl p-5 lg:p-6 flex flex-col justify-between shadow-2xl backdrop-blur-md hover:border-white/20 transition-all duration-300"
          >
            <div>
              {/* Photo Header with Overlaid Serif Quote */}
              <div className="h-48 sm:h-52 rounded-xl overflow-hidden relative mb-5 border border-white/5">
                <img
                  src="/assets/images/role-clinician.jpg"
                  alt="Healthcare Professional"
                  className="w-full h-full object-cover object-center transform scale-100 hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/40" />

                {/* Overlaid Quote */}
                <div className="absolute top-3.5 left-4 right-4 z-10">
                  <p className="font-serif italic text-white/95 text-sm sm:text-base leading-snug drop-shadow-sm whitespace-pre-line">
                    {t('auth.clinicianTagline') || 'Clinical clarity. Better outcomes.'}
                  </p>
                </div>

                {/* Floating Circle Icon Badge */}
                <div className="absolute bottom-3 left-4 z-20 w-11 h-11 rounded-full bg-[#192C3D] text-[#93C5FD] border border-[#274661] flex items-center justify-center shadow-lg">
                  <Stethoscope className="w-5 h-5" />
                </div>
              </div>

              {/* Title & Description */}
              <h2 className="font-serif font-bold text-2xl text-white tracking-tight">
                {t('auth.healthcareProfessional') || 'Healthcare Professional'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300/85 leading-relaxed mt-2.5 min-h-[44px]">
                {t('auth.healthcareDesc') || 'Standardized assessments, patient coordination, and automated longitudinal reports.'}
              </p>

              {/* Feature Highlights */}
              <div className="mt-5 space-y-2.5 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
                  <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <span>{t('navigation.assessments') || 'Clinical Assessments'}</span>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
                  <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </div>
                  <span>{t('caregiver.cognitiveTrajectory') || 'Patient Insights'}</span>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
                  <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <span>{t('navigation.careplans') || 'Care Coordination'}</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-7 pt-4 space-y-2">
              <button
                type="button"
                disabled={isSwitching}
                onClick={() => handleSelectRole('healthcare')}
                className="w-full py-3 px-4 rounded-full font-semibold text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 bg-[#8CB8DE] hover:bg-[#93C5FD] text-[#0B1E30] active:scale-98 disabled:opacity-75"
              >
                {isSwitching && switchingRole === 'healthcare' ? (
                  <span className="inline-flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-[#0B1E30] border-t-transparent animate-spin" />
                    <span>Loading Clinician Account...</span>
                  </span>
                ) : (
                  <>
                    <span>{t('auth.continueAsClinician') || 'Continue as Clinician'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isSwitching}
                onClick={(e) => handleInstantDemo(e, 'healthcare')}
                className="w-full text-center py-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
              >
                <Sparkles className="w-3 h-3 text-[#93C5FD]" />
                <span>{t('auth.instantDemoDrArun') || 'Instant Demo: Dr. Phukan'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* 4. MINIMAL EDITORIAL FOOTER */}
      <footer className="relative z-20 w-full border-t border-white/10 mt-12 py-6 bg-[#070B0E]/80">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white tracking-tight">SmritiCare</span>
            <span className="text-slate-500">•</span>
            <span>{t('common.footerTagline') || 'Care Connects Generations.'}</span>
          </div>

          <div className="flex items-center space-x-6 text-slate-400">
            <button onClick={() => navigate('/')} className="hover:text-slate-200 transition-colors cursor-pointer">
              Privacy
            </button>
            <button onClick={() => navigate('/')} className="hover:text-slate-200 transition-colors cursor-pointer">
              Terms
            </button>
            <button onClick={() => navigate('/')} className="hover:text-slate-200 transition-colors cursor-pointer">
              Support
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
