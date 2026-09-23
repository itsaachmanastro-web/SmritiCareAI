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
  Mail,
  LogOut,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import UserAvatar from './UserAvatar';
import { SmritiLogo } from './NerIcons';
import SmritiCompanionAvatar from './SmritiCompanionAvatar';
import ApiKeyModal from '../ai/ApiKeyModal';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../context/LanguageContext';
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

  const languages = SUPPORTED_LANGUAGES;

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
        <div className="w-screen sm:w-96 max-w-full bg-[#F7F5F0] dark:bg-[#06110F] border-r border-[#DFEAE2] dark:border-[#183830] shadow-2xl flex flex-col h-full text-[#142823] dark:text-[#F0F6F4] transition-colors duration-200 animate-in slide-in-from-left duration-250 ease-out">
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#DFEAE2] dark:border-[#183830] flex items-center justify-between gap-3 bg-[#FAFDF9] dark:bg-[#0B1C18] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#DCF0E4] dark:bg-[#0D2318] flex items-center justify-center p-1 border border-[#BAD9C6] dark:border-[#153A28] shadow-xs">
                <SmritiLogo className="w-full h-full text-[#143D30] dark:text-[#2DD4BF]" showText={false} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-serif font-bold text-base text-[#142823] dark:text-[#F0F6F4]">SmritiCare</span>
                <span className="text-[9px] text-[#5C756D] dark:text-[#7E9C94] tracking-tight mt-0.5">Care Connects Generations</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#5C756D] hover:text-[#142823] dark:text-[#7E9C94] dark:hover:text-white hover:bg-[#EFF6F1] dark:hover:bg-[#102520] transition-colors cursor-pointer"
              aria-label={t('menu.close') || 'Close menu'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Navigation Body */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
            {/* User Info Tile */}
            {currentUser && (
              <div
                onClick={() => handleNavClick('/profile')}
                className="p-3.5 rounded-2xl bg-white dark:bg-[#0E221E] border border-[#DFEAE2] dark:border-[#183830] flex items-center gap-3 cursor-pointer hover:shadow-sm transition-all"
              >
                <UserAvatar user={currentUser} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-[#142823] dark:text-white truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-[#5C756D] dark:text-[#7E9C94] truncate">
                    {currentUser.email || (role === 'patient' ? 'Patient Mode' : 'Caregiver Mode')}
                  </p>
                  <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-black uppercase rounded-md bg-[#DCF0E4] dark:bg-[#12332A] text-[#143D30] dark:text-[#34D399] border border-[#BAD9C6] dark:border-[#153A28]">
                    {currentUser.role || role}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#5C756D] dark:text-[#7E9C94] shrink-0" />
              </div>
            )}

            {/* SECTION 1: AI & Assistance (Prominent) */}
            <div className="space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-[#5C756D] dark:text-[#7E9C94] px-3 py-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('menu.aiAssistance') || 'AI & Assistance'}</span>
              </div>

              {/* Main AI Assistant Trigger (Opens SAME Drawer) */}
              <button
                type="button"
                onClick={() => handleAssistantClick()}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#E8F3ED] hover:bg-[#DCEDE3] dark:bg-[#0D2620] dark:hover:bg-[#12332B] border border-[#BAD9C6] dark:border-[#183830] text-left transition-all cursor-pointer group shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#DCF0E4] dark:bg-[#0D2318] border border-[#BAD9C6] dark:border-[#153A28] flex items-center justify-center shadow-xs shrink-0">
                    <SmritiCompanionAvatar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#143D30] dark:text-[#E2F5EC]">
                      {t('menu.aiAssistant') || 'AI Assistant'}
                    </p>
                    <p className="text-[11px] text-[#0D9488] dark:text-[#2DD4BF] font-semibold">
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
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-[#142823] dark:text-[#E2EAE5] hover:bg-white dark:hover:bg-[#0E221E] hover:text-[#143D30] dark:hover:text-[#34D399] transition-colors cursor-pointer"
              >
                <Mic className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF] shrink-0" />
                <span>{t('menu.voiceAssistant') || 'Voice Assistant'}</span>
              </button>

              {/* AI Engine Settings */}
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(true)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-[#142823] dark:text-[#E2EAE5] hover:bg-white dark:hover:bg-[#0E221E] hover:text-[#143D30] dark:hover:text-[#34D399] transition-colors cursor-pointer"
              >
                <Key className="w-4 h-4 text-[#5C756D] dark:text-[#7E9C94] shrink-0" />
                <span>{t('menu.aiSettings') || 'AI Engine Settings'}</span>
              </button>
            </div>

            {/* SECTION 2: Wellbeing & Daily Care */}
            <div className="space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-[#5C756D] dark:text-[#7E9C94] px-3 py-1">
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
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-[#142823] dark:text-[#E2EAE5] hover:bg-white dark:hover:bg-[#0E221E] hover:text-[#143D30] dark:hover:text-[#34D399] transition-colors cursor-pointer"
              >
                <Gamepad2 className="w-4 h-4 text-[#143D30] dark:text-[#34D399] shrink-0" />
                <span>{t('navigation.dashboard') || 'Dashboard'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('/patient/games')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-[#142823] dark:text-[#E2EAE5] hover:bg-white dark:hover:bg-[#0E221E] hover:text-[#143D30] dark:hover:text-[#34D399] transition-colors cursor-pointer"
              >
                <Gamepad2 className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{t('menu.games') || 'Cultural Memory Games'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('/patient/reminders')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-[#142823] dark:text-[#E2EAE5] hover:bg-white dark:hover:bg-[#0E221E] hover:text-[#143D30] dark:hover:text-[#34D399] transition-colors cursor-pointer"
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
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-[#142823] dark:text-[#E2EAE5] hover:bg-white dark:hover:bg-[#0E221E] hover:text-[#143D30] dark:hover:text-[#34D399] transition-colors cursor-pointer"
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
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-[#142823] dark:text-[#E2EAE5] hover:bg-white dark:hover:bg-[#0E221E] hover:text-[#143D30] dark:hover:text-[#34D399] transition-colors cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 text-[#22C55E] dark:text-[#4ADE80] shrink-0" />
                <span>{t('menu.progress') || 'Cognitive Progress & Stars'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('/patient/safety')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-[#142823] dark:text-[#E2EAE5] hover:bg-white dark:hover:bg-[#0E221E] hover:text-[#143D30] dark:hover:text-[#34D399] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-[#2DD4BF] shrink-0" />
                  <span>{t('location.locationAndSafety') || 'Location & Safety'}</span>
                </div>
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-[#34D399]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{t('location.sharingOn') || 'Sharing On'}</span>
                </span>
              </button>
            </div>

            {/* SECTION 3: Community */}
            <div className="space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-[#5C756D] dark:text-[#7E9C94] px-3 py-1">
                {t('menu.community') || 'Community'}
              </div>

              <button
                type="button"
                onClick={() => handleNavClick('/community')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-[#142823] dark:text-[#E2EAE5] hover:bg-white dark:hover:bg-[#0E221E] hover:text-[#143D30] dark:hover:text-[#34D399] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <HeartHandshake className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF] shrink-0" />
                  <span>{t('menu.globalCommunity') || 'Global Community Support'}</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
              </button>
            </div>

            {/* SECTION 4: Smriti Economy & Rewards */}
            <div className="space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-[#5C756D] dark:text-[#7E9C94] px-3 py-1 flex items-center justify-between">
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
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-[#142823] dark:text-[#E2EAE5] hover:bg-white dark:hover:bg-[#0E221E] hover:text-[#143D30] dark:hover:text-[#34D399] transition-colors cursor-pointer"
              >
                <Coins className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{t('menu.economy') || 'Smriti Economy Hub'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('/economy/marketplace')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-[#142823] dark:text-[#E2EAE5] hover:bg-white dark:hover:bg-[#0E221E] hover:text-[#143D30] dark:hover:text-[#34D399] transition-colors cursor-pointer"
              >
                <Gift className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{t('menu.rewards') || 'Reward Marketplace'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('/economy/subscriptions')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-[#142823] dark:text-[#E2EAE5] hover:bg-white dark:hover:bg-[#0E221E] hover:text-[#143D30] dark:hover:text-[#34D399] transition-colors cursor-pointer"
              >
                <Award className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>{t('menu.subscription') || 'Subscription Plans'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('/economy/history')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-[#142823] dark:text-[#E2EAE5] hover:bg-white dark:hover:bg-[#0E221E] hover:text-[#143D30] dark:hover:text-[#34D399] transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#5C756D] dark:text-[#7E9C94] shrink-0" />
                <span>{t('menu.transactionHistory') || 'Transaction Ledger'}</span>
              </button>
            </div>

            {/* SECTION 5: My Account & Preferences */}
            <div className="space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-[#5C756D] dark:text-[#7E9C94] px-3 py-1">
                {t('menu.myAccount') || 'My Account & Preferences'}
              </div>

              {currentUser && (
                <button
                  type="button"
                  onClick={() => handleNavClick('/profile')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-[#142823] dark:text-[#E2EAE5] hover:bg-white dark:hover:bg-[#0E221E] hover:text-[#143D30] dark:hover:text-[#34D399] transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF] shrink-0" />
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
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-[#142823] dark:text-[#E2EAE5] hover:bg-white dark:hover:bg-[#0E221E] hover:text-[#143D30] dark:hover:text-[#34D399] transition-colors cursor-pointer"
              >
                <Database className="w-4 h-4 text-[#22C55E] dark:text-[#4ADE80] shrink-0" />
                <span>{t('menu.syncSettings') || 'Data & Offline Sync'}</span>
              </button>

              {/* Inline Language Selector with all 5 languages */}
              <div className="px-3.5 py-2">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[#5C756D] dark:text-[#7E9C94]">
                  <Globe className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" />
                  <span>Language / ভাষা / भाषा:</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setLanguage(l.code)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                        language === l.code
                          ? 'bg-[#143D30] text-white border-[#143D30] dark:bg-[#2DD4BF] dark:text-[#06110F] dark:border-[#2DD4BF] shadow-xs'
                          : 'bg-white dark:bg-[#0E221E] border-[#DFEAE2] dark:border-[#183830] text-[#142823] dark:text-[#E2EAE5] hover:bg-[#EFF6F1] dark:hover:bg-[#122E26]'
                      }`}
                    >
                      <span className="mr-1">{l.flag}</span>
                      <span>{l.label || l.native}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-[#142823] dark:text-[#E2EAE5] hover:bg-white dark:hover:bg-[#0E221E] hover:text-[#143D30] dark:hover:text-[#34D399] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  {isDark ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-[#143D30]" />
                  )}
                  <span>{isDark ? t('navigation.lightMode') : t('navigation.darkMode')}</span>
                </div>
                <span className="text-[11px] font-bold text-[#5C756D] dark:text-[#7E9C94]">
                  {isDark ? 'Dark' : 'Light'}
                </span>
              </button>
            </div>

            {/* SECTION 6: Support & Safety */}
            <div className="space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-[#5C756D] dark:text-[#7E9C94] px-3 py-1">
                {t('menu.support') || 'Support & Safety'}
              </div>

              {/* Emergency Call */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenEmergency) onOpenEmergency();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-rose-50/90 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/60 text-xs font-black text-rose-700 dark:text-rose-300 transition-colors cursor-pointer"
              >
                <PhoneCall className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{t('menu.emergencyCall') || 'Emergency Caregiver Call'}</span>
              </button>

              {/* About SmritiCare */}
              <button
                type="button"
                onClick={() => setIsAboutModalOpen(true)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-[#142823] dark:text-[#E2EAE5] hover:bg-white dark:hover:bg-[#0E221E] hover:text-[#143D30] dark:hover:text-[#34D399] transition-colors cursor-pointer"
              >
                <Info className="w-4 h-4 text-[#5C756D] dark:text-[#7E9C94] shrink-0" />
                <span>{t('menu.about') || 'About SmritiCare'}</span>
              </button>

              {/* Contact Support & Team */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/#contact');
                  setTimeout(() => {
                    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                  }, 150);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-[#142823] dark:text-[#E2EAE5] hover:bg-white dark:hover:bg-[#0E221E] hover:text-[#143D30] dark:hover:text-[#34D399] transition-colors cursor-pointer"
              >
                <Mail className="w-4 h-4 text-[#5C756D] dark:text-[#7E9C94] shrink-0" />
                <span>{t('navigation.contact') || 'Contact Us'}</span>
              </button>
            </div>

            {/* Sign Out / Switch Role */}
            <div className="pt-2 border-t border-[#DFEAE2] dark:border-[#183830]">
              {currentUser ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-white dark:bg-[#0E221E] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 text-[#142823] dark:text-[#E2EAE5] text-xs font-bold border border-[#DFEAE2] dark:border-[#183830] transition-colors cursor-pointer shadow-xs"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('menu.signOut') || 'Sign Out'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleNavClick('/login')}
                  className="w-full p-3 rounded-2xl bg-[#143D30] hover:bg-[#0E2D23] dark:bg-[#2DD4BF] dark:hover:bg-[#20B8A5] text-white dark:text-[#06110F] font-bold text-xs text-center shadow-md transition-all cursor-pointer"
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
            className="bg-white dark:bg-[#0B1C18] rounded-3xl max-w-md w-full p-6 border border-[#DFEAE2] dark:border-[#183830] shadow-2xl space-y-4 text-[#142823] dark:text-[#F0F6F4]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#EFF5F1] dark:border-[#183830]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#DCF0E4] dark:bg-[#0D2318] border border-[#BAD9C6] dark:border-[#153A28] flex items-center justify-center shadow-sm">
                  <SmritiCompanionAvatar className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#142823] dark:text-[#F0F6F4]">SmritiCare</h3>
                  <p className="text-xs text-[#5C756D] dark:text-[#7E9C94] font-semibold">
                    Care Connects Generations
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAboutModalOpen(false)}
                className="p-1.5 rounded-xl text-[#5C756D] hover:text-[#142823] dark:text-[#7E9C94] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-[#5C756D] dark:text-[#CBD5E1] leading-relaxed">
              <p>
                <strong className="text-[#142823] dark:text-white">SmritiCare</strong> is a culturally sensitive, voice-first cognitive companion designed for elderly dementia individuals and family caregivers in North East India.
              </p>
              <p>
                Culturally rooted in traditional Assam and Northeast heritage (Bihu memory match, Mekhela patterns, Tea Garden sequences, and hill melodies), it operates with offline-first Dexie storage to ensure care never stops when network is unavailable.
              </p>
            </div>

            <div className="p-3 bg-[#E8F3ED] dark:bg-[#102923] rounded-2xl border border-[#BAD9C6] dark:border-[#183830] flex items-center gap-2.5 text-xs font-semibold text-[#143D30] dark:text-[#34D399]">
              <ShieldCheck className="w-5 h-5 text-[#0D9488] dark:text-[#2DD4BF] shrink-0" />
              <span>Conversations and health telemetry remain local and private.</span>
            </div>

            <button
              type="button"
              onClick={() => setIsAboutModalOpen(false)}
              className="w-full py-2.5 rounded-2xl bg-[#143D30] hover:bg-[#0E2D23] dark:bg-[#2DD4BF] dark:hover:bg-[#20B8A5] text-white dark:text-[#06110F] font-bold text-xs shadow-md transition-all cursor-pointer"
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
