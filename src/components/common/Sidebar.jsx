import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Gamepad2, 
  BarChart3, 
  Bot, 
  CalendarCheck, 
  BookOpen, 
  Users, 
  Settings,
  Sparkles,
  Leaf,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useAssistant } from '../../context/AssistantContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { usePatientLocation } from '../../hooks/usePatientLocation';
import { SmritiLogo } from './NerIcons';

export default function Sidebar({ className = '' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { openAssistant } = useAssistant();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { currentUser } = useAuth();

  // Keep background geolocation tracking active while in patient view
  usePatientLocation(currentUser?.id || 1, true);

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: '/patient/home',
      exact: true
    },
    {
      id: 'games',
      label: 'Cognitive Games',
      icon: Gamepad2,
      path: '/patient/games'
    },
    {
      id: 'progress',
      label: 'My Progress',
      icon: BarChart3,
      path: '/patient/progress'
    },
    {
      id: 'assistant',
      label: 'AI Companion',
      icon: Bot,
      action: () => openAssistant(),
      badge: 'New'
    },
    {
      id: 'activities',
      label: 'Daily Activities',
      icon: CalendarCheck,
      path: '/patient/reminders'
    },
    {
      id: 'resources',
      label: 'Resources',
      icon: BookOpen,
      path: '/economy'
    },
    {
      id: 'community',
      label: 'Community',
      icon: Users,
      path: '/community'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/profile'
    }
  ];

  return (
    <aside 
      aria-label="Sidebar Navigation"
      className={`hidden lg:flex flex-col justify-between w-64 xl:w-72 bg-[#FAFDF9] dark:bg-[#081412] border-r border-[#DFEAE2] dark:border-[#183830] min-h-screen sticky top-0 py-6 px-4 z-30 transition-colors duration-200 select-none ${className}`}
    >
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-3 px-2 mb-8 cursor-pointer" onClick={() => navigate('/patient/home')}>
          <div className="w-10 h-10 rounded-xl bg-[#DCF0E4] dark:bg-[#0D2318] flex items-center justify-center p-1.5 shadow-sm border border-[#BAD9C6] dark:border-[#153A28]">
            <SmritiLogo className="w-full h-full text-[#143D30] dark:text-[#2DD4BF]" showText={false} />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-xl tracking-tight text-[#142823] dark:text-[#F0F6F4] leading-none">
              SmritiCare
            </span>
            <span className="text-[10px] text-[#5C756D] dark:text-[#7E9C94] tracking-wide mt-1 font-medium leading-tight">
              Care Connects Generations
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path 
              ? (item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path))
              : false;

            if (item.action) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group cursor-pointer ${
                    isActive
                      ? 'bg-[#143D30] text-white shadow-sm dark:bg-[#122E26] dark:text-[#5EEAD4] dark:border dark:border-[#14B8A6]/40'
                      : 'text-[#5C756D] hover:text-[#143D30] hover:bg-[#EFF6F1] dark:text-[#7E9C94] dark:hover:text-[#F0F6F4] dark:hover:bg-[#102520]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white dark:text-[#5EEAD4]' : 'text-[#5C756D] dark:text-[#7E9C94]'
                    }`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-[#DCF0E4] dark:bg-[#0D2620] text-[#143D30] dark:text-[#34D399] border border-[#BAD9C6] dark:border-[#183830]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            }

            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive: linkActive }) => `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  linkActive || isActive
                    ? 'bg-[#143D30] text-white shadow-sm dark:bg-[#122E26] dark:text-[#5EEAD4] dark:border dark:border-[#14B8A6]/40'
                    : 'text-[#5C756D] hover:text-[#143D30] hover:bg-[#EFF6F1] dark:text-[#7E9C94] dark:hover:text-[#F0F6F4] dark:hover:bg-[#102520]'
                }`}
              >
                {({ isActive: linkActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        linkActive || isActive ? 'text-white dark:text-[#5EEAD4]' : 'text-[#5C756D] dark:text-[#7E9C94]'
                      }`} />
                      <span>{item.label}</span>
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Dedicated Location & Safety Navigation Card */}
        <div className="mt-4 pt-4 border-t border-[#DFEAE2] dark:border-[#183830]">
          <NavLink
            to="/patient/safety"
            className={({ isActive }) => `block p-3 rounded-2xl transition-all cursor-pointer group ${
              isActive || location.pathname === '/patient/safety'
                ? 'bg-[#143D30] text-white shadow-sm dark:bg-[#122E26] dark:text-[#5EEAD4] dark:border dark:border-[#14B8A6]/40'
                : 'bg-emerald-50/70 dark:bg-[#0C1F1B] border border-emerald-200/70 dark:border-[#183D33] hover:bg-emerald-100/70 dark:hover:bg-[#102B25] text-[#142823] dark:text-[#E2EAE5]'
            }`}
          >
            {({ isActive }) => {
              const active = isActive || location.pathname === '/patient/safety';
              return (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        active 
                          ? 'bg-white/20 text-white dark:text-[#5EEAD4]' 
                          : 'bg-emerald-100 dark:bg-[#133A2F] text-emerald-700 dark:text-[#2DD4BF]'
                      }`}>
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className={`text-xs font-bold block ${
                          active ? 'text-white dark:text-[#5EEAD4]' : 'text-[#143D30] dark:text-[#E2F5EC]'
                        }`}>
                          {t('location.locationAndSafety') || 'Location & Safety'}
                        </span>
                        <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                          active ? 'text-emerald-200 dark:text-[#5EEAD4]' : 'text-emerald-700 dark:text-[#34D399]'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>{t('location.sharingOn') || 'Sharing On'}</span>
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                      active ? 'text-white/80 dark:text-[#5EEAD4]' : 'text-[#5C756D] dark:text-[#7E9C94]'
                    }`} />
                  </div>
                  <p className={`text-[10px] leading-tight px-0.5 ${
                    active ? 'text-emerald-100/90 dark:text-[#B2ECE1]' : 'text-[#5C756D] dark:text-[#7E9C94]'
                  }`}>
                    {t('location.sidebarNotice') || 'Your location is being shared securely with your caregiver.'}
                  </p>
                </div>
              );
            }}
          </NavLink>
        </div>
      </div>

      {/* Bottom Botanical Inspiration Quote */}
      <div className="pt-6 mt-6 border-t border-[#DFEAE2] dark:border-[#183830] px-2">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center shrink-0 text-emerald-700 dark:text-emerald-400">
            <Leaf className="w-4 h-4" />
          </div>
          <div>
            <p className="font-serif italic text-xs leading-relaxed text-[#495C55] dark:text-[#A1B5AF]">
              {isDark 
                ? '“Same purpose. A calmer you.”' 
                : '“A healthier mind builds a brighter tomorrow.”'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
