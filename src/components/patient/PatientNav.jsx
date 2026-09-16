import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Gamepad2, Bell, Sparkles, PhoneCall, HeartHandshake } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function PatientNav({ onOpenEmergency }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { path: '/patient/home', key: 'navigation.home', icon: Home },
    { path: '/patient/games', key: 'navigation.games', icon: Gamepad2 },
    { path: '/patient/reminders', key: 'navigation.reminders', icon: Bell },
    { path: '/patient/progress', key: 'navigation.progress', icon: Sparkles },
    { path: '/community', key: 'navigation.community', icon: HeartHandshake },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0E172A]/95 backdrop-blur-xl border-t-2 border-slate-200/90 dark:border-[#243352] shadow-2xl py-2.5 px-3 md:px-8 transition-colors duration-200">
      <div className="max-w-3xl mx-auto flex items-center justify-around gap-2">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-2 rounded-2xl transition-all select-none min-h-[60px] cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-br from-smriti-teal-600 to-smriti-teal-700 text-white shadow-elder font-black scale-102'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E293B] font-extrabold hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-7 h-7 mb-1 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
              <span className="text-xs md:text-sm leading-none">{t(item.key)}</span>
            </button>
          );
        })}

        {/* Emergency Call Quick Button */}
        <button
          onClick={onOpenEmergency}
          className="flex flex-col items-center justify-center py-2 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-black shadow-md min-h-[60px] transition-all select-none cursor-pointer border border-rose-400/30"
          title={t('navigation.emergencyCallTitle')}
        >
          <PhoneCall className="w-6 h-6 mb-1 animate-bounce" />
          <span className="text-xs md:text-sm leading-none">{t('navigation.emergencyCall')}</span>
        </button>
      </div>
    </nav>
  );
}
