import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  User, 
  Users, 
  Stethoscope, 
  HelpCircle, 
  Sun, 
  Moon, 
  ChevronDown, 
  Delete, 
  Sparkles, 
  AlertCircle,
  LayoutGrid,
  KeyRound
} from 'lucide-react';
import { SmritiLogo } from '../components/common/NerIcons';
import { db } from '../db/dexie';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';
import { playCardFlipSound, playMatchSuccessSound } from '../audio/synthAudio';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const roleParam = searchParams.get('role') || 'patient';
  
  const { currentUser, loginWithPin, loginWithEmail, loginWithGoogle, loginDemo, register, sendPasswordResetEmail } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const [activeRole, setActiveRole] = useState(roleParam);
  const [patientAuthMode, setPatientAuthMode] = useState('pin'); // 'pin' | 'email'

  // Only auto-redirect if returning from an explicit OAuth callback code/token
  useEffect(() => {
    const isOAuthCallback = window.location.hash.includes('access_token') || searchParams.has('code');
    if (currentUser && isOAuthCallback) {
      const targetRole = currentUser.role || activeRole;
      if (targetRole === 'healthcare' || targetRole === 'clinician') {
        navigate('/clinician/dashboard', { replace: true });
      } else if (targetRole === 'patient') {
        navigate('/patient/home', { replace: true });
      } else {
        navigate('/caregiver/dashboard', { replace: true });
      }
    }
  }, [currentUser, activeRole, navigate, searchParams]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pin, setPin] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState(null);

  // Multi-screen design comparison view toggle
  const [showComparisonView, setShowComparisonView] = useState(false);

  // Patient lookup for personalized card
  const [patientUser, setPatientUser] = useState(null);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState(null);
  const [isSendingReset, setIsSendingReset] = useState(false);

  // Sign up modal for new account
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpPin, setSignUpPin] = useState('1234');
  const [signUpDesignation, setSignUpDesignation] = useState('PHC Medical Officer');
  const [signUpError, setSignUpError] = useState('');

  useEffect(() => {
    setActiveRole(roleParam);
    setErrorMsg('');
    setGoogleError(null);
    setPin('');
  }, [roleParam]);

  useEffect(() => {
    async function loadPatient() {
      try {
        const p = await db.users.where('role').equals('patient').first();
        if (p) setPatientUser(p);
      } catch (err) {
        console.warn('Patient lookup:', err);
      }
    }
    loadPatient();
  }, []);

  // Keyboard listener for patient PIN keypad
  useEffect(() => {
    if (activeRole !== 'patient' || patientAuthMode !== 'pin') return;
    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        if (pin.length < 4) {
          playCardFlipSound();
          setPin((prev) => prev + e.key);
        }
      } else if (e.key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1));
      } else if (e.key === 'Enter' && pin.length === 4) {
        handlePatientPinSubmit(pin);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeRole, patientAuthMode, pin]);

  // Handle PIN submission
  const handlePatientPinSubmit = async (enteredPin) => {
    if (enteredPin.length !== 4) return;
    setIsLoading(true);
    setErrorMsg('');
    const res = await loginWithPin(enteredPin, 'patient');
    setIsLoading(false);
    if (res.success) {
      setIsSuccess(true);
      playMatchSuccessSound();
      setTimeout(() => navigate('/patient/home'), 350);
    } else {
      setErrorMsg(res.error || "That PIN doesn't match. Please try again.");
      setPin('');
    }
  };

  // Handle keypad button click
  const handleKeypadPress = (val) => {
    if (val === 'backspace') {
      setPin((prev) => prev.slice(0, -1));
    } else if (val === 'continue') {
      if (pin.length === 4) {
        handlePatientPinSubmit(pin);
      } else {
        setErrorMsg('Please enter all 4 digits of your PIN.');
      }
    } else {
      if (pin.length < 4) {
        playCardFlipSound();
        const nextPin = pin + val;
        setPin(nextPin);
        if (nextPin.length === 4) {
          setTimeout(() => handlePatientPinSubmit(nextPin), 150);
        }
      }
    }
  };

  // Form Submit for Email + Password across all roles (Strict Role-Enforced)
  const handleSignIn = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }

    setIsLoading(true);
    const res = await loginWithEmail(email, password, activeRole);
    setIsLoading(false);

    if (res.success) {
      setIsSuccess(true);
      playMatchSuccessSound();
      setTimeout(() => {
        if (res.user.role === 'healthcare' || res.user.role === 'clinician') {
          navigate('/clinician/dashboard');
        } else if (res.user.role === 'patient') {
          navigate('/patient/home');
        } else {
          navigate('/caregiver/dashboard');
        }
      }, 400);
    } else {
      setErrorMsg(res.error || "We couldn't sign you in. Please check your credentials.");
    }
  };

  // Quick 1-Tap Demo Login
  const handleQuickDemo = async (role) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const user = await loginDemo(role);
      setIsLoading(false);
      setIsSuccess(true);
      playMatchSuccessSound();
      const finalRole = user?.role || role;
      setTimeout(() => {
        if (finalRole === 'patient') navigate('/patient/home');
        else if (finalRole === 'healthcare' || finalRole === 'clinician') navigate('/clinician/dashboard');
        else navigate('/caregiver/dashboard');
      }, 350);
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Could not log into demo.');
    }
  };

  // Real Google OAuth Handler with strict role enforcement
  const handleGoogleSignIn = async (roleKey) => {
    setGoogleLoading(true);
    setGoogleError(null);
    setErrorMsg('');
    try {
      const res = await loginWithGoogle(roleKey);
      if (res?.success) {
        if (res.url) {
          window.location.href = res.url;
          return;
        }
        setIsSuccess(true);
        playMatchSuccessSound();
        const finalRole = res.user?.role || roleKey;
        setTimeout(() => {
          if (finalRole === 'patient') navigate('/patient/home');
          else if (finalRole === 'healthcare' || finalRole === 'clinician') navigate('/clinician/dashboard');
          else navigate('/caregiver/dashboard');
        }, 350);
      } else {
        setGoogleError(res?.error || 'Google authentication could not be completed.');
      }
    } catch (err) {
      setGoogleError(err.message || 'Google authentication encountered an issue.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Forgot password handler
  const handleSendReset = async (e) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      setForgotStatus({ type: 'error', message: 'Valid email is required.' });
      return;
    }
    setIsSendingReset(true);
    setForgotStatus(null);
    const res = await sendPasswordResetEmail(forgotEmail);
    setIsSendingReset(false);
    if (res.success) {
      setForgotStatus({ type: 'success', message: res.message });
    } else {
      setForgotStatus({ type: 'error', message: res.error || 'Failed to send reset link.' });
    }
  };

  // Registration handler with role-specific constraints
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setSignUpError('');

    const name = signUpName.trim();
    if (!name || name.length < 2) {
      setSignUpError(t('auth.validationNameRequired') || 'Full name is required (minimum 2 characters).');
      return;
    }

    const emailTrimmed = signUpEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrimmed || !emailRegex.test(emailTrimmed)) {
      setSignUpError(t('auth.validationEmailRequired') || 'Please enter a valid email address.');
      return;
    }

    if (!signUpPassword || signUpPassword.length < 4) {
      setSignUpError(t('auth.passwordMinLength') || 'Password must be at least 4 characters.');
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpError(t('auth.passwordMismatch') || 'Passwords do not match. Please verify and retype.');
      return;
    }

    if (activeRole === 'patient' && (!signUpPin || !/^\d{4}$/.test(signUpPin.trim()))) {
      setSignUpError('Patient PIN must be exactly 4 numeric digits.');
      return;
    }

    setIsLoading(true);
    const res = await register({
      name,
      email: emailTrimmed,
      password: signUpPassword,
      role: activeRole,
      pin: activeRole === 'patient' ? (signUpPin.trim() || '1234') : undefined,
      designation: activeRole === 'healthcare' ? signUpDesignation : undefined
    });
    setIsLoading(false);

    if (res.success) {
      setShowSignUpModal(false);
      setIsSuccess(true);
      playMatchSuccessSound();
      setTimeout(() => {
        if (activeRole === 'healthcare' || activeRole === 'clinician') navigate('/clinician/dashboard');
        else if (activeRole === 'patient') navigate('/patient/home');
        else navigate('/caregiver/dashboard');
      }, 350);
    } else {
      setSignUpError(res.error || 'Registration failed.');
    }
  };

  // Role Configuration Data
  const roleConfigs = {
    patient: {
      roleKey: 'patient',
      roleLabel: t('auth.elderPatientMode') || 'ELDERLY PATIENT MODE',
      roleIcon: User,
      badgeTextClass: 'text-[#86EFAC]',
      badgeBgClass: 'bg-[#142A24] border-[#1E4339]',
      accentColor: '#99D5B7',
      accentHover: '#86EFAC',
      accentText: '#081C15',
      buttonClass: 'bg-[#99D5B7] hover:bg-[#86EFAC] text-[#081C15]',
      photo: '/assets/images/auth-patient.jpg',
      headline: t('auth.patientTagline') ? `“${t('auth.patientTagline')}”` : '“Because every memory matters.”',
      bottomTagline: t('auth.patientDesc') || 'A safer, kinder tomorrow for our loved ones.',
      subtitle: t('auth.pinPrompt') || 'Enter your 4-digit PIN or sign in with your senior account.',
      demoName: 'Bimala Borah',
      demoTag: 'AMMA',
      demoPin: '1234'
    },
    caregiver: {
      roleKey: 'caregiver',
      roleLabel: t('auth.familyCaregiverMode') || 'FAMILY CAREGIVER',
      roleIcon: Users,
      badgeTextClass: 'text-[#FCA5A5]',
      badgeBgClass: 'bg-[#2E1813] border-[#4D2820]',
      accentColor: '#F4A88E',
      accentHover: '#FCA590',
      accentText: '#280F08',
      buttonClass: 'bg-[#F4A88E] hover:bg-[#FCA590] text-[#280F08]',
      photo: '/assets/images/auth-caregiver.jpg',
      headline: t('auth.caregiverTagline') ? `“${t('auth.caregiverTagline')}”` : '“You care every day. We’re here to support you.”',
      bottomTagline: t('auth.caregiverDesc') || 'Tools for a more connected tomorrow.',
      subtitle: t('auth.chooseExperience') || 'Sign in to continue supporting your loved one.',
      demoName: 'Priya Sharma',
      demoTag: 'DAUGHTER'
    },
    healthcare: {
      roleKey: 'healthcare',
      roleLabel: t('auth.healthcareMode') || 'HEALTHCARE PROFESSIONAL',
      roleIcon: Stethoscope,
      badgeTextClass: 'text-[#93C5FD]',
      badgeBgClass: 'bg-[#132233] border-[#1F3752]',
      accentColor: '#8CB8DE',
      accentHover: '#93C5FD',
      accentText: '#0B1E30',
      buttonClass: 'bg-[#8CB8DE] hover:bg-[#93C5FD] text-[#0B1E30]',
      photo: '/assets/images/auth-clinician.jpg',
      headline: t('auth.clinicianTagline') ? `“${t('auth.clinicianTagline')}”` : '“Empowering professionals. Improving lives.”',
      bottomTagline: t('auth.healthcareDesc') || 'Data. Care. A healthier tomorrow.',
      subtitle: t('auth.healthcareDesc') || 'Sign in securely to access your clinical workspace.',
      demoName: 'Dr. Arun Phukan',
      demoTag: 'CLINICIAN'
    }
  };

  const currentConfig = roleConfigs[activeRole] || roleConfigs.patient;

  // Single Role Split-Screen Component with Viewport-Fit
  const renderAuthScreen = (config, isPreview = false) => {
    const RoleIcon = config.roleIcon;
    const isPatient = config.roleKey === 'patient';
    const isCaregiver = config.roleKey === 'caregiver';

    return (
      <div className={`w-full h-full flex flex-col lg:flex-row bg-[#080D11] text-slate-100 ${isPreview ? 'rounded-2xl overflow-hidden border border-white/15 shadow-2xl scale-100 min-h-[580px]' : 'lg:h-full lg:overflow-hidden'}`}>
        {/* LEFT COLUMN: PHOTOGRAPHY & BRAND STORYTELLING (~50%) */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 shrink-0">
          <div className="relative w-full max-w-lg h-[340px] sm:h-[400px] lg:h-[480px] xl:h-[520px] max-h-[calc(100vh-6.5rem)] rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-between p-6 sm:p-8">
            <div 
              className="absolute inset-0 bg-cover bg-center transform scale-100 transition-transform duration-700"
              style={{ backgroundImage: `url('${config.photo}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/35 pointer-events-none" />

            <div className="relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                {config.roleLabel}
              </span>
            </div>

            <div className="relative z-10 max-w-md my-auto">
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-white leading-tight drop-shadow-md">
                {config.headline}
              </h1>
            </div>

            <div className="relative z-10">
              <p className="text-xs text-white/70 font-normal">
                {config.bottomTagline}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AUTHENTICATION PANEL (~50%) */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 shrink-0">
          <div className="w-full max-w-md flex flex-col justify-center space-y-3 sm:space-y-4">
            {/* Top Bar: Choose Role & Need Help */}
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <button
                type="button"
                onClick={() => navigate('/role-select')}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('auth.chooseRole') || 'Choose Role'}</span>
              </button>

              <button
                type="button"
                onClick={() => alert('For support, email support@smriticare.org or use the 1-tap instant demo below.')}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{t('auth.needHelp') || 'Need help?'}</span>
              </button>
            </div>

            {/* Role Header Badge & Heading */}
            <div>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${config.badgeBgClass} ${config.badgeTextClass}`}>
                <RoleIcon className="w-3 h-3" />
                <span>{config.roleLabel}</span>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-white mt-2 tracking-tight">
                {t('auth.welcomeBack') || 'Welcome Back'}
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                {config.subtitle}
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-950/70 border border-rose-700 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="leading-snug">{errorMsg}</span>
              </div>
            )}

            {/* Google OAuth Error Alert */}
            {googleError && (
              <div className="p-2.5 rounded-lg bg-rose-950/70 border border-rose-700 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="leading-snug">{googleError}</span>
              </div>
            )}

            {/* Form Area: PATIENT (PIN or Email) vs CAREGIVER / CLINICIAN FORM */}
            <div>
              {isPatient && patientAuthMode === 'pin' ? (
                /* SCREEN 1A: SENIOR / PATIENT (PIN Keypad Mode) */
                <div className="space-y-3.5">
                  {/* Patient Profile Card (Compact & Dignified) */}
                  <div className="p-2.5 rounded-xl bg-[#111A22] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 shrink-0 bg-slate-800">
                        <img 
                          src="/assets/images/auth-patient.jpg" 
                          alt="Bimala Borah" 
                          className="w-full h-full object-cover object-center"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">
                            {patientUser?.name || 'Bimala Borah'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#142A24] text-[#86EFAC] border border-[#1E4339]">
                            {patientUser?.tag || 'AMMA'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block">
                          {t('auth.pinPrompt') || 'Enter 4-Digit Secret PIN'}
                        </span>
                      </div>
                    </div>
                    <ShieldCheck className="w-4 h-4 text-[#86EFAC] opacity-80 mr-1" />
                  </div>

                  {/* 4 PIN Indicator Circles */}
                  <div className="flex items-center justify-center gap-3.5 py-1">
                    {[0, 1, 2, 3].map((idx) => {
                      const isFilled = pin.length > idx;
                      return (
                        <div
                          key={idx}
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border transition-all duration-200 flex items-center justify-center ${
                            isFilled
                              ? 'bg-[#86EFAC] border-[#86EFAC] scale-110 shadow-sm'
                              : 'border-white/30 bg-transparent'
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Accessible Numeric Keypad */}
                  <div className="grid grid-cols-3 gap-2 max-w-[280px] sm:max-w-[300px] mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleKeypadPress(num.toString())}
                        className="py-2.5 sm:py-3 rounded-lg bg-[#131B24] hover:bg-[#1C2733] border border-white/5 text-white font-medium text-base transition-all active:scale-95 shadow-xs cursor-pointer select-none"
                      >
                        {num}
                      </button>
                    ))}
                    
                    {/* Backspace Button */}
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('backspace')}
                      className="py-2.5 sm:py-3 rounded-lg bg-[#131B24] hover:bg-[#1C2733] border border-white/5 text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer select-none"
                      aria-label="Delete"
                    >
                      <Delete className="w-4 h-4" />
                    </button>

                    {/* Zero */}
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('0')}
                      className="py-2.5 sm:py-3 rounded-lg bg-[#131B24] hover:bg-[#1C2733] border border-white/5 text-white font-medium text-base transition-all active:scale-95 shadow-xs cursor-pointer select-none"
                    >
                      0
                    </button>

                    {/* Continue Button */}
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('continue')}
                      className="py-2.5 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all active:scale-95 shadow-md flex items-center justify-center cursor-pointer bg-[#99D5B7] hover:bg-[#86EFAC] text-[#081C15]"
                    >
                      {t('common.continue') || 'Continue'}
                    </button>
                  </div>

                  {/* Switch to Password Option */}
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPatientAuthMode('email');
                        setErrorMsg('');
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3 h-3 text-[#86EFAC]" />
                      <span>Or sign in with Senior Email & Password</span>
                    </button>
                  </div>

                  {/* Google OAuth Button for Patient */}
                  <button
                    type="button"
                    disabled={googleLoading || isLoading}
                    onClick={() => handleGoogleSignIn('patient')}
                    className="w-full py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                  >
                    {googleLoading ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    )}
                    <span>{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
                  </button>

                  {/* 1-Tap Demo Shortcut */}
                  <div className="text-center pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleQuickDemo('patient')}
                      className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-[#86EFAC] transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-[#86EFAC]" />
                      <span>{t('auth.instantDemoAmma') || 'Instant Demo: Sign in as Amma (PIN: 1234)'}</span>
                    </button>
                  </div>

                  {/* Create Account Link for Patient */}
                  <div className="text-center pt-0.5">
                    <p className="text-[11px] text-slate-400">
                      {t('auth.newHere') || 'New here?'}{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setSignUpError('');
                          setShowSignUpModal(true);
                        }}
                        className="text-slate-200 hover:text-[#86EFAC] underline cursor-pointer"
                      >
                        {t('auth.newPatientPrompt') || 'Create Patient Account'}
                      </button>
                    </p>
                  </div>
                </div>
              ) : (
                /* SCREEN 1B, 2 & 3: EMAIL + PASSWORD FORM */
                <form onSubmit={handleSignIn} className="space-y-3">
                  {/* Field 1: Email or Phone */}
                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">
                      {isPatient 
                        ? 'Patient Email Address' 
                        : isCaregiver 
                        ? (t('auth.email') || 'Email Address') 
                        : (t('auth.professionalEmail') || 'Professional Email')}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        placeholder={isPatient ? 'amma@smriticare.org' : isCaregiver ? 'priya@smriticare.org' : 'phukan@health.assam.gov.in'}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg text-xs sm:text-sm bg-[#131B24] text-white border border-white/10 focus:outline-none focus:border-white/40 transition-colors placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  {/* Field 2: Password with Show/Hide Eye Toggle */}
                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">
                      {t('auth.password') || 'Password'}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-9 py-2 rounded-lg text-xs sm:text-sm bg-[#131B24] text-white border border-white/10 focus:outline-none focus:border-white/40 transition-colors placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password Row */}
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-white/20 bg-[#131B24] text-[#86EFAC] focus:ring-0 cursor-pointer"
                      />
                      <span className="text-[11px]">{t('auth.rememberMe') || 'Remember me'}</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {t('auth.forgotPassword') || 'Forgot password?'}
                    </button>
                  </div>

                  {/* Primary Submit Button */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 ${config.buttonClass} active:scale-98`}
                    >
                      {isLoading ? (
                        <span>{t('auth.signingIn') || 'Signing In...'}</span>
                      ) : (
                        <span>{t('auth.signInButton') || 'Sign In'}</span>
                      )}
                    </button>
                  </div>

                  {/* Patient PIN Toggle */}
                  {isPatient && (
                    <div className="text-center pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setPatientAuthMode('pin');
                          setErrorMsg('');
                        }}
                        className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-[#86EFAC] transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="w-3 h-3 text-[#86EFAC]" />
                        <span>Or switch to 4-Digit Keypad PIN</span>
                      </button>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="relative flex items-center justify-center py-1">
                    <div className="border-t border-white/10 w-full" />
                    <span className="bg-[#080D11] px-2 text-[10px] text-slate-500 uppercase">
                      {t('common.or') || 'or'}
                    </span>
                  </div>

                  {/* Google OAuth Button */}
                  <button
                    type="button"
                    disabled={googleLoading || isLoading}
                    onClick={() => handleGoogleSignIn(config.roleKey)}
                    className="w-full py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                  >
                    {googleLoading ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    )}
                    <span>{googleLoading ? 'Connecting...' : (t('auth.continueWithGoogle') || 'Continue with Google')}</span>
                  </button>

                  {/* Create Account Link */}
                  <div className="text-center pt-0.5">
                    <p className="text-[11px] text-slate-400">
                      {t('auth.newHere') || 'New here?'}{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setSignUpError('');
                          setShowSignUpModal(true);
                        }}
                        className="text-slate-200 hover:text-white underline cursor-pointer"
                      >
                        {t('auth.createAccountTitle') || 'Create an account'}
                      </button>
                    </p>
                  </div>

                  {/* Instant Demo Pill */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => handleQuickDemo(config.roleKey)}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{t('auth.tryDemo') || 'Instant Demo'}: {config.demoName}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen bg-[#070B0E] text-slate-100 flex flex-col justify-between relative selection:bg-emerald-500/20 selection:text-emerald-300 font-sans overflow-x-hidden lg:overflow-hidden">
      {/* 1. SINGLE GLOBAL SMRITICARE HEADER (ONLY LOGO ON THE ENTIRE PAGE) */}
      <header className="w-full h-14 border-b border-white/10 backdrop-blur-md bg-[#070B0E]/90 px-6 lg:px-12 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-lg bg-[#142A24] border border-[#1E4339] flex items-center justify-center p-1 shadow-xs">
            <SmritiLogo className="w-full h-full text-[#86EFAC]" showText={false} />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">
            SmritiCare
          </span>
        </div>

        {/* Center Links */}
        <nav className="hidden md:flex items-center space-x-7 text-xs font-medium text-slate-300">
          <button onClick={() => navigate('/')} className="hover:text-white transition-colors cursor-pointer">
            {t('navigation.home') || 'Home'}
          </button>
          <button onClick={() => navigate('/#about')} className="hover:text-white transition-colors cursor-pointer">
            {t('navigation.about') || 'About'}
          </button>
          <button onClick={() => navigate('/economy')} className="hover:text-white transition-colors cursor-pointer">
            {t('navigation.resources') || 'Resources'}
          </button>
          <button onClick={() => navigate('/#contact')} className="hover:text-white transition-colors cursor-pointer">
            {t('navigation.contact') || 'Contact'}
          </button>
        </nav>

        {/* Right Controls: Role Switcher, Comparison Toggle, Theme, Language Selector */}
        <div className="flex items-center gap-3">
          {/* Quick Role Switcher */}
          <div className="hidden sm:flex items-center gap-1 p-0.5 rounded-full bg-white/5 border border-white/10 text-[11px]">
            <button
              type="button"
              onClick={() => setSearchParams({ role: 'patient' })}
              className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                activeRole === 'patient' && !showComparisonView
                  ? 'bg-[#142A24] text-[#86EFAC] font-bold shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('common.patient') || 'Patient'}
            </button>
            <button
              type="button"
              onClick={() => setSearchParams({ role: 'caregiver' })}
              className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                activeRole === 'caregiver' && !showComparisonView
                  ? 'bg-[#2E1813] text-[#FCA5A5] font-bold shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('common.caregiver') || 'Caregiver'}
            </button>
            <button
              type="button"
              onClick={() => setSearchParams({ role: 'healthcare' })}
              className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                activeRole === 'healthcare' && !showComparisonView
                  ? 'bg-[#132233] text-[#93C5FD] font-bold shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('common.clinician') || 'Clinician'}
            </button>
          </div>

          {/* All 3 Screens Toggle for Design Verification */}
          <button
            type="button"
            onClick={() => setShowComparisonView(!showComparisonView)}
            className={`hidden xl:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
              showComparisonView 
                ? 'bg-emerald-950/80 text-[#86EFAC] border-[#86EFAC]/40' 
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
            }`}
            title="Toggle All 3 Screens Comparison View"
          >
            <LayoutGrid className="w-3 h-3" />
            <span>{showComparisonView ? 'Focused' : 'All 3'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-slate-300" />}
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative inline-flex items-center">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="appearance-none bg-transparent hover:bg-white/5 text-slate-300 hover:text-white text-xs font-medium rounded-full pl-2.5 pr-6 py-1 border border-white/10 cursor-pointer focus:outline-none"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-[#0E151D] text-white">
                  {lang.flag} {lang.native}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
          </div>
        </div>
      </header>

      {/* 2. MAIN VIEWPORT-BOUND CONTENT VIEW */}
      <main className="flex-1 min-h-0 w-full h-[calc(100vh-3.5rem)] flex flex-col justify-center overflow-y-auto lg:overflow-hidden bg-[#070B0E]">
        {showComparisonView ? (
          /* COMPARISON VIEW: SHOWS ALL THREE SCREENS IN ONE OVERVIEW */
          <div className="h-full overflow-y-auto p-6 space-y-8 max-w-7xl mx-auto w-full">
            <div className="text-center max-w-xl mx-auto mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#86EFAC]">
                DESIGN SYSTEM COMPARISON
              </span>
              <h2 className="font-serif text-2xl font-normal text-white mt-1">
                Unified Three-Role Authentication
              </h2>
            </div>

            {/* Screen 1: Patient */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold text-[#86EFAC] uppercase tracking-wider">
                  Senior / Patient Mode (Keypad PIN)
                </span>
                <button
                  onClick={() => { setShowComparisonView(false); setSearchParams({ role: 'patient' }); }}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Focus View
                </button>
              </div>
              {renderAuthScreen(roleConfigs.patient, true)}
            </div>

            {/* Screens 2 & 3: Side-by-Side */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-bold text-[#FCA5A5] uppercase tracking-wider">
                    Family Caregiver Mode
                  </span>
                  <button
                    onClick={() => { setShowComparisonView(false); setSearchParams({ role: 'caregiver' }); }}
                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Focus View
                  </button>
                </div>
                {renderAuthScreen(roleConfigs.caregiver, true)}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-bold text-[#93C5FD] uppercase tracking-wider">
                    Healthcare Professional Mode
                  </span>
                  <button
                    onClick={() => { setShowComparisonView(false); setSearchParams({ role: 'healthcare' }); }}
                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Focus View
                  </button>
                </div>
                {renderAuthScreen(roleConfigs.healthcare, true)}
              </div>
            </div>
          </div>
        ) : (
          /* DEFAULT FOCUSED MODE: 100vh Desktop Viewport-Bound Screen */
          renderAuthScreen(currentConfig, false)
        )}
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E151D] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-serif text-xl text-white">
              {t('auth.resetPasswordTitle') || 'Reset Your Password'}
            </h3>
            <p className="text-xs text-slate-400">
              {t('auth.recoverPasswordDesc') || "Enter your email address and we'll send you instructions to reset your account."}
            </p>

            {forgotStatus && (
              <div className={`p-3 rounded-lg text-xs ${forgotStatus.type === 'success' ? 'bg-emerald-950 border border-emerald-800 text-emerald-300' : 'bg-rose-950 border border-rose-800 text-rose-300'}`}>
                {forgotStatus.message}
              </div>
            )}

            <form onSubmit={handleSendReset} className="space-y-3">
              <input
                type="email"
                required
                placeholder={t('auth.emailPlaceholder') || 'name@example.com'}
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-sm bg-[#131B24] text-white border border-white/10 focus:outline-none focus:border-white/30"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-300 hover:text-white cursor-pointer"
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSendingReset}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-white text-slate-950 hover:bg-slate-200 cursor-pointer"
                >
                  {isSendingReset ? (t('auth.verifyingAccount') || 'Sending...') : (t('auth.sendRecoveryLink') || 'Send Reset Link')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sign Up Modal */}
      {showSignUpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0E151D] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-serif text-xl text-white">
                {t('auth.createAccountTitle') || 'Create Account'} ({currentConfig.roleLabel})
              </h3>
              <button
                type="button"
                onClick={() => setShowSignUpModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {signUpError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{signUpError}</span>
              </div>
            )}

            <form onSubmit={handleSignUpSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">{t('auth.fullName') || 'Full Name'} *</label>
                <input
                  type="text"
                  required
                  placeholder={t('auth.fullNamePlaceholder') || 'Your Name'}
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm bg-[#131B24] text-white border border-white/10 focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">{t('auth.email') || 'Email Address'} *</label>
                <input
                  type="email"
                  required
                  placeholder={t('auth.emailPlaceholder') || 'name@example.com'}
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm bg-[#131B24] text-white border border-white/10 focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">{t('auth.password') || 'Password'} *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 4 chars"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm bg-[#131B24] text-white border border-white/10 focus:outline-none focus:border-white/30"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">{t('auth.confirmPassword') || 'Confirm Password'} *</label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat password"
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm bg-[#131B24] text-white border border-white/10 focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              {activeRole === 'patient' && (
                <div>
                  <label className="block text-xs text-slate-300 mb-1">{t('auth.patientPin4Digit') || '4-Digit Secret PIN'} *</label>
                  <input
                    type="text"
                    maxLength="4"
                    required
                    placeholder="1234"
                    value={signUpPin}
                    onChange={(e) => setSignUpPin(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg text-sm bg-[#131B24] text-white border border-white/10 focus:outline-none focus:border-white/30 font-mono tracking-widest text-center"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {t('auth.patientPinDesc') || 'Direct numeric PIN for elder voice and keypad sign-in'}
                  </p>
                </div>
              )}

              {activeRole === 'healthcare' && (
                <div>
                  <label className="block text-xs text-slate-300 mb-1">{t('clinician.designation') || 'Designation / Specialty'}</label>
                  <select
                    value={signUpDesignation}
                    onChange={(e) => setSignUpDesignation(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm bg-[#131B24] text-white border border-white/10 focus:outline-none focus:border-white/30"
                  >
                    <option value="PHC Medical Officer">PHC Medical Officer</option>
                    <option value="Community Neurologist">Community Neurologist</option>
                    <option value="Clinical Psychologist">Clinical Psychologist</option>
                    <option value="Community Health Officer (CHO)">Community Health Officer (CHO)</option>
                    <option value="Senior Staff Nurse">Senior Staff Nurse</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowSignUpModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-300 hover:text-white cursor-pointer"
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer ${currentConfig.buttonClass}`}
                >
                  {isLoading ? (t('auth.creatingAccount') || 'Creating...') : (t('auth.createAccountButton') || 'Create Account')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
