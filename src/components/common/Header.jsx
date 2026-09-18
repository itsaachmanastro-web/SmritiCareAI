import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Menu, Globe, Wifi, WifiOff, RefreshCw, LogOut, Database, User, Users, Sun, Moon, Settings, ChevronDown, LogIn, Coins, Award, Search, Calendar, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAssistant } from '../../context/AssistantContext';
import { SmritiLogo } from './NerIcons';
import UserAvatar from './UserAvatar';
import NavigationDrawer from './NavigationDrawer';
import NotificationBell from '../notifications/NotificationBell';
import UserMenu from './UserMenu';
import { syncNow, getSyncStats } from '../../db/syncService';

export default function Header({ onOpenEmergency = null }) {
  const { currentUser, logout, role } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, isDark, toggleTheme } = useTheme();
  const { openAssistant } = useAssistant();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ totalRecords: 0, unsyncedCount: 0, lastSync: 'Never' });
  const langMenuRef = React.useRef(null);

  // Close menus on navigation
  useEffect(() => {
    setShowLangMenu(false);
  }, [location.pathname]);

  // Click outside for language dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync(true); // Auto sync on reconnection
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial stats load
    loadStats();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadStats = async () => {
    try {
      const s = await getSyncStats();
      setStats(s);
    } catch (e) {
      console.warn(e);
    }
  };

  const triggerSync = async (auto = false) => {
    setIsSyncing(true);
    try {
      const res = await syncNow();
      await loadStats();
      setSyncToast(`✅ ${res.syncedCount || 0} ${t('syncedSuccess')}`);
      setTimeout(() => setSyncToast(null), 3500);
    } catch (err) {
      setSyncToast('Sync encountered a temporary issue.');
      setTimeout(() => setSyncToast(null), 3500);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const languages = SUPPORTED_LANGUAGES;

  const isCommunityActive = location.pathname.startsWith('/community') || location.pathname.startsWith('/patient/community');

  const formattedDate = new Intl.DateTimeFormat('en-GB', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  }).format(new Date());

  const currentHour = new Date().getHours();
  const greetingText = currentHour < 12 ? 'Good Morning,' : currentHour < 17 ? 'Good Afternoon,' : 'Good Evening,';
  const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : 'there';
  const currentLangObj = languages.find((l) => l.code === language) || languages[0];

  const isLanding = location.pathname === '/' || location.pathname === '/about' || location.pathname === '/contact';

  return (
    <header className="sticky top-0 z-40 bg-[#F7F5F0]/95 dark:bg-[#06110F]/95 backdrop-blur-md border-b border-[#DFEAE2] dark:border-[#183830] shadow-xs px-4 md:px-6 py-2.5 transition-colors duration-200">
      <div className="w-full flex items-center justify-between gap-3">
        {/* Left: Mobile hamburger menu trigger, logo, and Landing Nav or Search Bar */}
        <div className="flex items-center gap-3 md:gap-4 flex-1">
          {/* Hamburger Menu Trigger (visible on mobile / tablet) */}
          <button
            type="button"
            onClick={() => setIsNavDrawerOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-white dark:bg-[#0E221E] hover:bg-[#EFF6F1] dark:hover:bg-[#132A24] text-[#142823] dark:text-[#F0F6F4] border border-[#DFEAE2] dark:border-[#183830] transition-all flex items-center focus:outline-none focus:ring-2 focus:ring-[#143D30] cursor-pointer shadow-xs"
            aria-label={t('menu.title') || 'Open Navigation Menu'}
            aria-expanded={isNavDrawerOpen}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo visible: always on landing page, and on smaller screens when sidebar is hidden */}
          <Link
            to={
              role === 'patient'
                ? '/patient/home'
                : role === 'healthcare'
                ? '/clinician/dashboard'
                : role === 'caregiver'
                ? '/caregiver/dashboard'
                : '/'
            }
            className={`${isLanding ? 'flex' : 'lg:hidden flex'} hover:opacity-90 transition-opacity items-center gap-2.5 shrink-0`}
          >
            <div className="w-8 h-8 rounded-xl bg-[#DCF0E4] dark:bg-[#0D2318] flex items-center justify-center p-1 border border-[#BAD9C6] dark:border-[#153A28] shadow-xs">
              <SmritiLogo className="w-full h-full text-[#143D30] dark:text-[#2DD4BF]" showText={false} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-serif font-bold text-base tracking-tight text-[#142823] dark:text-[#F0F6F4]">SmritiCare</span>
              <span className="text-[9px] text-[#5C756D] dark:text-[#7E9C94] tracking-tight mt-0.5">Care Connects Generations</span>
            </div>
          </Link>

          {/* Landing Page Center Navigation Links (Matching Reference Image) */}
          {isLanding ? (
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2 ml-4">
              <button
                type="button"
                onClick={() => {
                  if (location.pathname === '/') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    navigate('/');
                  }
                }}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold text-[#143D30] dark:text-[#2DD4BF] border-b-2 border-[#143D30] dark:border-[#2DD4BF] transition-all cursor-pointer"
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => {
                  if (location.pathname === '/') {
                    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    navigate('/#about');
                  }
                }}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#5C756D] hover:text-[#143D30] dark:text-[#7E9C94] dark:hover:text-[#F0F6F4] transition-colors cursor-pointer"
              >
                About
              </button>
              <button
                type="button"
                onClick={() => {
                  if (location.pathname === '/') {
                    document.getElementById('pillars')?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    navigate('/#pillars');
                  }
                }}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#5C756D] hover:text-[#143D30] dark:text-[#7E9C94] dark:hover:text-[#F0F6F4] transition-colors cursor-pointer"
              >
                Our Approach
              </button>
              <Link
                to="/login?role=caregiver"
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#5C756D] hover:text-[#143D30] dark:text-[#7E9C94] dark:hover:text-[#F0F6F4] transition-colors"
              >
                For Families
              </Link>
              <Link
                to="/login?role=healthcare"
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#5C756D] hover:text-[#143D30] dark:text-[#7E9C94] dark:hover:text-[#F0F6F4] transition-colors"
              >
                For Professionals
              </Link>
              <Link
                to="/economy"
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#5C756D] hover:text-[#143D30] dark:text-[#7E9C94] dark:hover:text-[#F0F6F4] transition-colors"
              >
                Resources
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (location.pathname === '/') {
                    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    navigate('/#contact');
                  }
                }}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#5C756D] hover:text-[#143D30] dark:text-[#7E9C94] dark:hover:text-[#F0F6F4] transition-colors cursor-pointer"
              >
                Contact
              </button>
            </nav>
          ) : (
            /* Search Pill Input matching Reference Image (on non-landing views) */
            <div className="relative w-full max-w-md hidden sm:flex items-center">
              <Search className="w-4 h-4 text-[#5C756D] dark:text-[#7E9C94] absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search games, activities, or get help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/patient/games?q=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                className="w-full pl-9 pr-4 py-2 rounded-full text-xs md:text-sm bg-white/80 dark:bg-[#0E221E]/90 text-[#142823] dark:text-[#F0F6F4] border border-[#DFEAE2] dark:border-[#183830] focus:outline-none focus:ring-2 focus:ring-[#143D30] dark:focus:ring-[#2DD4BF] placeholder:text-[#5C756D]/70 dark:placeholder:text-[#7E9C94]/70 transition-all shadow-xs"
              />
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Online/Offline Status Pill (hidden on landing page for pure aesthetic) */}
          {!isLanding && (
            <button
              onClick={() => { loadStats(); setShowSyncModal(true); }}
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                isOnline
                  ? 'bg-[#E8F3ED] hover:bg-[#DCEDE3] dark:bg-[#0D2620] dark:hover:bg-[#12332B] text-[#143D30] dark:text-[#34D399] border-[#C8DFCE] dark:border-[#183830]'
                  : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
              }`}
              title="Click to view offline database status"
            >
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
                  <span className="text-[11px]">{t('synced')}</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-[11px]">{t('offline')}</span>
                </>
              )}
              <Database className="w-3 h-3 opacity-60" />
            </button>
          )}

          {/* Centralized Notification Bell (on dashboard views) */}
          {!isLanding && <NotificationBell />}

          {/* Theme Toggle Pill (Dual state capsule matching Reference) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="relative flex items-center h-8 w-15 rounded-full p-1 bg-[#E8F1EC] dark:bg-[#102520] border border-[#DFEAE2] dark:border-[#183830] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#143D30] dark:focus:ring-[#2DD4BF] shadow-xs"
            title={isDark ? t('lightMode') || 'Switch to Light Mode' : t('darkMode') || 'Switch to Dark Mode'}
            aria-label={t('toggleTheme')}
          >
            <span
              className={`absolute flex items-center justify-center w-6 h-6 rounded-full transition-transform duration-300 shadow-sm ${
                isDark
                  ? 'translate-x-7 bg-[#06110F] text-[#2DD4BF]'
                  : 'translate-x-0 bg-white text-amber-500'
              }`}
            >
              {isDark ? <Moon className="w-3.5 h-3.5 text-[#2DD4BF]" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
            </span>
            <span className="flex items-center justify-between w-full px-1 text-[10px] text-[#5C756D] dark:text-[#7E9C94] pointer-events-none select-none">
              <Sun className={`w-3.5 h-3.5 transition-opacity ${isDark ? 'opacity-40 text-slate-500' : 'opacity-0'}`} />
              <Moon className={`w-3.5 h-3.5 transition-opacity ${isDark ? 'opacity-0' : 'opacity-40 text-slate-500'}`} />
            </span>
          </button>

          {/* Language Selector Dropdown (Pill button matching Reference) */}
          <div className="relative inline-flex items-center" ref={langMenuRef}>
            <button
              type="button"
              onClick={() => setShowLangMenu((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#0E221E] hover:bg-[#EFF6F1] dark:hover:bg-[#132A24] text-[#142823] dark:text-[#F0F6F4] text-xs font-semibold border border-[#DFEAE2] dark:border-[#183830] transition-all shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#143D30] dark:focus:ring-[#2DD4BF]"
              aria-label="Select Language"
              aria-expanded={showLangMenu}
            >
              <Globe className="w-3.5 h-3.5 text-[#0D9488] dark:text-[#2DD4BF]" />
              <span className="hidden sm:inline">{currentLangObj.flag} {currentLangObj.label || currentLangObj.native}</span>
              <span className="sm:hidden">{currentLangObj.flag}</span>
              <ChevronDown className={`w-3 h-3 text-[#5C756D] dark:text-[#7E9C94] transition-transform duration-200 ${showLangMenu ? 'rotate-180' : ''}`} />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#0E221E] rounded-2xl shadow-xl border border-[#DFEAE2] dark:border-[#183830] py-1.5 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLanguage(l.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left transition-colors cursor-pointer ${
                      language === l.code
                        ? 'bg-[#E8F3ED] dark:bg-[#122E26] text-[#143D30] dark:text-[#4ADE80] font-bold'
                        : 'text-[#5C756D] dark:text-[#94A3B8] hover:bg-[#F7F5F0] dark:hover:bg-[#132A24]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-sm">{l.flag}</span>
                      <span>{l.label || l.native}</span>
                    </span>
                    {language === l.code && <Check className="w-3.5 h-3.5 text-[#143D30] dark:text-[#4ADE80]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Profile & Menu / Sign In */}
          {currentUser ? (
            <div className="flex items-center pl-1">
              <UserMenu variant="header" />

              {/* Date Badge */}
              <div className="hidden xl:flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded-full bg-white/70 dark:bg-[#0E221E] border border-[#DFEAE2] dark:border-[#183830] text-xs font-medium text-[#5C756D] dark:text-[#7E9C94] shrink-0">
                <span>{formattedDate}</span>
                <Calendar className="w-3.5 h-3.5 text-[#5C756D] dark:text-[#7E9C94]" />
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#143D30] hover:bg-[#0E2D23] dark:bg-[#2DD4BF] dark:hover:bg-[#20B8A5] text-white dark:text-[#06110F] text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t('navigation.signIn')}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Sync Notification Toast */}
      {syncToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
          <span className="text-sm font-semibold">{syncToast}</span>
        </div>
      )}

      {/* Offline Data & Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131D33] rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-[#243352]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#243352]">
              <div className="flex items-center gap-2">
                <Database className="w-6 h-6 text-smriti-teal-600 dark:text-smriti-teal-400" />
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('modals.offlineDbStatusTitle')}</h3>
              </div>
              <button
                onClick={() => setShowSyncModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 py-5 text-sm">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl">
                <span className="text-slate-600 dark:text-slate-400">{t('modals.connectivityState')}</span>
                <span className={`font-bold px-2.5 py-1 rounded-full text-xs ${isOnline ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'}`}>
                  {isOnline ? `🟢 ${t('modals.connectedOnline')}` : `🟠 ${t('modals.offlineMode')}`}
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl">
                <span className="text-slate-600 dark:text-slate-400">{t('modals.localStorageEngine')}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">IndexedDB (Dexie.js)</span>
              </div>

              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl">
                <span className="text-slate-600 dark:text-slate-400">{t('modals.totalOfflineRecords')}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{stats.totalRecords}</span>
              </div>

              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl">
                <span className="text-slate-600 dark:text-slate-400">{t('modals.pendingSyncQueue')}</span>
                <span className={`font-bold ${stats.unsyncedCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {stats.unsyncedCount}
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl">
                <span className="text-slate-600 dark:text-slate-400">{t('modals.lastSynced')}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{stats.lastSync}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => triggerSync(false)}
                disabled={isSyncing}
                className="flex-1 bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? t('common.syncing') : t('modals.forceSync')}
              </button>
              <button
                onClick={() => setShowSyncModal(false)}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 px-5 rounded-xl transition-colors cursor-pointer"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium 3-Line Hamburger Navigation Drawer */}
      <NavigationDrawer
        isOpen={isNavDrawerOpen}
        onClose={() => setIsNavDrawerOpen(false)}
        onOpenAssistant={openAssistant}
        onOpenSyncModal={() => setShowSyncModal(true)}
        onOpenEmergency={onOpenEmergency}
      />
    </header>
  );
}
