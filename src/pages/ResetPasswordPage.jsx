import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import ElderButton from '../components/common/ElderButton';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPasswordWithToken } = useAuth();
  const { t } = useLanguage();

  const queryEmail = searchParams.get('email') || '';
  const queryToken = searchParams.get('token') || '';

  const [email, setEmail] = useState(queryEmail);
  const [token, setToken] = useState(queryToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string }
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (queryEmail) setEmail(queryEmail);
    if (queryToken) setToken(queryToken);
  }, [queryEmail, queryToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (!email || !email.includes('@')) {
      setStatus({ type: 'error', message: t('auth.validationEmailRequired') });
      return;
    }
    if (newPassword.length < 6) {
      setStatus({ type: 'error', message: t('auth.validationPasswordLength') });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: t('auth.validationPasswordMatch') });
      return;
    }

    setIsLoading(true);
    const res = await resetPasswordWithToken({
      email: email.trim(),
      token: token.trim(),
      newPassword
    });
    setIsLoading(false);

    if (res.success) {
      setIsSuccess(true);
      setStatus({ type: 'success', message: res.message || t('profile.passwordUpdatedSuccess') });
    } else {
      setStatus({ type: 'error', message: res.error || t('common.error') });
    }
  };

  return (
    <div className="min-h-screen bg-ner-pattern py-8 px-4 flex flex-col justify-center items-center">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-[#131D33] hover:bg-slate-100 dark:hover:bg-[#1E293B] border border-slate-200 dark:border-[#243352] text-slate-700 dark:text-slate-200 font-bold text-sm mb-6 shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back')}</span>
        </Link>

        {/* Card Container */}
        <div className="bg-white dark:bg-[#131D33] rounded-3xl md:rounded-4xl p-6 md:p-8 border border-slate-200 dark:border-[#243352] shadow-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-smriti-teal-700 dark:text-teal-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
              {t('auth.resetPasswordTitle')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-1">
              {t('auth.resetPasswordSubtitle')}
            </p>
          </div>

          {/* Status Message */}
          {status && (
            <div
              className={`p-4 rounded-2xl mb-6 flex items-start gap-3 text-xs font-bold ${
                status.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              )}
              <span className="mt-0.5">{status.message}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="space-y-4 text-center">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-[#243352] text-xs text-slate-600 dark:text-slate-300">
                {t('auth.passwordChangedSuccess')}
              </div>
              <ElderButton
                variant="primary"
                size="md"
                fullWidth
                onClick={() => navigate('/login')}
              >
                {t('auth.signInWithNewPass')}
              </ElderButton>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-smriti-teal-500"
                  required
                />
              </div>

              {/* Recovery Token (Auto-filled or manual) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  {t('auth.recoveryToken')}
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder={t('auth.recoveryTokenPlaceholder')}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-smriti-teal-500"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  {t('auth.newPassword')}
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder')}
                    className="w-full pl-11 pr-11 py-3 rounded-2xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-smriti-teal-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  {t('auth.confirmPassword')}
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-smriti-teal-500"
                    required
                  />
                </div>
              </div>

              <ElderButton
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                disabled={isLoading || !newPassword || !confirmPassword}
              >
                {isLoading ? t('auth.updatingPassword') : t('auth.updatePasswordButton')}
              </ElderButton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
