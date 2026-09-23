import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Heart,
  CalendarCheck,
  Pill,
  MapPin,
  FileText,
  Users,
  BookOpen,
  Settings,
  Leaf
} from 'lucide-react';
import { SmritiLogo } from '../common/NerIcons';
import UserAvatar from '../common/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useEntitlements } from '../../hooks/useEntitlements';

export default function CaregiverSidebar({ 
  activeTab = 'home', 
  onSelectTab = () => {},
  className = '' 
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { canAccessReports } = useEntitlements();

  const navItems = [
    { id: 'home', label: t('navigation.home') || 'Home', icon: Home },
    { id: 'loved-one', label: t('caregiver.lovedOne') || 'Loved One', icon: Heart },
    { id: 'location', label: t('location.patientLocation') || 'Patient Location', icon: MapPin },
    { id: 'daily-care', label: t('caregiver.dailyCare') || 'Daily Care', icon: CalendarCheck },
    { id: 'medication', label: t('caregiver.medication') || 'Medication', icon: Pill },
    { id: 'reports', label: t('navigation.reports') || 'Reports', icon: FileText, isLocked: !canAccessReports, lockedTier: 'Standard+' },
    { id: 'community', label: t('navigation.community') || 'Community', icon: Users, path: '/community' },
    { id: 'resources', label: t('navigation.resources') || 'Resources', icon: BookOpen, path: '/economy' },
    { id: 'settings', label: t('navigation.settings') || 'Settings', icon: Settings },
  ];

  const handleNavClick = (item) => {
    if (item.path) {
      navigate(item.path);
    } else {
      onSelectTab(item.id);
    }
  };

  return (
    <aside 
      aria-label="Caregiver Sidebar Navigation"
      className={`hidden lg:flex flex-col justify-between w-60 xl:w-64 bg-[#FAF8F5] dark:bg-[#070D0E] border-r border-[#ECE7DE] dark:border-[#152225] min-h-screen sticky top-0 py-6 px-4 z-30 transition-colors duration-200 select-none shrink-0 ${className}`}
    >
      {/* 1. BRAND HEADER — EXACTLY ONE SMRITICARE LOGO ON THE ENTIRE PAGE */}
      <div>
        <div 
          className="flex items-center gap-3 px-2 mb-7 cursor-pointer group" 
          onClick={() => {
            onSelectTab('home');
            navigate('/caregiver/dashboard');
          }}
        >
          <div className="w-10 h-10 rounded-xl bg-[#E8F1EC] dark:bg-[#0E2320] flex items-center justify-center p-2 shadow-xs border border-[#D5E5DC] dark:border-[#163832] group-hover:scale-105 transition-transform">
            <SmritiLogo className="w-full h-full text-[#143D30] dark:text-[#2DD4BF]" showText={false} />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-xl tracking-tight text-[#192320] dark:text-[#F1F5F5] leading-none">
              SmritiCare
            </span>
            <span className="text-[10px] text-[#6E7D76] dark:text-[#7A938C] tracking-wide mt-1 font-medium leading-tight">
              {t('common.footerTagline') || 'Care Connects Generations'}
            </span>
          </div>
        </div>

        {/* 2. NAVIGATION ITEMS */}
        <nav className="space-y-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#143D30] text-white shadow-xs dark:bg-[#122C27] dark:border dark:border-[#1E4D43] dark:text-[#4ADE80]'
                    : 'text-[#4A5954] dark:text-[#94A3B8] hover:text-[#192320] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white dark:text-[#4ADE80]' : 'text-[#6E7D76] dark:text-[#64748B]'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.isLocked && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800 shrink-0">
                    {item.lockedTier}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 3. BOTTOM SECTION: BOTANICAL INSPIRATION & PRIYA SHARMA PROFILE */}
      <div className="pt-4 border-t border-[#ECE7DE] dark:border-[#152225] space-y-4">
        {/* Botanical Inspiration Quote matching Reference Image */}
        <div className="flex items-start gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-[#E8F1EC] dark:bg-[#0E2320] flex items-center justify-center shrink-0 text-[#143D30] dark:text-[#2DD4BF] border border-[#D5E5DC] dark:border-[#163832]">
            <Leaf className="w-4 h-4" />
          </div>
          <p className="font-serif italic text-xs text-[#52645E] dark:text-[#889B95] leading-snug">
            {isDark 
              ? `“${t('caregiver.trajectoryGood') || 'Stronger families. Brighter tomorrows.'}”` 
              : `“${t('auth.caringTodayQuote') || 'Together for a healthier, happier tomorrow.'}”`
            }
          </p>
        </div>

        {/* Caregiver Profile Card */}
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left group cursor-pointer"
          title={t('navigation.profile') || 'View Profile'}
        >
          <UserAvatar
            user={currentUser}
            image={currentUser?.profileImage || currentUser?.avatar || '/assets/images/caregiver-priya-avatar.jpg'}
            size="sm"
            className="w-9 h-9 rounded-full object-cover border border-emerald-300 dark:border-emerald-600/40 shrink-0 group-hover:scale-105 transition-transform"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#192320] dark:text-[#F1F5F5] truncate leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
              {currentUser?.name || 'Priya Sharma'}
            </p>
            <p className="text-[11px] text-[#6E7D76] dark:text-[#7A938C] truncate font-medium">
              {currentUser?.relation ? `${currentUser.relation} (${t('auth.familyCaregiver') || 'Family Caregiver'})` : (t('auth.familyCaregiver') || 'Family Caregiver')}
            </p>
          </div>
        </button>
      </div>
    </aside>
  );
}
