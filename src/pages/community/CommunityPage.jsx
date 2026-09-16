import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Globe,
  Filter,
  Plus,
  Heart,
  MessageCircle,
  UserPlus,
  ShieldCheck,
  Sparkles,
  MapPin,
  Lock,
  ArrowRight
} from 'lucide-react';
import CommunityHeader from '../../components/community/CommunityHeader';
import PostCard from '../../components/community/PostCard';
import CreatePostModal from '../../components/community/CreatePostModal';
import DirectMessagesModal from '../../components/community/DirectMessagesModal';
import PrivacySettingsModal from '../../components/community/PrivacySettingsModal';
import ModeratorModal from '../../components/community/ModeratorModal';
import AiCommunityAssistantModal from '../../components/community/AiCommunityAssistantModal';
import ElderButton from '../../components/common/ElderButton';

import { communityService } from '../../services/communityService';
import { subscribeCommunityEvents } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function CommunityPage() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('feed'); // 'feed', 'groups', 'people', 'messages'
  const [scopeFilter, setScopeFilter] = useState('all'); // 'all', 'global', 'country', 'regional'
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Data lists
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [people, setPeople] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isModeratorOpen, setIsModeratorOpen] = useState(false);
  const [activeChatRecipient, setActiveChatRecipient] = useState(null);
  const [aiHelperPost, setAiHelperPost] = useState(null);

  // Report Modal state
  const [reportingTarget, setReportingTarget] = useState(null); // { type, id, name }
  const [reportReason, setReportReason] = useState('Medical misinformation');
  const [reportDetails, setReportDetails] = useState('');

  const currentUserId = currentUser?.id ? `user-${currentUser.id}` : (currentUser?.user_id || 'user-guest');
  const isModerator = currentUser?.role === 'healthcare' || currentUser?.role === 'caregiver';

  useEffect(() => {
    loadAllCommunityData();

    // Subscribe to realtime cross-tab and cloud events
    const unsubscribe = subscribeCommunityEvents((event) => {
      if (event.type === 'POST_CREATED') {
        setPosts((prev) => [event.payload, ...prev.filter((p) => p.id !== event.payload.id)]);
      } else if (event.type === 'POST_DELETED') {
        setPosts((prev) => prev.filter((p) => p.id !== event.payload.postId));
      } else if (event.type === 'COMMUNITY_JOINED' || event.type === 'COMMUNITY_LEFT') {
        loadCommunities();
      }
    });

    return () => unsubscribe();
  }, [currentUserId]);

  const loadAllCommunityData = async () => {
    setIsLoading(true);
    await Promise.all([loadPosts(), loadCommunities(), loadPeople(), loadReports()]);
    setIsLoading(false);
  };

  const loadPosts = async () => {
    const list = await communityService.getPosts({
      topic: selectedTopic,
      searchQuery
    });
    setPosts(list);
  };

  const loadCommunities = async () => {
    const allComm = await communityService.getCommunities();
    setCommunities(allComm);
    const myComm = await communityService.getUserCommunities(currentUserId);
    setJoinedCommunities(myComm);
  };

  const loadPeople = async () => {
    const list = await communityService.getPeople({ query: searchQuery });
    setPeople(list);
  };

  const loadReports = async () => {
    const list = await communityService.getPendingReports();
    setPendingReports(list);
  };

  useEffect(() => {
    loadPosts();
  }, [selectedTopic, searchQuery]);

  const handleJoinLeave = async (commId) => {
    const isJoined = joinedCommunities.some((c) => c.id === commId);
    if (isJoined) {
      await communityService.leaveCommunity(commId, currentUserId);
    } else {
      await communityService.joinCommunity(commId, currentUserId);
    }
    await loadCommunities();
  };

  const handleOpenReport = (type, id, name) => {
    setReportingTarget({ type, id, name });
    setReportReason('Medical misinformation');
    setReportDetails('');
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportingTarget) return;

    await communityService.reportContent({
      reporterId: currentUserId,
      targetType: reportingTarget.type,
      targetId: reportingTarget.id,
      reason: reportReason,
      details: reportDetails
    });

    setReportingTarget(null);
    await loadReports();
    alert(t('community.reportThankYou'));
  };

  const handleBlockUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to block ${userName}? Their posts and messages will be hidden.`)) {
      await communityService.blockUser(currentUserId, userId);
      await loadAllCommunityData();
      setActiveChatRecipient(null);
    }
  };

  const topicsList = [
    'All',
    'Caregiver Support',
    'Daily Life',
    'Memory & Activities',
    'Communication Tips',
    'Emotional Support',
    'Family Support',
    'Local Activities',
    'Technology & Dementia'
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
      {/* Top Accessible Header */}
      <CommunityHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreatePost={() => setIsCreateOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenModerator={() => setIsModeratorOpen(true)}
        isModerator={isModerator}
        pendingReportsCount={pendingReports.length}
      />

      {/* Quick Action Navigation Grid (Principle 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => { setActiveTab('groups'); }}
          className="p-5 rounded-3xl bg-teal-50 dark:bg-teal-950/40 border-2 border-teal-200 dark:border-teal-800 hover:border-teal-400 dark:hover:border-teal-700 text-left transition-all shadow-xs flex items-center gap-4 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-smriti-teal-600 text-white flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
            👥
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight">{t('community.findCommunities')}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">{t('community.findCommunitiesSub')}</p>
          </div>
        </button>

        <button
          onClick={() => { setActiveTab('feed'); setIsCreateOpen(true); }}
          className="p-5 rounded-3xl bg-orange-50 dark:bg-orange-950/40 border-2 border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-700 text-left transition-all shadow-xs flex items-center gap-4 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
            💬
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight">{t('community.joinConversation')}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">{t('community.joinConversationSub')}</p>
          </div>
        </button>

        <button
          onClick={() => { setActiveTab('people'); }}
          className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-700 text-left transition-all shadow-xs flex items-center gap-4 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
            🌸
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight">{t('community.discoverPeople')}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">{t('community.discoverPeopleSub')}</p>
          </div>
        </button>
      </div>

      {/* Universal Search Bar (Principle 9) */}
      <div className="bg-white dark:bg-[#131D33] rounded-3xl p-4 border border-slate-200 dark:border-[#243352] shadow-sm mb-6 flex items-center gap-3 transition-colors duration-200">
        <Search className="w-5 h-5 text-slate-400 ml-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('community.searchPlaceholder')}
          className="flex-1 bg-transparent border-none text-base md:text-lg font-medium text-slate-800 dark:text-slate-100 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-3 py-1 rounded-lg"
          >
            {t('community.clearSearch')}
          </button>
        )}
      </div>

      {/* TAB 1: COMMUNITY FEED & DISCUSSIONS */}
      {activeTab === 'feed' && (
        <div className="space-y-6">
          {/* Topics Scroller */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {topicsList.map((topic) => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`px-4 py-2 rounded-2xl text-xs md:text-sm font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  selectedTopic === topic
                    ? 'bg-smriti-teal-600 text-white border-smriti-teal-700 shadow-sm'
                    : 'bg-white dark:bg-[#1E293B] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#243352] hover:bg-slate-100 dark:hover:bg-[#25334D]'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>

          {/* Posts List */}
          <div className="space-y-5">
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  onOpenReport={handleOpenReport}
                  onOpenAiHelper={(p) => setAiHelperPost(p)}
                  onPostDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                />
              ))
            ) : (
              <div className="bg-white dark:bg-[#131D33] rounded-3xl p-12 text-center border border-slate-200 dark:border-[#243352] text-slate-400">
                <Heart className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">{t('community.noConversationsFound')}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('community.firstToShare')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GROUPS & COMMUNITIES */}
      {activeTab === 'groups' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">
              {t('community.groupsHeading')}
            </h2>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-[#1E293B] px-3 py-1.5 rounded-full border border-slate-200 dark:border-[#243352]">
              {t('community.groupsActive', { count: communities.length })}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {communities.map((comm) => {
              const isJoined = joinedCommunities.some((c) => c.id === comm.id);
              return (
                <div
                  key={comm.id}
                  className="bg-white dark:bg-[#131D33] rounded-3xl p-6 border border-slate-200 dark:border-[#243352] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span className="text-3xl p-2.5 bg-slate-50 dark:bg-[#1E293B] rounded-2xl border border-slate-100 dark:border-[#243352]">
                        {comm.icon || '🌸'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#1E293B] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#243352] capitalize">
                          {comm.scope}
                        </span>
                        {comm.type === 'private' && (
                          <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 inline-flex items-center gap-1">
                            <Lock className="w-3 h-3" /> {t('community.privateGroup')}
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-snug">
                      {comm.name}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm font-medium mt-1.5 leading-relaxed">
                      {comm.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#243352] flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {t('community.membersCount', { count: comm.member_count })}
                    </span>

                    <button
                      onClick={() => handleJoinLeave(comm.id)}
                      className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                        isJoined
                          ? 'bg-slate-100 dark:bg-[#1E293B] hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#243352]'
                          : 'bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white shadow-xs'
                      }`}
                    >
                      {isJoined ? t('community.joinedCheck') : comm.type === 'private' ? t('community.requestAccess') : t('community.joinGroup')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: DISCOVER PEOPLE */}
      {activeTab === 'people' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                {t('community.peopleHeading')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {t('community.peopleSub')}
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full self-start">
              {t('community.broadRegionsNotice')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {people.map((person) => {
              const isMe = person.user_id === currentUserId;
              return (
                <div
                  key={person.user_id}
                  className="bg-white dark:bg-[#131D33] rounded-3xl p-6 border border-slate-200 dark:border-[#243352] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow text-center"
                >
                  <div>
                    <img
                      src={person.avatar}
                      alt={person.display_name}
                      className="w-20 h-20 rounded-full mx-auto object-cover border-3 border-smriti-teal-500 shadow-sm mb-3"
                    />

                    <h3 className="font-black text-slate-900 dark:text-white text-lg">
                      {person.display_name} {isMe && t('community.youBadge')}
                    </h3>
                    <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 mt-1">
                      {person.role_badge}
                    </span>

                    {person.show_broad_location && person.broad_location && (
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-smriti-orange-600" />
                        <span>{person.broad_location}</span>
                      </p>
                    )}

                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-2 line-clamp-2">
                      {person.bio || 'Compassionate member of the SmritiCare family.'}
                    </p>
                  </div>

                  {!isMe && (
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#243352] flex items-center justify-center gap-2">
                      <button
                        onClick={() => setActiveChatRecipient(person)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {t('community.messageButton')}
                      </button>
                      <button
                        onClick={() => {
                          communityService.sendConnectionRequest(currentUserId, person.user_id);
                          alert(t('community.connectionRequestSent', { name: person.display_name }));
                        }}
                        className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                        title={t('community.connectButton')}
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: PRIVATE MESSAGES */}
      {activeTab === 'messages' && (
        <div className="bg-white dark:bg-[#131D33] rounded-3xl p-8 border border-slate-200 dark:border-[#243352] shadow-sm text-center max-w-xl mx-auto space-y-4 transition-colors duration-200">
          <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-950 mx-auto flex items-center justify-center text-teal-700 dark:text-teal-300">
            <MessageCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {t('community.messagesHeading')}
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
            {t('community.messagesSub')}
          </p>
          <div className="pt-2 flex flex-col gap-2">
            {people.filter((p) => p.user_id !== currentUserId).slice(0, 3).map((p) => (
              <button
                key={p.user_id}
                onClick={() => setActiveChatRecipient(p)}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-teal-50/60 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <img src={p.avatar} alt={p.display_name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">{p.display_name}</h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{p.broad_location}</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        currentUser={currentUser}
        communities={communities}
        onPostCreated={(newPost) => setPosts((prev) => [newPost, ...prev])}
      />

      <PrivacySettingsModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        currentUser={currentUser}
        onProfileUpdated={loadPeople}
      />

      <DirectMessagesModal
        isOpen={Boolean(activeChatRecipient)}
        onClose={() => setActiveChatRecipient(null)}
        currentUser={currentUser}
        recipient={activeChatRecipient}
        onBlockUser={handleBlockUser}
        onReportUser={handleOpenReport}
      />

      <ModeratorModal
        isOpen={isModeratorOpen}
        onClose={() => setIsModeratorOpen(false)}
        onModerationComplete={loadAllCommunityData}
      />

      <AiCommunityAssistantModal
        isOpen={Boolean(aiHelperPost)}
        onClose={() => setAiHelperPost(null)}
        targetPost={aiHelperPost}
        onInsertReply={(replyText) => {
          setIsCreateOpen(true);
        }}
      />

      {/* Content Reporting Modal (Principle 14) */}
      {reportingTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131D33] rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-[#243352] space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('community.reportTitle')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('community.reportTarget', { name: reportingTarget.name, type: reportingTarget.type })}
            </p>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                {t('community.reportReason')}
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-[#2E4166] text-sm font-semibold bg-white dark:bg-[#162238] text-slate-900 dark:text-white"
              >
                <option value="Medical misinformation">Medical misinformation</option>
                <option value="Dangerous advice">Dangerous advice</option>
                <option value="Harassment">Harassment</option>
                <option value="Spam">Spam</option>
                <option value="Scam">Scam</option>
                <option value="Inappropriate content">Inappropriate content</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                {t('community.reportDetails')}
              </label>
              <textarea
                rows={3}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder={t('community.reportPlaceholder')}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReportingTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#25334D] text-slate-700 dark:text-slate-200 text-sm font-bold transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold"
              >
                {t('community.submitReport')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
