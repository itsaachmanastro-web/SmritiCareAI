import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import {
  X,
  Sparkles,
  Mic,
  Key,
  Bell,
  TrendingUp,
  Gamepad2,
  HeartHandshake,
  Coins,
  Gift,
  Award,
  FileText,
  User,
  Database,
  Globe,
  Sun,
  Moon,
  HelpCircle,
  PhoneCall,
  Info,
  LogOut,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import UserAvatar from './UserAvatar';
import { SmritiLogo } from './NerIcons';
import ApiKeyModal from '../ai/ApiKeyModal';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useEconomy } from '../../context/EconomyContext';
import { useNotifications } from '../../context/NotificationContext';

/**
 * NavigationDrawer
 * 
 * Premium 3-Line Hamburger Navigation Drawer:
 * - Desktop: Compact elegant slide-in drawer from the left
 * - Mobile: Full / near-full width drawer with touch-friendly navigation
 * - Rendered via ReactDOM.createPortal to avoid any CSS stacking context or clipping
 * - Unified access: "AI Assistant" triggers the SAME central AI Assistant Drawer
 * - Clear separation of Primary vs Secondary features
 * - WCAG AAA/AA high contrast in both Light and Dark modes
 * - 100% Multilingual support (en, hi, as, bn)
 */
export default function NavigationDrawer({
  isOpen,
  onClose,
  onOpenAssistant,
  onOpenSyncModal,
  onOpenEmergency
}) {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { currentUser, role, logout } = useAuth();
  const { balance } = useEconomy();
  const { openDrawer: openNotificationDrawer, unreadCount } = useNotifications();

  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const drawerRef = useRef(null);

  const languages = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'as', label: 'Assamese', native: 'অসমীয়া' },
    { code: 'bn', label: 'Bengali', native: 'বাংলা' }
  ];

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNavClick = (path) => {
    onClose();
    if (path) {
      navigate(path);
    }
  };

  const handleAssistantClick = (options = {}) => {
    onClose();
    if (onOpenAssistant) {
      onOpenAssistant(options);
    }
  };

  const handleLogout = () => {
    onClose();
    logout();
    navigate('/');
  };

  const drawerContent = (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t('menu.title') || 'Navigation Menu'}
    >
      <div
        ref={drawerRef}
        className="fixed inset-y-0 left-0 max-w-full flex pr-0 sm:pr-10"
      >
        <div className="w-screen sm:w-96 max-w-full bg-white dark:bg-[#131D33] border-r border-slate-200 dark:border-[#243352] shadow-2xl flex flex-col h-full text-slate-900 dark:text-white transition-colors duration-200 animate-in slide-in-from-left duration-250 ease-out">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-200/90 dark:border-[#243352] flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-[#10192D] shrink-0">
            <div className="flex items-center gap-3">
              <SmritiLogo
                className="w-9 h-9"
                textClass="text-lg font-black text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#1E293B] transition-colors"
              aria-label={t('menu.close') || 'Close menu'}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable Navigation Body */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
            {/* User Info Tile */}
            {currentUser && (
              <div
                onClick={() => handleNavClick('/profile')}
                className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50/60 dark:from-[#162238] dark:to-[#1A2844] border border-teal-200/80 dark:border-[#243352] flex items-center gap-3 cursor-pointer hover:shadow-md transition-all"
              >
                <UserAvatar user={currentUser} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {currentUser.email || (role === 'patient' ? 'Patient Mode' : 'Caregiver Mode')}
                  </p>
                  <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-black uppercase rounded-md bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    {currentUser.role || role}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            )}

            {/* SECTION 1: AI & Assistance (Prominent) */}
            <div className="space-y-1">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('menu.aiAssistance') || 'AI & Assistance'}</span>
              </div>

              {/* Main AI Assistant Trigger (Opens SAME Drawer) */}
              <button
                type="button"
                onClick={() => handleAssistantClick()}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-teal-50/90 hover:bg-teal-100/90 dark:bg-teal-950/60 dark:hover:bg-teal-900/80 border border-teal-200 dark:border-teal-800 text-left transition-all cursor-pointer group shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-smriti-teal-600 text-white flex items-center justify-center text-lg shadow-sm shrink-0">
                    🌸
                  </div>
                  <div>
                    <p className="text-sm font-black text-smriti-teal-950 dark:text-teal-100">
                      {t('menu.aiAssistant') || 'AI Assistant'}
                    </p>
                    <p className="text-[11px] text-teal-700 dark:text-teal-300 font-semibold">
                      {t('menu.readyToHelp') || 'Ready to help'} &bull; Voice & Text
                    </p>
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
              </button>

              {/* Voice Mode Shortcut */}
              <button
                type="button"
                onClick={() => handleAssistantClick({ startVoice: true })}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
              >
                <Mic className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>{t('menu.voiceAssistant') || 'Voice Assistant'}</span>
              </button>

              {/* AI Engine Settings */}
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(true)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
              >
                <Key className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{t('menu.aiSettings') || 'AI Engine Settings'}</span>
              </button>
            </div>

            {/* SECTION 2: Wellbeing & Daily Care */}
            <div className="space-y-1">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-1">
                {t('menu.wellbeing') || 'Wellbeing & Routines'}
              </div>

              <button
                type="button"
                onClick={() =>
                  handleNavClick(
                    role === 'healthcare'
                      ? '/clinician/dashboard'
                      : role === 'caregiver'
                      ? '/caregiver/dashboard'
                      : '/patient/home'
                  )
                }
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
              >
                <Gamepad2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>{t('navigation.dashboard') || 'Dashboard'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('/patient/games')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
              >
                <Gamepad2 className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{t('menu.games') || 'Cultural Memory Games'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('/patient/reminders')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
              >
                <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>{t('menu.reminders') || 'Daily Reminders'}</span>
              </button>

              {/* Notification Center Trigger */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openNotificationDrawer();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{t('notifications.title') || 'Notification Center'}</span>
                </div>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('/patient/progress')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
              >
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{t('menu.progress') || 'Cognitive Progress & Stars'}</span>
              </button>
            </div>

            {/* SECTION 3: Community */}
            <div className="space-y-1">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-1">
                {t('menu.community') || 'Community'}
              </div>

              <button
                type="button"
                onClick={() => handleNavClick('/community')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <HeartHandshake className="w-4 h-4 text-smriti-orange-500 shrink-0" />
                  <span>{t('menu.globalCommunity') || 'Global Community Support'}</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </button>
            </div>

            {/* SECTION 4: Smriti Economy & Rewards */}
            <div className="space-y-1">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-1 flex items-center justify-between">
                <span>{t('menu.economy') || 'Smriti Economy'}</span>
                {balance != null && (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    💠 {balance.toLocaleString()}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleNavClick('/economy')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
              >
                <Coins className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{t('menu.economy') || 'Smriti Economy Hub'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('/economy/marketplace')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
              >
                <Gift className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{t('menu.rewards') || 'Reward Marketplace'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('/economy/subscriptions')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
              >
                <Award className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>{t('menu.subscription') || 'Subscription Plans'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('/economy/history')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
              >
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{t('menu.transactionHistory') || 'Transaction Ledger'}</span>
              </button>
            </div>

            {/* SECTION 5: My Account & Preferences */}
            <div className="space-y-1">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-1">
                {t('menu.myAccount') || 'My Account & Preferences'}
              </div>

              {currentUser && (
                <button
                  type="button"
                  onClick={() => handleNavClick('/profile')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
                >
                  <User className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>{t('menu.profile') || 'Profile & Health Details'}</span>
                </button>
              )}

              {/* Data & Offline Sync Status */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenSyncModal) onOpenSyncModal();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
              >
                <Database className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('menu.syncSettings') || 'Data & Offline Sync'}</span>
              </button>

              {/* Inline Language Selector */}
              <div className="px-3.5 py-2">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <span>Language / ভাষা / भाषा:</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setLanguage(l.code)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        language === l.code
                          ? 'bg-smriti-teal-600 text-white border-smriti-teal-700 shadow-xs'
                          : 'bg-slate-50 dark:bg-[#162238] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {l.native}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isDark ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-slate-700" />
                  )}
                  <span>{isDark ? t('navigation.lightMode') : t('navigation.darkMode')}</span>
                </div>
                <span className="text-[11px] font-bold text-slate-400">
                  {isDark ? 'Dark' : 'Light'}
                </span>
              </button>
            </div>

            {/* SECTION 6: Support & Safety */}
            <div className="space-y-1">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-1">
                {t('menu.support') || 'Support & Safety'}
              </div>

              {/* Emergency Call */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenEmergency) onOpenEmergency();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-rose-50/80 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/60 text-xs font-black text-rose-700 dark:text-rose-300 transition-colors"
              >
                <PhoneCall className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{t('menu.emergencyCall') || 'Emergency Caregiver Call'}</span>
              </button>

              {/* About SmritiCare */}
              <button
                type="button"
                onClick={() => setIsAboutModalOpen(true)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
              >
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{t('menu.about') || 'About SmritiCare'}</span>
              </button>
            </div>

            {/* Sign Out / Switch Role */}
            <div className="pt-2 border-t border-slate-200/90 dark:border-[#243352]">
              {currentUser ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-100 dark:bg-[#162238] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('menu.signOut') || 'Sign Out'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleNavClick('/login')}
                  className="w-full p-3 rounded-2xl bg-smriti-teal-600 text-white font-bold text-xs text-center shadow-md hover:bg-smriti-teal-700 transition-all"
                >
                  {t('navigation.signIn') || 'Sign In'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Key / Settings Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
      />

      {/* About SmritiCare Modal */}
      {isAboutModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsAboutModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#131D33] rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-[#243352] shadow-2xl space-y-4 text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#243352]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-smriti-teal-600 to-teal-800 text-white flex items-center justify-center text-xl shadow-md">
                  🌸
                </div>
                <div>
                  <h3 className="text-base font-black">SmritiCare</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Smarter care for brighter minds
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAboutModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                <strong>SmritiCare</strong> is a culturally sensitive, voice-first cognitive companion designed for elderly dementia individuals and family caregivers in North East India.
              </p>
              <p>
                Culturally rooted in traditional Assam and Northeast heritage (Bihu memory match, Mekhela patterns, Tea Garden sequences, and hill melodies), it operates with offline-first Dexie storage to ensure care never stops when network is unavailable.
              </p>
            </div>

            <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-2xl border border-teal-200 dark:border-teal-800 flex items-center gap-2.5 text-xs font-semibold text-smriti-teal-900 dark:text-teal-200">
              <ShieldCheck className="w-5 h-5 text-smriti-teal-600 dark:text-teal-400 shrink-0" />
              <span>Conversations and health telemetry remain local and private.</span>
            </div>

            <button
              type="button"
              onClick={() => setIsAboutModalOpen(false)}
              className="w-full py-2.5 rounded-2xl bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white font-bold text-xs shadow-md transition-all"
            >
              {t('menu.close') || 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return typeof document !== 'undefined'
    ? ReactDOM.createPortal(drawerContent, document.body)
    : null;
}
