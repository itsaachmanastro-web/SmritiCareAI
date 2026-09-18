import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Globe,
  Filter,
  Plus,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  Check,
  Calendar,
  Gamepad2,
  Sparkles,
  Leaf,
  ArrowRight,
  ShieldCheck,
  Pill,
  Wifi,
  MoreVertical,
  X
} from 'lucide-react';
import { SmritiLogo } from '../../components/common/NerIcons';
import PostCard from '../../components/community/PostCard';
import { communityService } from '../../services/communityService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { playMatchSuccessSound } from '../../audio/synthAudio';

export default function CommunityPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  // Navigation & Category States
  const [activeNavTab, setActiveNavTab] = useState('community'); // 'community', 'caregiver', 'tips', 'stories', 'resources'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('Caregiver Support');
  const [reportModalPost, setReportModalPost] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Primary Community Feed Data seeded matching Reference Image
  const initialPosts = [
    {
      id: 'post-101',
      author_id: 'user-saubhagya',
      author_name: 'Saubhagya',
      author_role: 'Healthcare Professional',
      author_avatar: '/assets/images/clinician-doctor-avatar.jpg',
      author_location: 'Assam, India',
      created_at: '2024-09-15T10:00:00Z',
      category: 'Caregiver Support',
      title: 'Good morning!',
      content: 'How do you help patients who feel restless in the evening? Any simple activities that work well?',
      likes_count: 12,
      comments_count: 8,
      comments: [
        { id: 'c1', author_name: 'Priya Borah', author_role: 'Caregiver', content: 'Playing soft traditional flute music and gentle folding of soft tea towels keeps Amma calm every evening.', created_at: '2024-09-15T10:30:00Z' },
        { id: 'c2', author_name: 'Dr. Arun Phukan', author_role: 'PHC Medical Officer', content: 'Reducing harsh blue lights around 5:30 PM significantly minimizes sundowning agitation.', created_at: '2024-09-15T11:00:00Z' }
      ]
    },
    {
      id: 'post-102',
      author_id: 'user-priya',
      author_name: 'Priya Borah',
      author_role: 'Caregiver',
      author_avatar: '/assets/images/caregiver-priya-avatar.jpg',
      author_location: 'Assam, India',
      created_at: '2024-09-12T08:30:00Z',
      category: 'Daily Life',
      title: 'Today was a difficult morning...',
      content: 'My mother seemed more confused today. Looking for advice on how to keep her calm and engaged.',
      likes_count: 8,
      comments_count: 5,
      comments: [
        { id: 'c3', author_name: 'Sunita Sharma', author_role: 'Caregiver', content: 'Stay strong Priya. When mornings are foggy, we sit together in the morning sun with warm chamomile tea without rushing any questions.', created_at: '2024-09-12T09:15:00Z' }
      ]
    },
    {
      id: 'post-103',
      author_id: 'user-arun',
      author_name: 'Dr. Arun Phukan',
      author_role: 'Healthcare Professional',
      author_avatar: '/assets/images/clinician-doctor-avatar.jpg',
      author_location: 'Titabar PHC, Assam',
      created_at: '2024-09-10T14:20:00Z',
      category: 'Communication Tips',
      title: 'Validation over correction',
      content: 'When our elders remember events from 30 years ago as if they happened today, validate their emotions instead of contradicting them. Meeting them in their reality creates trust and peace.',
      likes_count: 34,
      comments_count: 11,
      comments: []
    }
  ];

  const [postsList, setPostsList] = useState(initialPosts);

  // Category filter items matching reference image
  const categoryFilters = [
    { id: 'All', label: t('community.categories.all') || 'All', icon: null },
    { id: 'Caregiver Support', label: t('community.categories.caregiverSupport') || 'Caregiver Support', icon: Heart },
    { id: 'Daily Life', label: t('community.categories.dailyLife') || 'Daily Life', icon: Calendar },
    { id: 'Memory & Activities', label: t('community.categories.memoryActivities') || 'Memory & Activities', icon: Gamepad2 },
    { id: 'Communication Tips', label: t('community.categories.communicationTips') || 'Communication Tips', icon: MessageCircle },
    { id: 'Emotional Support', label: t('community.categories.emotionalSupport') || 'Emotional Support', icon: Heart },
    { id: 'Family Support', label: t('community.categories.familySupport') || 'Family Support', icon: Users }
  ];

  // Trending topics list matching reference image
  const trendingTopics = [
    { id: 'Managing Evening Restlessness', title: t('community.trending.eveningRestlessness') || 'Managing Evening Restlessness', count: `24 ${t('community.postsCountSuffix') || 'posts'}`, icon: Moon },
    { id: 'Simple Cognitive Activities at Home', title: t('community.trending.cognitiveActivities') || 'Simple Cognitive Activities at Home', count: `18 ${t('community.postsCountSuffix') || 'posts'}`, icon: Gamepad2 },
    { id: 'Medication Reminders', title: t('community.trending.medicationReminders') || 'Medication Reminders', count: `16 ${t('community.postsCountSuffix') || 'posts'}`, icon: Pill },
    { id: 'Caring from a Distance', title: t('community.trending.caringDistance') || 'Caring from a Distance', count: `12 ${t('community.postsCountSuffix') || 'posts'}`, icon: Wifi },
    { id: 'Emotional Well-being for Caregivers', title: t('community.trending.emotionalWellbeing') || 'Emotional Well-being for Caregivers', count: `10 ${t('community.postsCountSuffix') || 'posts'}`, icon: Heart }
  ];

  // Handle Post Creation
  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const newPost = {
      id: `post-${Date.now()}`,
      author_id: currentUser?.id ? `user-${currentUser.id}` : 'user-saubhagya',
      author_name: currentUser?.name || 'Saubhagya',
      author_role: currentUser?.role === 'healthcare' ? 'Healthcare Professional' : currentUser?.role === 'caregiver' ? 'Caregiver' : 'Community Member',
      author_avatar: currentUser?.avatar || '/assets/images/clinician-doctor-avatar.jpg',
      author_location: currentUser?.location || 'Assam, India',
      created_at: new Date().toISOString(),
      category: newPostCategory,
      title: newPostTitle.trim() || 'Community Reflection',
      content: newPostContent.trim(),
      likes_count: 0,
      comments_count: 0,
      comments: []
    };

    setPostsList([newPost, ...postsList]);
    setNewPostTitle('');
    setNewPostContent('');
    setIsCreateModalOpen(false);
    playMatchSuccessSound();
    setToastMessage(t('community.postCreatedToast') || 'Conversation started successfully!');
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Filter & Search Logic
  const filteredPosts = postsList.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() ||
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 5 Regional Languages matching Reference Image
  const regionalLanguages = [
    { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'हिंदी (Hindi)', native: 'हिंदी', flag: '🇮🇳' },
    { code: 'as', label: 'অসমীয়া (Assamese)', native: 'অসমীয়া', flag: '🌺' },
    { code: 'bn', label: 'বাংলা (Bengali)', native: 'বাংলা', flag: '🇧🇩' },
    { code: 'mni', label: 'মণিপুরী (Manipuri)', native: 'মৈতৈলোন্', flag: '🛡️' }
  ];

  const currentLangObj = regionalLanguages.find(l => l.code === language) || regionalLanguages[0];

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#070D0E] text-[#192320] dark:text-[#F1F5F5] font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-800 transition-colors duration-200 flex flex-col justify-between">
      {/* 1. TOP HEADER — EXACTLY ONE SMRITICARE LOGO ON THE PAGE */}
      <header className="sticky top-0 z-30 w-full bg-[#FAF8F5]/90 dark:bg-[#070D0E]/90 backdrop-blur-md border-b border-[#ECE7DE] dark:border-[#152225] px-4 md:px-8 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: SmritiCare Brand Header */}
          <div
            className="flex items-center gap-3 cursor-pointer group shrink-0"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 rounded-xl bg-[#E8F1EC] dark:bg-[#0E2320] flex items-center justify-center p-2 shadow-xs border border-[#D5E5DC] dark:border-[#163832] group-hover:scale-105 transition-transform">
              <SmritiLogo className="w-full h-full text-[#143D30] dark:text-[#2DD4BF]" showText={false} />
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-xl tracking-tight text-[#192320] dark:text-[#F1F5F5] leading-none">
                SmritiCare
              </span>
              <span className="text-[10px] text-[#6E7D76] dark:text-[#7A938C] tracking-wide mt-1 font-medium leading-tight">
                {t('common.brandTagline') || 'Care Connects Generations'}
              </span>
            </div>
          </div>

          {/* Center Navigation Tabs matching Reference Image */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-3 text-xs font-semibold">
            {[
              { id: 'community', label: t('community.tabs.community') || 'Community' },
              { id: 'caregiver', label: t('community.tabs.caregiver') || 'Caregiver Support' },
              { id: 'tips', label: t('community.tabs.tips') || 'Expert Tips' },
              { id: 'stories', label: t('community.tabs.stories') || 'Stories' },
              { id: 'resources', label: t('community.tabs.resources') || 'Resources' }
            ].map(tab => {
              const isActive = activeNavTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveNavTab(tab.id);
                    if (tab.id === 'caregiver') setSelectedCategory('Caregiver Support');
                    else if (tab.id === 'tips') setSelectedCategory('Communication Tips');
                    else if (tab.id === 'resources') navigate('/economy');
                    else setSelectedCategory('All');
                  }}
                  className={`relative px-3.5 py-2 rounded-full transition-all cursor-pointer ${
                    isActive
                      ? 'text-[#143D30] dark:text-[#2DD4BF] font-bold'
                      : 'text-[#4A5954] dark:text-[#94A3B8] hover:text-[#192320] dark:hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#143D30] dark:bg-[#2DD4BF] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Header Controls: Theme, Language, Notifications, User Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Theme Toggle Pill */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-full bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] text-[#4A5954] dark:text-[#94A3B8] shadow-2xs hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
              aria-label="Toggle Theme"
            >
              {isDark ? <Moon className="w-3.5 h-3.5 text-[#2DD4BF]" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] text-xs font-medium text-[#192320] dark:text-[#CBD5E1] shadow-2xs hover:border-[#143D30] dark:hover:border-[#2DD4BF] transition-all cursor-pointer"
                aria-label="Select Language"
              >
                <Globe className="w-3.5 h-3.5 text-[#0D9488] dark:text-[#2DD4BF]" />
                <span className="hidden sm:inline">{currentLangObj.label.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-[#8C9B95]" />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-2xl shadow-xl py-1.5 z-50">
                  {regionalLanguages.map(l => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setLanguage(l.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition-colors cursor-pointer ${
                        language === l.code
                          ? 'bg-[#E8F1EC] dark:bg-[#0E2320] text-[#143D30] dark:text-[#4ADE80] font-bold'
                          : 'text-[#4A5954] dark:text-[#94A3B8] hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{l.flag}</span>
                        <span>{l.label}</span>
                      </span>
                      {language === l.code && <Check className="w-3.5 h-3.5 text-[#143D30] dark:text-[#4ADE80]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => setToastMessage('You have 2 new community replies.')}
              className="relative p-2 rounded-full bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] text-[#4A5954] dark:text-[#94A3B8] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shadow-2xs"
              aria-label="Community Notifications"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white dark:ring-[#0E1719]" />
            </button>

            {/* User Profile Badge (Saubhagya, Healthcare Professional) matching Reference Image */}
            <div className="flex items-center gap-2.5 pl-2 sm:border-l sm:border-[#ECE7DE] dark:sm:border-[#152225]">
              <img
                src={currentUser?.avatar || '/assets/images/clinician-doctor-avatar.jpg'}
                alt="Saubhagya"
                className="w-8 h-8 rounded-full object-cover border border-emerald-300 dark:border-emerald-600/50 shadow-2xs"
              />
              <div className="hidden lg:flex flex-col text-left leading-tight">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-[#192320] dark:text-white">
                    Hi, {currentUser?.name ? currentUser.name.split(' ')[0] : 'Saubhagya'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#8C9B95]" />
                </div>
                <span className="text-[10px] text-[#6E7D76] dark:text-[#7A938C]">
                  {currentUser?.role === 'caregiver' ? (t('auth.familyCaregiver') || 'Family Caregiver') : (t('auth.healthcareProfessional') || 'Healthcare Professional')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 bg-[#143D30] dark:bg-[#122C27] text-white text-xs px-4 py-2.5 rounded-xl shadow-lg border border-emerald-400/30 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-[#86EFAC]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl w-full mx-auto px-4 md:px-8 py-5 md:py-6 flex-1 space-y-5">
        {/* 2. COMMUNITY HERO BANNER WITH AUTHENTIC PHOTOGRAPHY & METRICS */}
        <section className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-[#ECE7DE] dark:border-[#18292D] bg-[#0E1E1A] min-h-[220px] md:min-h-[260px] shadow-sm flex items-stretch">
          {/* Authentic Warm Mother & Daughter Photograph Backdrop */}
          <img
            src="/assets/images/caregiver-hero.jpg"
            alt="SmritiCare caregiver and senior patient smiling together"
            className="absolute inset-0 w-full h-full object-cover object-[65%_center]"
          />

          {/* Dark Contrast Gradient Overlay for crystal clear readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#071310]/95 via-[#071310]/80 to-[#071310]/30 dark:from-[#050C0A]/98 dark:via-[#050C0A]/85 dark:to-[#050C0A]/40" />

          {/* Hero Content Overlay (Grid Split) */}
          <div className="relative z-10 w-full p-6 md:p-8 lg:p-9 flex flex-col justify-between">
            {/* Top Text Content */}
            <div className="max-w-xl">
              <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-serif font-bold text-white tracking-tight leading-tight">
                {t('community.heroHeading') || 'SmritiCare Global Community'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-200/90 mt-2 font-normal leading-relaxed">
                {t('community.heroSubtitle') || 'Connect with families and caregivers walking the same journey.'}
              </p>
              <div className="inline-block mt-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#86EFAC]/20 text-[#86EFAC] border border-[#86EFAC]/40 backdrop-blur-xs">
                  {t('community.youAreNotAlone') || 'You are not alone.'}
                </span>
              </div>
            </div>

            {/* Bottom Row: Metrics Badges + Pull Quote */}
            <div className="mt-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
              {/* 5 Live Community Metrics Badges */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs text-white">
                  <Users className="w-3.5 h-3.5 text-[#86EFAC]" />
                  <span className="font-bold">12.5K</span>
                  <span className="text-slate-300 text-[11px]">{t('community.membersCountStat') || 'Community Members'}</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs text-white">
                  <MessageCircle className="w-3.5 h-3.5 text-[#93C5FD]" />
                  <span className="font-bold">1.8K</span>
                  <span className="text-slate-300 text-[11px]">{t('community.discussionsStat') || 'Discussions'}</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs text-white">
                  <Globe className="w-3.5 h-3.5 text-[#FDE047]" />
                  <span className="font-bold">24</span>
                  <span className="text-slate-300 text-[11px]">{t('community.countriesStat') || 'Countries'}</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs text-white">
                  <Heart className="w-3.5 h-3.5 text-[#FCA5A5]" />
                  <span className="font-bold">5.0K</span>
                  <span className="text-slate-300 text-[11px]">{t('community.caregiversStat') || 'Caregivers'}</span>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#143D30]/80 backdrop-blur-md border border-emerald-400/30 text-xs text-[#86EFAC]">
                  <Leaf className="w-3.5 h-3.5" />
                  <span className="font-semibold text-[11px]">{t('community.strongerTogether') || 'Stronger Together'}</span>
                </div>
              </div>

              {/* Right Pull Quote matching Reference Image */}
              <div className="hidden lg:block text-right">
                <p className="font-serif italic text-sm text-white/95 drop-shadow-xs">
                  {t('community.realSupportQuote') || '“Real support creates brighter tomorrows.”'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. CATEGORY FILTERS ROW & SORT SELECTOR */}
        <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
          {/* Category Filter Pills (Horizontal scroll on mobile) */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
            {categoryFilters.map(cat => {
              const isActive = selectedCategory === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#143D30] text-white shadow-xs dark:bg-[#2DD4BF] dark:text-[#091113]'
                      : 'bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] text-[#4A5954] dark:text-[#94A3B8] hover:border-[#143D30]/40'
                  }`}
                >
                  {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-current' : 'text-[#8C9B95]'}`} />}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs text-[#6E7D76] dark:text-[#889B95] shrink-0">
            <span>{t('community.sortByLabel') || 'Sort by:'}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-full px-3 py-1 font-semibold text-[#192320] dark:text-white outline-none cursor-pointer"
            >
              <option value="latest">{t('community.sortLatest') || 'Latest'}</option>
              <option value="popular">{t('community.sortPopular') || 'Most Liked'}</option>
              <option value="discussions">{t('community.sortDiscussions') || 'Most Discussed'}</option>
            </select>
          </div>
        </section>

        {/* 4. TWO-COLUMN MAIN COMMUNITY LAYOUT (FEED + SIDEBAR WIDGETS) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: COMMUNITY FEED (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-3xl p-12 text-center space-y-3">
                <MessageCircle className="w-10 h-10 text-[#8C9B95] mx-auto" />
                <h3 className="font-bold text-base text-[#192320] dark:text-white">
                  {t('community.noDiscussionsFound') || 'No discussions found'}
                </h3>
                <p className="text-xs text-[#6E7D76] dark:text-[#889B95] max-w-sm mx-auto">
                  {t('community.noDiscussionsHint') || 'Try adjusting your search query or selecting a different category filter.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('All');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-[#143D30] dark:bg-[#2DD4BF] text-white dark:text-[#091113]"
                >
                  {t('community.resetFilters') || 'Reset Filters'}
                </button>
              </div>
            ) : (
              filteredPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  onOpenReport={(p) => setReportModalPost(p)}
                  onPostDeleted={(id) => setPostsList(prev => prev.filter(p => p.id !== id))}
                />
              ))
            )}
          </div>

          {/* RIGHT COLUMN: SIDEBAR WIDGETS (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* WIDGET 1: LARGE "+ START A CONVERSATION" BUTTON */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full py-3.5 px-5 rounded-2xl md:rounded-3xl bg-[#143D30] hover:bg-[#0E2D23] dark:bg-[#2DD4BF] dark:hover:bg-[#20b8a5] text-white dark:text-[#091113] font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>{t('community.startConversation') || 'Start a Conversation'}</span>
            </button>

            {/* WIDGET 2: SEARCH INPUT */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-[#8C9B95] dark:text-[#64748B] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={t('community.searchPlaceholder') || 'Search discussions, topics or people...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-[#0E1719] text-xs md:text-sm text-[#192320] dark:text-white placeholder-[#8C9B95] dark:placeholder-[#64748B] rounded-2xl md:rounded-3xl pl-10 pr-4 py-3 border border-[#ECE7DE] dark:border-[#18292D] focus:border-[#143D30] dark:focus:border-[#2DD4BF] outline-none transition-all shadow-2xs"
              />
            </div>

            {/* WIDGET 3: TRENDING TOPICS CARD matching Reference Image */}
            <div className="bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-2xl md:rounded-3xl p-5 shadow-2xs transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-[#ECE7DE] dark:border-[#18292D]">
                <h3 className="font-bold text-sm text-[#192320] dark:text-white">
                  {t('community.trendingHeading') || 'Trending Topics'}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className="text-xs font-semibold text-[#0D9488] dark:text-[#2DD4BF] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{t('community.viewAll') || 'View All'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="mt-3.5 space-y-2.5">
                {trendingTopics.map((topic, i) => {
                  const Icon = topic.icon;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSearchQuery(topic.title)}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer text-left group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#FAF8F5] dark:bg-[#121E22] border border-[#ECE7DE] dark:border-[#18292D] flex items-center justify-center text-[#143D30] dark:text-[#2DD4BF] shrink-0 group-hover:scale-105 transition-transform">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-medium text-[#192320] dark:text-slate-200 truncate group-hover:text-[#143D30] dark:group-hover:text-[#2DD4BF]">
                          {topic.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#8C9B95] dark:text-[#64748B] shrink-0 ml-2">
                        {topic.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* WIDGET 4: "OUR COMMUNITY" CARD matching Reference Image */}
            <div className="bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-2xl md:rounded-3xl p-5 shadow-2xs text-center transition-colors">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E7D76] dark:text-[#889B95] block mb-2">
                {t('community.ourCommunityHeading') || 'Our Community'}
              </span>

              {/* Diverse Caregiver Group Avatar Cluster */}
              <div className="flex items-center justify-center -space-x-2 my-3">
                <img src="/assets/images/clinician-doctor-avatar.jpg" alt="Doctor" className="w-10 h-10 rounded-full border-2 border-white dark:border-[#0E1719] object-cover" />
                <img src="/assets/images/caregiver-priya-avatar.jpg" alt="Caregiver" className="w-10 h-10 rounded-full border-2 border-white dark:border-[#0E1719] object-cover" />
                <img src="/assets/images/auth-patient.jpg" alt="Elder" className="w-10 h-10 rounded-full border-2 border-white dark:border-[#0E1719] object-cover" />
                <img src="/assets/images/patient-ramesh.jpg" alt="Member" className="w-10 h-10 rounded-full border-2 border-white dark:border-[#0E1719] object-cover" />
              </div>

              <h4 className="font-bold text-sm text-[#192320] dark:text-white leading-snug">
                {t('community.differentStories') || 'Different stories. Same strength.'}
              </h4>

              <button
                type="button"
                onClick={() => setToastMessage(t('community.alreadyMemberToast') || 'You are already an active member of SmritiCare Community!')}
                className="mt-3.5 w-full py-2 px-4 rounded-full text-xs font-semibold bg-[#143D30] hover:bg-[#0E2D23] dark:bg-[#2DD4BF] dark:text-[#091113] text-white transition-all cursor-pointer shadow-2xs"
              >
                {t('community.joinOurCommunity') || 'Join Our Community'}
              </button>
            </div>

            {/* WIDGET 5: INSPIRATIONAL BOTANICAL CARD */}
            <div className="bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-2xl md:rounded-3xl p-5 shadow-2xs flex items-center gap-3 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-[#E8F1EC] dark:bg-[#0E2320] text-[#143D30] dark:text-[#2DD4BF] flex items-center justify-center shrink-0 border border-[#D5E5DC] dark:border-[#163832]">
                <Leaf className="w-4 h-4" />
              </div>
              <p className="font-serif italic text-xs text-[#3A4742] dark:text-[#CBD5E1] leading-snug">
                {t('community.kinderTomorrowQuote') || '“A kinder tomorrow for every generation.”'}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 5. FOOTER */}
      <footer className="w-full border-t border-[#ECE7DE] dark:border-[#152225] py-4 px-4 md:px-8 mt-6 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6E7D76] dark:text-[#7A938C]">
          <div className="flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5 text-[#22C55E]" />
            <span className="font-semibold text-[#192320] dark:text-[#CBD5E1]">
              {t('common.footerTagline') || 'Healthier Minds. Happier Tomorrows.'}
            </span>
          </div>
          <span>{t('community.peerSupportCell') || 'SmritiCare Global Peer Support Cell • Empowering Every Memory'}</span>
        </div>
      </footer>

      {/* CREATE CONVERSATION MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECE7DE] dark:border-[#18292D]">
              <h3 className="font-serif font-bold text-lg text-[#192320] dark:text-white">
                {t('community.modalHeading') || 'Start a Conversation'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#3A4742] dark:text-slate-300 mb-1">
                  {t('community.modalCategoryLabel') || 'Category'}
                </label>
                <select
                  value={newPostCategory}
                  onChange={(e) => setNewPostCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#DCD6CA] dark:border-[#1E3339] bg-[#FAF8F5] dark:bg-[#121E22] text-xs text-[#192320] dark:text-white outline-none"
                >
                  <option value="Caregiver Support">{t('community.categories.caregiverSupport') || 'Caregiver Support'}</option>
                  <option value="Daily Life">{t('community.categories.dailyLife') || 'Daily Life'}</option>
                  <option value="Memory & Activities">{t('community.categories.memoryActivities') || 'Memory & Activities'}</option>
                  <option value="Communication Tips">{t('community.categories.communicationTips') || 'Communication Tips'}</option>
                  <option value="Emotional Support">{t('community.categories.emotionalSupport') || 'Emotional Support'}</option>
                  <option value="Family Support">{t('community.categories.familySupport') || 'Family Support'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3A4742] dark:text-slate-300 mb-1">
                  {t('community.modalTitleLabel') || 'Headline / Question'}
                </label>
                <input
                  type="text"
                  placeholder={t('community.modalTitlePlaceholder') || 'e.g. Tips for morning confusion...'}
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#DCD6CA] dark:border-[#1E3339] bg-[#FAF8F5] dark:bg-[#121E22] text-xs text-[#192320] dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3A4742] dark:text-slate-300 mb-1">
                  {t('community.modalContentLabel') || 'Your Story or Question'}
                </label>
                <textarea
                  rows={4}
                  placeholder={t('community.modalContentPlaceholder') || 'Share your experience or ask a question to fellow caregivers and healthcare workers...'}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#DCD6CA] dark:border-[#1E3339] bg-[#FAF8F5] dark:bg-[#121E22] text-xs text-[#192320] dark:text-white outline-none resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-[#4A5954] dark:text-[#94A3B8] hover:bg-black/5"
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!newPostContent.trim()}
                  className="px-5 py-2 rounded-full text-xs font-semibold bg-[#143D30] dark:bg-[#2DD4BF] text-white dark:text-[#091113] disabled:opacity-40 shadow-xs"
                >
                  {t('community.publishPost') || 'Publish Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {reportModalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-[#192320] dark:text-white">
              {t('community.reportTitle') || 'Report Community Discussion'}
            </h3>
            <p className="text-xs text-[#6E7D76] dark:text-[#889B95]">
              {t('community.reportNotice') || 'Thank you for keeping SmritiCare safe. Our clinical moderators review flagged content within 24 hours.'}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReportModalPost(null)}
                className="px-3.5 py-1.5 rounded-full text-xs text-[#4A5954] dark:text-slate-300"
              >
                {t('community.dismiss') || 'Dismiss'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setReportModalPost(null);
                  setToastMessage(t('community.reportSubmittedToast') || 'Report submitted to clinical moderators.');
                  setTimeout(() => setToastMessage(''), 3000);
                }}
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-rose-600 text-white"
              >
                {t('community.submitReport') || 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
