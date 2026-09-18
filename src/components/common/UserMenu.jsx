import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  LogOut,
  ChevronDown,
  Users,
  Coins,
  Award
} from 'lucide-react';
import UserAvatar from './UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

/**
 * Reusable User Menu & Profile Dropdown Component
 * 
 * Supports 3 trigger variants:
 * - 'header': Compact avatar pill for the global top header
 * - 'caregiver': Avatar + Greeting + First Name for Caregiver Dashboard
 * - 'clinician': Avatar + Doctor Name + Designation for Clinician Dashboard
 * 
 * Dropdown includes:
 * - Real User Identity (Avatar, Full Name, Email, Role badge)
 * - View & Edit Profile (/profile)
 * - Switch Role (/role-select)
 * - Smriti Economy (/economy)
 * - My Orders (/economy?tab=my-rewards)
 * - Sign Out (logout with full session cleanup & redirect)
 */
export default function UserMenu({
  variant = 'header',
  className = ''
}) {
  const { currentUser, logout, isOnline } = useAuth();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!currentUser) return null;

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/');
    }
  };

  const firstName = currentUser.name ? currentUser.name.split(' ')[0] : 'User';

  // Dynamic greeting based on hour of day
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 
    ? (t('common.goodMorning') || 'Good Morning,')
    : currentHour < 17 
    ? (t('common.goodAfternoon') || 'Good Afternoon,')
    : (t('common.goodEvening') || 'Good Evening,');

  // Fallback avatars for unedited demo roles
  const roleAvatarFallback = 
    currentUser.role === 'caregiver'
      ? '/assets/images/caregiver-priya-avatar.jpg'
      : currentUser.role === 'healthcare'
      ? '/assets/images/clinician-doctor-avatar.jpg'
      : undefined;

  // Role badge display config
  const getRoleBadge = () => {
    switch (currentUser.role) {
      case 'caregiver':
        return {
          label: t('common.caregiver') || 'Caregiver',
          badgeClass: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
        };
      case 'healthcare':
      case 'clinician':
        return {
          label: t('clinician.roleBadge') || 'Healthcare Officer',
          badgeClass: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700'
        };
      default:
        return {
          label: t('common.patient') || 'Patient',
          badgeClass: 'bg-[#E8F3ED] dark:bg-[#102923] text-[#143D30] dark:text-[#34D399] border-[#BAD9C6] dark:border-[#153A28]'
        };
    }
  };

  const roleInfo = getRoleBadge();

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      {/* 1. CAREGIVER TRIGGER VARIANT */}
      {variant === 'caregiver' ? (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2.5 pl-2 sm:border-l sm:border-[#ECE7DE] dark:sm:border-[#152225] cursor-pointer group focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl py-1 pr-1.5 transition-all text-left"
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label="Caregiver account menu"
        >
          <UserAvatar
            user={currentUser}
            image={currentUser.profileImage || currentUser.avatar || roleAvatarFallback}
            size="sm"
            className="w-8 h-8 rounded-full object-cover border border-emerald-300 dark:border-emerald-600/50 shadow-2xs group-hover:ring-2 group-hover:ring-emerald-400 transition-all"
          />
          <div className="hidden md:flex flex-col text-left">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-[#192320] dark:text-[#F1F5F5] leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                {greeting}
              </span>
              <ChevronDown className={`w-3 h-3 text-[#8C9B95] dark:text-[#64748B] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            <span className="text-[11px] text-[#6E7D76] dark:text-[#7A938C] leading-none font-medium">
              {firstName}
            </span>
          </div>
        </button>
      ) : variant === 'clinician' ? (
        /* 2. CLINICIAN TRIGGER VARIANT */
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2.5 pl-2 sm:border-l sm:border-[#ECE7DE] dark:sm:border-[#152225] cursor-pointer group focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl py-1 pr-1.5 transition-all text-left"
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label="Clinician account menu"
        >
          <UserAvatar
            user={currentUser}
            image={currentUser.profileImage || currentUser.avatar || roleAvatarFallback}
            size="sm"
            className="w-8 h-8 rounded-full object-cover border border-emerald-300 dark:border-emerald-600/50 shadow-2xs group-hover:ring-2 group-hover:ring-emerald-400 transition-all"
          />
          <div className="hidden md:flex flex-col text-left">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-[#192320] dark:text-[#F1F5F5] leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate max-w-[140px]">
                {currentUser.name || 'Dr. Arun Phukan'}
              </span>
              <ChevronDown className={`w-3 h-3 text-[#8C9B95] dark:text-[#64748B] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            <span className="text-[11px] text-[#6E7D76] dark:text-[#7A938C] leading-none font-medium truncate max-w-[140px]">
              {currentUser.designation || t('clinician.phcMedicalOfficer') || 'PHC Medical Officer'}
            </span>
          </div>
        </button>
      ) : (
        /* 3. GLOBAL HEADER TRIGGER VARIANT */
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2.5 p-1 pr-2 rounded-full hover:bg-white/80 dark:hover:bg-[#0E221E] border border-transparent hover:border-[#DFEAE2] dark:hover:border-[#183830] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#143D30]"
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label="User Account Menu"
        >
          <div className="relative">
            <UserAvatar user={currentUser} size="sm" showStatus={isOnline} />
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-[#142823] dark:text-[#F0F6F4] leading-tight">
              {firstName}
            </span>
            <span className="text-[10px] text-[#5C756D] dark:text-[#7E9C94] font-medium leading-tight">
              {t('common.goodToSeeYou') || 'Good to see you!'}
            </span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-[#5C756D] dark:text-[#7E9C94] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#0E221E] rounded-2xl shadow-2xl border border-[#DFEAE2] dark:border-[#183830] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User header info in menu */}
          <div className="px-4 py-3 border-b border-[#EFF5F1] dark:border-[#183830] flex items-center gap-3">
            <UserAvatar
              user={currentUser}
              image={currentUser.profileImage || currentUser.avatar || roleAvatarFallback}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-[#142823] dark:text-white truncate">
                {currentUser.name}
              </p>
              <p className="text-xs text-[#5C756D] dark:text-[#7E9C94] truncate">
                {currentUser.email}
              </p>
              <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-black uppercase rounded-md border ${roleInfo.badgeClass}`}>
                {roleInfo.label}
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="py-1">
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-[#142823] dark:text-[#CBD5E1] hover:bg-[#EFF6F1] dark:hover:bg-[#132A24] hover:text-[#143D30] dark:hover:text-[#34D399] transition-colors"
            >
              <User className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" />
              <span>{t('navigation.profile')}</span>
            </Link>

            <Link
              to="/role-select"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-[#142823] dark:text-[#CBD5E1] hover:bg-[#EFF6F1] dark:hover:bg-[#132A24] hover:text-[#143D30] dark:hover:text-[#34D399] transition-colors"
            >
              <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{t('navigation.switchRole')}</span>
            </Link>

            <Link
              to="/economy"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-[#142823] dark:text-[#CBD5E1] hover:bg-[#EFF6F1] dark:hover:bg-[#132A24] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <Coins className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{t('navigation.economy')}</span>
            </Link>

            <Link
              to="/economy?tab=my-rewards"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-[#142823] dark:text-[#CBD5E1] hover:bg-[#EFF6F1] dark:hover:bg-[#132A24] hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>{t('economy.myRewards')}</span>
            </Link>
          </div>

          {/* Logout Button */}
          <div className="border-t border-[#EFF5F1] dark:border-[#183830] pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('navigation.signOut')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
