import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Menu, Globe, Wifi, WifiOff, RefreshCw, LogOut, Database, User, Users, Sun, Moon, Settings, ChevronDown, LogIn, Coins, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAssistant } from '../../context/AssistantContext';
import { SmritiLogo } from './NerIcons';
import UserAvatar from './UserAvatar';
import NavigationDrawer from './NavigationDrawer';
import NotificationBell from '../notifications/NotificationBell';
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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  const [stats, setStats] = useState({ totalRecords: 0, unsyncedCount: 0, lastSync: 'Never' });

  // Close menu on navigation
  useEffect(() => {
    setShowUserMenu(false);
  }, [location.pathname]);

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

  const languages = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'as', label: 'Assamese', native: 'অসমীয়া' },
    { code: 'bn', label: 'Bengali', native: 'বাংলা' }
  ];

  const isCommunityActive = location.pathname.startsWith('/community') || location.pathname.startsWith('/patient/community');

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0E172A]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-[#243352] shadow-sm px-4 md:px-8 py-3 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: 3-Line Hamburger, Logo & Primary Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* 3-Line Hamburger Menu Trigger */}
          <button
            type="button"
            onClick={() => setIsNavDrawerOpen(true)}
            className="p-2 sm:p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-[#162238] dark:hover:bg-[#1E293B] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#243352] transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-smriti-teal-500 cursor-pointer shadow-xs active:scale-95"
            aria-label={t('menu.title') || 'Open Navigation Menu'}
            aria-expanded={isNavDrawerOpen}
            title={t('menu.title') || 'Menu'}
          >
            <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            <span className="text-xs font-black hidden lg:inline">{t('menu.title') || 'Menu'}</span>
          </button>

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
            className="hover:opacity-90 transition-opacity flex items-center"
          >
            <SmritiLogo className="w-10 h-10 md:w-11 md:h-11" textClass="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white" />
          </Link>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Online/Offline Status Pill */}
          <button
            onClick={() => { loadStats(); setShowSyncModal(true); }}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold border transition-all ${
              isOnline
                ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
            }`}
            title="Click to view offline database status"
          >
            {isOnline ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="hidden sm:inline">🟢 {t('synced')}</span>
                <span className="sm:hidden">🟢</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="hidden sm:inline">🟠 {t('offline')}</span>
                <span className="sm:hidden">🟠</span>
              </>
            )}
            <Database className="w-3.5 h-3.5 opacity-60 ml-0.5" />
          </button>

          {/* Centralized Notification Bell with Live Unread Badge */}
          <NotificationBell />

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="inline-flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-300 border border-slate-300 dark:border-slate-700 transition-all shadow-xs active:scale-95"
            title={isDark ? t('lightMode') : t('darkMode')}
            aria-label={t('toggleTheme')}
          >
            {isDark ? (
              <Sun className="w-4 h-4 md:w-5 md:h-5 text-amber-400 animate-pulse" />
            ) : (
              <Moon className="w-4 h-4 md:w-5 md:h-5 text-slate-700" />
            )}
          </button>

          {/* Language Selector */}
          <div className="relative inline-flex items-center">
            <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-2.5 pointer-events-none hidden sm:block" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs md:text-sm font-semibold rounded-xl pl-2 sm:pl-8 pr-2 py-1.5 border border-slate-300 dark:border-slate-700 cursor-pointer focus:ring-2 focus:ring-smriti-teal-500"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.native}
                </option>
              ))}
            </select>
          </div>

          {/* User Profile & Menu / Sign In */}
          {currentUser ? (
            <div className="relative pl-2 border-l border-slate-300 dark:border-slate-700">
              <button
                onClick={() => setShowUserMenu((prev) => !prev)}
                className="flex items-center gap-2 p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-smriti-teal-500"
                aria-expanded={showUserMenu}
                aria-label="User Account Menu"
              >
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight max-w-[130px] truncate">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] uppercase font-extrabold text-smriti-teal-700 dark:text-smriti-teal-400 tracking-wider">
                    {currentUser.role}
                  </span>
                </div>
                <UserAvatar user={currentUser} size="sm" showStatus={isOnline} />
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl border border-slate-200 dark:border-[#243352] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User header info in menu */}
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-[#243352] flex items-center gap-3">
                      <UserAvatar user={currentUser} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                          {currentUser.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {currentUser.email}
                        </p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-black uppercase rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                          {currentUser.role}
                        </span>
                      </div>
                    </div>

                    {/* Navigation Items */}
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-smriti-teal-600 dark:hover:text-teal-300 transition-colors"
                      >
                        <User className="w-4 h-4 text-smriti-teal-600 dark:text-teal-400" />
                        <span>{t('navigation.profile')}</span>
                      </Link>

                      <Link
                        to="/role-select"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-smriti-teal-600 dark:hover:text-teal-300 transition-colors"
                      >
                        <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>{t('navigation.switchRole')}</span>
                      </Link>

                      <Link
                        to="/economy"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        <Coins className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>{t('navigation.economy')}</span>
                      </Link>

                      <Link
                        to="/economy?tab=my-rewards"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span>{t('economy.myRewards')}</span>
                      </Link>
                    </div>

                    {/* Logout Button */}
                    <div className="border-t border-slate-100 dark:border-[#243352] pt-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('navigation.signOut')}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white text-xs font-black shadow-xs transition-colors cursor-pointer"
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
