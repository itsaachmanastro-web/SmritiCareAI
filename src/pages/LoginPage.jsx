import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, User, Sparkles, Delete, Shield, HeartHandshake, Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle, Check } from 'lucide-react';
import ElderButton from '../components/common/ElderButton';
import UserAvatar from '../components/common/UserAvatar';
import { SmritiLogo } from '../components/common/NerIcons';
import { db } from '../db/dexie';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { playCardFlipSound, playMatchSuccessSound } from '../audio/synthAudio';
import ElderlyPinKeypad from '../components/auth/ElderlyPinKeypad';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role') || 'patient';
  const { loginWithPin, loginWithEmail, loginDemo, register, sendPasswordResetEmail } = useAuth();
  const { t } = useLanguage();

  const [activeRole, setActiveRole] = useState(roleParam);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pin, setPin] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Dynamic patient profile for PIN shortcut
  const [registeredPatient, setRegisteredPatient] = useState(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState(null);
  const [isSendingReset, setIsSendingReset] = useState(false);

  useEffect(() => {
    setActiveRole(roleParam);
    setErrorMsg('');
    setPin('');
  }, [roleParam]);

  // Load first available registered patient for accessible 1-tap sign-in
  useEffect(() => {
    async function loadPatient() {
      try {
        const patient = await db.users.where('role').equals('patient').first();
        if (patient) setRegisteredPatient(patient);
      } catch (err) {
        console.warn('Patient lookup notice:', err);
      }
    }
    loadPatient();
  }, []);

  const handleSendReset = async (e) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      setForgotStatus({ type: 'error', message: t('auth.validationEmailRequired') });
      return;
    }
    setIsSendingReset(true);
    setForgotStatus(null);
    const res = await sendPasswordResetEmail(forgotEmail);
    setIsSendingReset(false);
    if (res.success) {
      setForgotStatus({
        type: 'success',
        message: res.message,
        resetToken: res.resetToken,
        email: res.email
      });
    } else {
      setForgotStatus({ type: 'error', message: res.error || t('common.error') });
    }
  };

  // Patient PIN Login Handler
  const handlePatientPinLogin = async (enteredPin) => {
    setIsLoading(true);
    setErrorMsg('');
    const res = await loginWithPin(enteredPin);
    setIsLoading(false);
    if (res.success) {
      setIsSuccess(true);
      playMatchSuccessSound();
      setTimeout(() => {
        navigate('/patient/home');
      }, 350);
      return { success: true };
    } else {
      return {
        success: false,
        error: res.error || t('auth.pinErrorFriendly') || "That PIN doesn't match. Please try again."
      };
    }
  };

  // Form Submit for Caregiver/Healthcare Sign In
  const handleSignIn = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.includes('@')) {
      setErrorMsg(t('auth.validationEmailRequired'));
      return;
    }
    if (password.length < 4) {
      setErrorMsg(t('auth.passwordMinLength'));
      return;
    }

    setIsLoading(true);
    const res = await loginWithEmail(email, password);
    setIsLoading(false);

    if (res.success) {
      setIsSuccess(true);
      playMatchSuccessSound();
      setTimeout(() => {
        if (res.user.role === 'patient') {
          navigate('/patient/home');
        } else if (res.user.role === 'healthcare') {
          navigate('/clinician/dashboard');
        } else {
          navigate('/caregiver/dashboard');
        }
      }, 450);
    } else {
      setErrorMsg(res.error || t('auth.signInErrorFriendly') || "We couldn't sign you in. Please check your email and password.");
    }
  };

  // Form Submit for Registration (New User)
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg(t('auth.validationNameRequired'));
      return;
    }
    if (!email.includes('@')) {
      setErrorMsg(t('auth.validationEmailRequired'));
      return;
    }
    if (activeRole !== 'patient' && password.length < 4) {
      setErrorMsg(t('auth.passwordMinLength'));
      return;
    }
    if (activeRole === 'patient' && pin && pin.length !== 4) {
      setErrorMsg(t('auth.pinPrompt'));
      return;
    }

    setIsLoading(true);
    const res = await register({
      name,
      email,
      password: password || 'demo123',
      role: activeRole,
      pin: pin || (activeRole === 'patient' ? '1234' : undefined)
    });
    setIsLoading(false);

    if (res.success) {
      setIsSuccess(true);
      playMatchSuccessSound();
      setTimeout(() => {
        if (activeRole === 'patient') {
          navigate('/patient/home');
        } else if (activeRole === 'healthcare') {
          navigate('/clinician/dashboard');
        } else {
          navigate('/caregiver/dashboard');
        }
      }, 450);
    } else {
      setErrorMsg(res.error);
    }
  };

  // 1-Tap Demo Quick Login
  const handleQuickDemo = async () => {
    setIsLoading(true);
    try {
      const user = await loginDemo(activeRole);
      setIsLoading(false);
      setIsSuccess(true);
      playMatchSuccessSound();
      setTimeout(() => {
        if (activeRole === 'patient') {
          navigate('/patient/home');
        } else if (activeRole === 'healthcare') {
          navigate('/clinician/dashboard');
        } else {
          navigate('/caregiver/dashboard');
        }
      }, 450);
    } catch (err) {
      setIsLoading(false);
      setErrorMsg('Could not load demo user: ' + (err.message || String(err)));
    }
  };

  return (
    <div className="relative min-h-[calc(100dvh-70px)] sm:min-h-[calc(100vh-80px)] py-6 sm:py-10 px-4 flex flex-col justify-start sm:justify-center items-center overflow-y-auto">
      <div className="relative z-10 w-full max-w-md my-auto animate-in fade-in slide-in-from-bottom-3 duration-300">
        {/* Top Header Row: Back Link & AI Tagline */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <button
            onClick={() => navigate('/role-select')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 dark:bg-[#131D33]/85 hover:bg-white dark:hover:bg-[#1E293B] border border-white/60 dark:border-[#243352]/90 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm shadow-xs backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('auth.chooseRole')}</span>
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider bg-white/80 dark:bg-[#131D33]/85 text-smriti-teal-800 dark:text-teal-300 border border-teal-300/60 dark:border-teal-700/60 shadow-xs backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>{t('auth.aiTagline') || 'AI For Brighter Minds'}</span>
          </div>
        </div>

        {/* Brand Center Halo Badge */}
        <div className="text-center mb-5 flex flex-col items-center">
          <div className="p-3 mb-1.5 rounded-3xl bg-white/85 dark:bg-[#131D33]/85 backdrop-blur-xl border border-white/70 dark:border-[#243352]/80 shadow-lg shadow-teal-900/5 dark:shadow-black/40">
            <SmritiLogo className="w-11 h-11 md:w-13 md:h-13" textClass="text-2xl md:text-3xl font-black text-slate-900 dark:text-white" />
          </div>
        </div>

        {/* Elevated Glassmorphic Card Container */}
        <div className="relative bg-white/90 dark:bg-[#131D33]/90 backdrop-blur-xl rounded-3xl md:rounded-4xl p-6 md:p-8 border border-white/60 dark:border-[#243352]/90 shadow-2xl shadow-teal-950/5 dark:shadow-black/60 transition-all overflow-hidden">
          {/* Smooth Login Success Transition Overlay */}
          {isSuccess && (
            <div className="absolute inset-0 z-50 bg-white/95 dark:bg-[#131D33]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border-2 border-emerald-400 dark:border-emerald-600 flex items-center justify-center text-emerald-600 dark:text-emerald-300 mb-3 shadow-md animate-bounce">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {t('common.success') || 'Welcome to SmritiCare'}
              </h3>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">
                {t('auth.signingIn') || 'Opening your dashboard...'}
              </p>
            </div>
          )}

          {/* Header Title */}
          <div className="text-center mb-6">
            <span className="text-xs font-black uppercase tracking-wider text-smriti-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-700/60">
              {activeRole === 'patient' ? t('auth.elderPatientMode') : activeRole === 'caregiver' ? t('auth.familyCaregiverMode') : t('auth.healthcareMode')}
            </span>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white font-display mt-2">
              {isSignUp
                ? t('auth.createAccountTitle')
                : activeRole === 'patient'
                ? t('auth.patientWelcome')
                : t('auth.loginTitle')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
              {isSignUp
                ? t('profile.offlineEngine')
                : activeRole === 'patient'
                ? t('auth.pinPrompt')
                : t('auth.roleSelectSubtitle')}
            </p>
          </div>

          {/* Role selector in sign up mode */}
          {isSignUp && (
            <div className="flex rounded-2xl bg-slate-100 dark:bg-[#1E293B] p-1 mb-5 border border-slate-200 dark:border-[#243352] text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveRole('caregiver')}
                className={`flex-1 py-2 rounded-xl transition-all ${
                  activeRole === 'caregiver'
                    ? 'bg-white dark:bg-[#25334D] text-smriti-teal-800 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t('auth.familyCaregiverMode')}
              </button>
              <button
                type="button"
                onClick={() => setActiveRole('patient')}
                className={`flex-1 py-2 rounded-xl transition-all ${
                  activeRole === 'patient'
                    ? 'bg-white dark:bg-[#25334D] text-smriti-teal-800 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t('auth.elderPatientMode')}
              </button>
              <button
                type="button"
                onClick={() => setActiveRole('healthcare')}
                className={`flex-1 py-2 rounded-xl transition-all ${
                  activeRole === 'healthcare'
                    ? 'bg-white dark:bg-[#25334D] text-smriti-teal-800 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t('auth.healthcareMode')}
              </button>
            </div>
          )}

          {/* Error Message (Caregiver / Healthcare / Registration) */}
          {errorMsg && activeRole !== 'patient' && (
            <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 rounded-2xl text-rose-800 dark:text-rose-200 text-sm font-bold text-center">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Quick Demo Access Button (Caregiver & Healthcare) */}
          {!isSignUp && activeRole !== 'patient' && (
            <button
              onClick={handleQuickDemo}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-2xl bg-amber-50/90 dark:bg-[#1E293B] hover:bg-amber-100/90 dark:hover:bg-[#25334D] text-amber-900 dark:text-amber-300 border-2 border-amber-300 dark:border-amber-700/60 font-extrabold text-sm mb-6 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{t('auth.tryDemo')}</span>
            </button>
          )}

          {/* 1. REGISTRATION FORM (Sign Up) */}
          {isSignUp ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  {t('auth.fullName')}
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('auth.fullNamePlaceholder')}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-smriti-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-smriti-teal-500"
                    required
                  />
                </div>
              </div>

              {activeRole !== 'patient' ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    {t('auth.password')}
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('auth.passwordPlaceholder')}
                      className="w-full pl-11 pr-11 py-3 rounded-2xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-smriti-teal-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    {t('auth.pinPrompt')}
                  </label>
                  <div className="relative">
                    <Shield className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      maxLength={4}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="1234"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm font-black tracking-widest focus:ring-2 focus:ring-smriti-teal-500 text-center"
                    />
                  </div>
                </div>
              )}

              <ElderButton
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                disabled={isLoading}
              >
                {isLoading ? t('auth.creatingAccount') : t('auth.createAccountButton')}
              </ElderButton>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setErrorMsg(''); }}
                  className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  {t('auth.alreadyHaveAccount')}
                </button>
              </div>
            </form>
          ) : activeRole === 'patient' ? (
            /* 2. PATIENT SIGN-IN (Ultra-Responsive Elderly PIN Keypad) */
            <div className="space-y-4">
              <ElderlyPinKeypad
                registeredPatient={registeredPatient}
                onLoginPin={handlePatientPinLogin}
                onQuickDemo={handleQuickDemo}
                externalError={errorMsg}
                onClearExternalError={() => setErrorMsg('')}
              />

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setErrorMsg(''); }}
                  className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  {t('auth.newToSmritiCare')}
                </button>
              </div>
            </div>
          ) : (
            /* 3. CAREGIVER / HEALTHCARE SIGN IN */
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={activeRole === 'caregiver' ? 'priya@smriticare.org' : 'phukan@health.assam.gov.in'}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-smriti-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    {t('auth.password')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(true);
                      setForgotStatus(null);
                      setForgotEmail(email || '');
                    }}
                    className="text-xs font-bold text-smriti-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder')}
                    className="w-full pl-11 pr-11 py-3 rounded-2xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-smriti-teal-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <ElderButton
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                disabled={isLoading}
              >
                {isLoading ? t('auth.signingIn') : t('auth.signInButton')}
              </ElderButton>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setErrorMsg(''); }}
                  className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  {t('auth.dontHaveAccount')}
                </button>
              </div>
            </form>
          )}

          {toastMsg && (
            <div className="mt-4 p-3 rounded-xl bg-slate-800 text-white text-xs font-bold text-center">
              {toastMsg}
            </div>
          )}
        </div>
      </div>

      {/* Functional Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131D33] rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-[#243352] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#243352]">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-6 h-6 text-smriti-teal-600 dark:text-teal-400" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{t('auth.recoverPassword')}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 mb-4">
              {t('auth.recoverPasswordDesc')}
            </p>

            {forgotStatus && (
              <div
                className={`p-3.5 rounded-2xl mb-4 text-xs font-bold flex items-start gap-2.5 ${
                  forgotStatus.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                }`}
              >
                {forgotStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p>{forgotStatus.message}</p>
                  {forgotStatus.resetToken && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotModal(false);
                        navigate(
                          `/reset-password?email=${encodeURIComponent(forgotStatus.email)}&token=${forgotStatus.resetToken}`
                        );
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      <span>{t('auth.signInWithNewPass')}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSendReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-smriti-teal-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <ElderButton
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                  disabled={isSendingReset || !forgotEmail}
                >
                  {isSendingReset ? t('auth.verifyingAccount') : t('auth.sendRecoveryLink')}
                </ElderButton>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#25334D] text-slate-700 dark:text-slate-300 font-bold text-xs border border-transparent dark:border-[#243352] transition-colors cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
