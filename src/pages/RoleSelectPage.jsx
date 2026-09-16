import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, HeartHandshake, Stethoscope, ArrowRight, Sparkles, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function RoleSelectPage() {
  const navigate = useNavigate();
  const { loginDemo } = useAuth();
  const { t } = useLanguage();

  const handleSelectRole = (role) => {
    navigate(`/login?role=${role}`);
  };

  const handleInstantDemo = async (e, role) => {
    e.stopPropagation();
    await loginDemo(role);
    if (role === 'patient') {
      navigate('/patient/home');
    } else if (role === 'healthcare') {
      navigate('/clinician/dashboard');
    } else {
      navigate('/caregiver/dashboard');
    }
  };

  const roles = [
    {
      id: 'patient',
      title: t('auth.patientTitle') || 'Senior / Patient',
      tag: t('auth.patientTag') || 'Elderly Care & Cognitive Training',
      desc: t('auth.patientDesc') || 'Voice-guided routines, tactile cognitive games, and a simplified 4-digit PIN login designed for seniors.',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256',
      icon: Brain,
      themeColor: 'from-emerald-600 to-teal-700',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      actionBtnClass: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white',
      continueLabel: t('auth.patientContinue') || 'Continue as Patient',
      demoLabel: `${t('auth.tryDemo') || 'Try Demo Profile'} (Amma)`
    },
    {
      id: 'caregiver',
      title: t('auth.caregiverTitle') || 'Family Caregiver',
      tag: t('auth.caregiverTag') || 'Family & Home Care Monitoring',
      desc: t('auth.caregiverDesc') || 'Longitudinal cognitive trajectory trends, daily medication adherence, and proactive clinical care alerts.',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
      icon: HeartHandshake,
      themeColor: 'from-orange-600 to-amber-700',
      badgeClass: 'bg-orange-50 dark:bg-orange-950/70 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800',
      actionBtnClass: 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white',
      continueLabel: t('auth.caregiverContinue') || 'Continue as Caregiver',
      demoLabel: `${t('auth.tryDemo') || 'Try Demo Profile'} (Priya)`
    },
    {
      id: 'healthcare',
      title: t('auth.healthcareTitle') || 'Healthcare Professional',
      tag: t('auth.healthcareTag') || 'Clinical & Community Health',
      desc: t('auth.healthcareDesc') || 'Standardized neuro-cognitive assessments, PHC patient coordination, and automated longitudinal reports.',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=256',
      icon: Stethoscope,
      themeColor: 'from-teal-600 to-cyan-700',
      badgeClass: 'bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      actionBtnClass: 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white',
      continueLabel: t('auth.healthcareContinue') || 'Continue as Clinician',
      demoLabel: `${t('auth.tryDemo') || 'Try Demo Profile'} (Dr. Phukan)`
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-14 relative z-10">
      {/* Back to Home Button */}
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 dark:bg-[#131D33]/80 hover:bg-white dark:hover:bg-[#1E293B] border border-slate-200/80 dark:border-[#243352] text-slate-700 dark:text-slate-200 font-bold text-sm mb-8 transition-all shadow-xs backdrop-blur-md cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('common.back') || 'Back to Overview'}</span>
      </button>

      {/* Heading Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="inline-block px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider text-smriti-teal-700 dark:text-teal-400 bg-teal-50/90 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 mb-3 backdrop-blur-xs">
          Role-Based Access
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white font-display tracking-tight">
          {t('auth.howWillYouUse') || 'How will you use SmritiCare?'}
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg font-medium mt-2 leading-relaxed">
          {t('auth.chooseExperience') || "Choose the experience that's right for you."}
        </p>
      </div>

      {/* 3 Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {roles.map((r, idx) => {
          const IconComponent = r.icon;
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.1 }}
              whileHover={{ y: -6 }}
              className="bg-white/90 dark:bg-[#131D33]/90 backdrop-blur-xl rounded-3xl p-6 lg:p-7 border border-white/80 dark:border-[#243352]/90 shadow-xl hover:shadow-2xl shadow-teal-950/5 dark:shadow-black/50 flex flex-col justify-between transition-all duration-300 group"
            >
              <div>
                {/* Card Top: Photo & Icon Badge */}
                <div className="flex items-center justify-between mb-5">
                  <div className="relative">
                    <img
                      src={r.avatar}
                      alt={r.title}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-white dark:border-[#243352] shadow-md"
                    />
                    <div className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-xl bg-gradient-to-br ${r.themeColor} text-white flex items-center justify-center shadow-xs`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                  </div>

                  <span className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${r.badgeClass}`}>
                    {r.tag}
                  </span>
                </div>

                {/* Role Title & Description */}
                <h3 className="text-2xl font-black text-slate-900 dark:text-white font-display group-hover:text-smriti-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {r.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm font-medium mt-2.5 leading-relaxed">
                  {r.desc}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-5 border-t border-slate-200/70 dark:border-[#243352] space-y-3">
                <button
                  onClick={() => handleSelectRole(r.id)}
                  className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer transform active:scale-98 ${r.actionBtnClass}`}
                >
                  <span>{r.continueLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => handleInstantDemo(e, r.id)}
                  className="w-full py-2.5 px-3 rounded-2xl bg-slate-100/90 hover:bg-slate-200/90 dark:bg-[#1E293B]/80 dark:hover:bg-[#25334D] text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{r.demoLabel}</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Safety & Local Privacy Note */}
      <div className="mt-12 text-center text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span>All authentication is processed locally with offline IndexedDB fallback.</span>
      </div>
    </div>
  );
}
