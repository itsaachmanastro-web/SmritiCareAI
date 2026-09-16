import React from 'react';
import { Globe, Users, HeartHandshake, ShieldAlert, MessageCircle, Settings, ShieldCheck, Heart, Sparkles, Plus } from 'lucide-react';
import ElderButton from '../common/ElderButton';
import { useLanguage } from '../../context/LanguageContext';

export default function CommunityHeader({
  activeTab,
  setActiveTab,
  onOpenCreatePost,
  onOpenPrivacy,
  onOpenModerator,
  isModerator = false,
  pendingReportsCount = 0
}) {
  const { t } = useLanguage();

  const tabs = [
    { id: 'feed', label: t('community.feedTab'), icon: HeartHandshake },
    { id: 'groups', label: t('community.groupsTab'), icon: Users },
    { id: 'people', label: t('community.peopleTab'), icon: Globe },
    { id: 'messages', label: t('community.messagesTab'), icon: MessageCircle }
  ];

  return (
    <div className="bg-white dark:bg-[#131D33] rounded-3xl md:rounded-4xl p-6 md:p-8 border border-slate-200 dark:border-[#243352] shadow-sm mb-8 space-y-6 transition-colors duration-200">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-[#243352]">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs md:text-sm font-extrabold mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span>
            <span>{t('community.worldwideNetwork')}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white font-display tracking-tight leading-tight">
            {t('community.title')}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium mt-1">
            "{t('community.subtitle')} <span className="font-bold text-smriti-teal-700 dark:text-teal-400">{t('community.youAreNotAlone')}</span>"
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <ElderButton
            variant="orange"
            size="md"
            icon={Plus}
            onClick={onOpenCreatePost}
          >
            {t('community.startConversation')}
          </ElderButton>

          <button
            onClick={onOpenPrivacy}
            className="p-3.5 rounded-2xl bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#25334D] text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-[#243352] cursor-pointer"
            title="Community Profile & Privacy Settings"
          >
            <Settings className="w-6 h-6" />
          </button>

          {isModerator && (
            <button
              onClick={onOpenModerator}
              className="relative p-3.5 rounded-2xl bg-amber-100 dark:bg-amber-950 hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 transition-colors border border-amber-300 dark:border-amber-800 cursor-pointer"
              title="Moderator Dashboard"
            >
              <ShieldCheck className="w-6 h-6" />
              {pendingReportsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white rounded-full text-[11px] font-black flex items-center justify-center">
                  {pendingReportsCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Primary Accessible Tabs */}
      <div className="flex flex-wrap gap-2 md:gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-base md:text-lg transition-all min-h-[56px] select-none cursor-pointer ${
                isActive
                  ? 'bg-smriti-teal-600 text-white shadow-md btn-tactile-teal'
                  : 'bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#25334D] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-[#243352]'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Medical Safety Disclaimer Banner (Mandatory Medical Safety Principle) */}
      <div className="bg-amber-50/80 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-3.5 px-4 flex items-center gap-3 text-xs md:text-sm text-amber-900 dark:text-amber-200">
        <ShieldAlert className="w-5 h-5 text-amber-700 dark:text-amber-400 flex-shrink-0" />
        <p className="leading-snug">
          {t('community.safetyDisclaimer')}
        </p>
      </div>
    </div>
  );
}
