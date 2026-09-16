import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Globe,
  Sun,
  Moon,
  ArrowLeft,
  Sparkles,
  Calendar,
  Clock
} from 'lucide-react';
import UserAvatar from '../components/common/UserAvatar';
import ElderButton from '../components/common/ElderButton';
import DeleteUserModal from '../components/common/DeleteUserModal';
import { deleteUser } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { compressImage } from '../utils/imageUtils';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser, updateUserProfile, removeProfilePhoto, changePassword, logout } = useAuth();
  const { language, setLanguage, t, formatDate, formatTime } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states initialized with currentUser
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [location, setLocation] = useState(currentUser?.location || 'Assam, India');
  const [relation, setRelation] = useState(currentUser?.relation || currentUser?.designation || '');
  
  // Password change form states
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'security'
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }
  const fileInputRef = useRef(null);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white dark:bg-[#131D33] p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-[#243352]">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('common.error')}</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 mb-6">
            {t('auth.loginTitle')}
          </p>
          <ElderButton variant="primary" onClick={() => navigate('/login')}>
            {t('auth.signInButton')}
          </ElderButton>
        </div>
      </div>
    );
  }

  // Handle image upload from file picker
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setFeedback(null);

    try {
      const compressed = await compressImage(file, { maxWidth: 256, maxHeight: 256, quality: 0.85 });
      const res = await updateUserProfile({
        profileImage: compressed.base64,
        avatar: compressed.base64
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: t('profile.photoUpdated')
        });
      } else {
        setFeedback({ type: 'error', message: res.error || t('common.error') });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || t('common.error') });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle removing profile photo
  const handleRemovePhoto = async () => {
    setFeedback(null);
    const res = await removeProfilePhoto();
    if (res.success) {
      setFeedback({ type: 'success', message: t('profile.photoRemoved') });
    } else {
      setFeedback({ type: 'error', message: res.error || t('common.error') });
    }
  };

  // Save personal information
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFeedback({ type: 'error', message: t('auth.validationNameRequired') });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const res = await updateUserProfile({
      name: name.trim(),
      phone: phone.trim(),
      location: location.trim(),
      relation: currentUser.role === 'caregiver' ? relation.trim() : currentUser.relation,
      designation: currentUser.role === 'healthcare' ? relation.trim() : currentUser.designation
    });

    setIsSaving(false);
    if (res.success) {
      setFeedback({ type: 'success', message: t('profile.savedSuccess') });
    } else {
      setFeedback({ type: 'error', message: res.error || t('common.error') });
    }
  };

  // Save password change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (newPass.length < 6) {
      setFeedback({ type: 'error', message: t('auth.validationPasswordLength') });
      return;
    }
    if (newPass !== confirmPass) {
      setFeedback({ type: 'error', message: t('auth.validationPasswordMatch') });
      return;
    }

    setIsSaving(true);
    const res = await changePassword(currentPass, newPass);
    setIsSaving(false);

    if (res.success) {
      setFeedback({ type: 'success', message: t('profile.passwordUpdatedSuccess') });
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } else {
      setFeedback({ type: 'error', message: res.error || t('common.error') });
    }
  };

  const handleDeleteSelf = async () => {
    const res = await deleteUser(currentUser.id, currentUser, { softDelete: true });
    if (res.success) {
      await logout();
      navigate('/');
    } else {
      throw new Error(res.error || 'Failed to delete user account');
    }
  };

  const hasCustomPhoto = Boolean(currentUser?.profileImage || (currentUser?.avatar && !currentUser.avatar.includes('unsplash')));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-8">
      {/* Back Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-[#131D33] hover:bg-slate-100 dark:hover:bg-[#1E293B] border border-slate-200 dark:border-[#243352] text-slate-700 dark:text-slate-200 font-bold text-sm shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back')}</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
          <span>Account ID: #{currentUser.id}</span>
        </div>
      </div>

      {/* Hero Profile Card */}
      <div className="bg-white dark:bg-[#131D33] rounded-3xl md:rounded-4xl p-6 md:p-9 border border-slate-200 dark:border-[#243352] shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8">
          {/* Avatar with Upload Control */}
          <div className="relative group">
            <UserAvatar
              user={currentUser}
              size="2xl"
              className="ring-4 ring-smriti-teal-500/30 dark:ring-teal-400/20"
            />
            
            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />

            {/* Quick Change Overlay Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              aria-label="Upload profile picture"
              className="absolute bottom-1 right-1 p-2.5 rounded-full bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white shadow-lg border-2 border-white dark:border-[#131D33] transition-transform active:scale-95 cursor-pointer"
              title={t('profile.uploadPhoto')}
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* User Details & Identity Badges */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-teal-50 dark:bg-teal-950/60 text-smriti-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                {currentUser.role}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{currentUser.isDemo ? t('profile.demoMode') : t('profile.verifiedRealUser')}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
              {currentUser.name}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              {currentUser.email}
            </p>

            {/* Photo Action Buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#25334D] text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer border border-transparent dark:border-[#243352]"
              >
                <Camera className="w-3.5 h-3.5 text-smriti-teal-600 dark:text-teal-400" />
                <span>{isUploadingPhoto ? t('profile.compressing') : t('profile.uploadPhoto')}</span>
              </button>

              {hasCustomPhoto && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-bold transition-colors cursor-pointer border border-rose-200 dark:border-rose-800"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('profile.removePhoto')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-[#243352] gap-4 text-sm font-black">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'general'
              ? 'border-smriti-teal-600 text-smriti-teal-800 dark:text-teal-300'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {t('profile.tabGeneral')}
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'border-smriti-teal-600 text-smriti-teal-800 dark:text-teal-300'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {t('profile.tabSecurity')}
        </button>
      </div>

      {/* Tab 1: Personal Information */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveProfile} className="bg-white dark:bg-[#131D33] rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-[#243352] shadow-md space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
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
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-smriti-teal-500"
                  required
                />
              </div>
            </div>

            {/* Email (Read-only for cloud sync identity) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                {t('profile.primaryEmailIdentity')}
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={currentUser.email}
                  disabled
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-[#243352] bg-slate-50 dark:bg-[#1E293B]/60 text-slate-500 dark:text-slate-400 text-sm font-medium cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{t('profile.emailIdentityNote')}</p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                {t('profile.phone')}
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('profile.phonePlaceholder')}
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-smriti-teal-500"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                {t('profile.location')}
              </label>
              <div className="relative">
                <MapPin className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('profile.locationPlaceholder')}
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-smriti-teal-500"
                />
              </div>
            </div>

            {/* Relation / Designation */}
            {currentUser.role !== 'patient' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  {currentUser.role === 'caregiver' ? t('profile.relation') : t('profile.designation')}
                </label>
                <input
                  type="text"
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  placeholder={currentUser.role === 'caregiver' ? 'e.g. Daughter / Primary Caregiver' : 'e.g. Medical Officer, Titabar PHC'}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-smriti-teal-500"
                />
              </div>
            )}

            {/* Language Preference */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                {t('profile.preferredLanguage')}
              </label>
              <div className="relative">
                <Globe className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-smriti-teal-500 cursor-pointer"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                  <option value="as">Assamese (অসমীয়া)</option>
                  <option value="bn">Bengali (বাংলা)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Theme Quick Switcher in Profile */}
          <div className="pt-2 border-t border-slate-100 dark:border-[#243352] flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('profile.colorAppearance')}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('common.status')}: {isDark ? t('navigation.darkMode') : t('navigation.lightMode')}</p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#25334D] text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-[#243352] transition-colors cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              <span>{t('profile.toggleAppearance')}</span>
            </button>
          </div>

          <div className="pt-4 flex justify-end">
            <ElderButton
              type="submit"
              variant="primary"
              size="md"
              disabled={isSaving}
              icon={Save}
            >
              {isSaving ? t('profile.savingChanges') : t('profile.saveProfileChanges')}
            </ElderButton>
          </div>
        </form>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === 'security' && (
        <form onSubmit={handleChangePassword} className="bg-white dark:bg-[#131D33] rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-[#243352] shadow-md space-y-6">
          <div className="max-w-md space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                {t('auth.currentPassword')}
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="w-full pl-11 pr-11 py-2.5 rounded-2xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-smriti-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showCurrentPass ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                {t('auth.newPassword')}
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder={t('auth.newPasswordPlaceholder')}
                  className="w-full pl-11 pr-11 py-2.5 rounded-2xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-smriti-teal-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showNewPass ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-smriti-teal-500"
                  required
                />
              </div>
            </div>

            <ElderButton
              type="submit"
              variant="primary"
              size="md"
              disabled={isSaving || !newPass}
            >
              {isSaving ? t('auth.updatingPassword') : t('profile.updatePassword')}
            </ElderButton>

            {/* Danger Zone: Account Deletion */}
            <div className="pt-6 border-t border-rose-200 dark:border-rose-950/60 mt-6">
              <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-rose-700 dark:text-rose-400 text-sm flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4" />
                    <span>Danger Zone: Deactivate / Delete Account</span>
                  </h4>
                  <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                    Permanently revoke your active session and archive this profile.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shadow-xs shrink-0"
                >
                  Delete My Account
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Account Metadata Telemetry Card */}
      <div className="bg-slate-50 dark:bg-[#131D33] rounded-3xl p-6 border border-slate-200 dark:border-[#243352] text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{t('common.memberSince')}: {currentUser.createdAt ? formatDate(currentUser.createdAt) : 'Active session'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>{t('common.lastLogin')}: {currentUser.lastLoginAt ? formatTime(currentUser.lastLoginAt) : 'Just now'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>{t('profile.offlineEngine')}</span>
        </div>
      </div>

      {/* Delete User Modal */}
      <DeleteUserModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        user={currentUser}
        currentUser={currentUser}
        onConfirmDelete={handleDeleteSelf}
        isSelf={true}
      />
    </div>
  );
}
