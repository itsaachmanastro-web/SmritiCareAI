import React, { useState } from 'react';
import { X, Send, Sparkles, ShieldCheck, Heart, Users } from 'lucide-react';
import ElderButton from '../common/ElderButton';
import { communityService } from '../../services/communityService';
import { playMatchSuccessSound } from '../../audio/synthAudio';

export default function CreatePostModal({
  isOpen,
  onClose,
  currentUser,
  communities = [],
  onPostCreated
}) {
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('Caregiver Support');
  const [postType, setPostType] = useState('experience');
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const topics = [
    'Caregiver Support',
    'Daily Life',
    'Memory & Activities',
    'Communication Tips',
    'Emotional Support',
    'Family Support',
    'Local Activities',
    'Technology & Dementia',
    'Questions & Answers',
    'Success Stories'
  ];

  const postTypes = [
    { id: 'experience', label: '📖 Story / Experience' },
    { id: 'question', label: '❓ Question to Community' },
    { id: 'encouragement', label: '☀️ Word of Encouragement' },
    { id: 'daily', label: '🍵 Daily Routine / Tip' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const selectedComm = communities.find((c) => c.id === selectedCommunityId);

      const newPost = await communityService.createPost({
        author_id: currentUser?.id ? `user-${currentUser.id}` : (currentUser?.user_id || 'user-guest'),
        author_name: currentUser?.name || currentUser?.display_name || 'Kind Caregiver',
        author_avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256',
        author_role: currentUser?.role === 'patient' ? 'Patient' : currentUser?.role === 'healthcare' ? 'Healthcare Professional' : 'Caregiver',
        author_location: currentUser?.location || 'Assam / North East',
        community_id: selectedCommunityId || null,
        community_name: selectedComm?.name || null,
        topic,
        post_type: postType,
        content: content.trim()
      });

      playMatchSuccessSound();
      setContent('');
      if (onPostCreated) onPostCreated(newPost);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131D33] rounded-3xl md:rounded-4xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-[#243352] max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#243352]">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-smriti-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-700/60">
              Safe Community Space
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white font-display mt-1">
              Start a Conversation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-5 space-y-4">
          {/* Post Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              What kind of conversation is this?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {postTypes.map((pt) => (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => setPostType(pt.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                    postType === pt.id
                      ? 'bg-smriti-teal-50 dark:bg-teal-950/60 border-smriti-teal-500 dark:border-teal-400 text-smriti-teal-900 dark:text-teal-200 shadow-xs'
                      : 'bg-slate-50 dark:bg-[#1E293B] border-slate-200 dark:border-[#243352] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#25334D]'
                  }`}
                >
                  {pt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Topic & Community Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Topic Category
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#2E4166] text-sm font-semibold bg-white dark:bg-[#162238] text-slate-900 dark:text-white focus:ring-2 focus:ring-smriti-teal-500"
              >
                {topics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Share to Group (Optional)
              </label>
              <select
                value={selectedCommunityId}
                onChange={(e) => setSelectedCommunityId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#2E4166] text-sm font-semibold bg-white dark:bg-[#162238] text-slate-900 dark:text-white focus:ring-2 focus:ring-smriti-teal-500"
              >
                <option value="">Global Community Feed (All Members)</option>
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Large Accessible Text Area */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Your Thoughts, Story, or Question
            </label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. Today we tried singing old songs together and it made our morning so much more peaceful... What helps your elder feel comforted?"
              className="w-full p-4 rounded-2xl border-2 border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white text-base md:text-lg font-medium focus:ring-2 focus:ring-smriti-teal-500"
              required
            />
          </div>

          {/* Strict Privacy Reassurance (Principle 23) */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200 font-semibold">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>
              Your private health records, medications, and cognitive test scores remain strictly protected on your device and are never shared.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#25334D] text-slate-700 dark:text-slate-200 font-bold text-base transition-colors border border-transparent dark:border-[#243352]"
            >
              Cancel
            </button>

            <ElderButton
              type="submit"
              variant="orange"
              size="md"
              icon={Send}
              disabled={isSubmitting || !content.trim()}
            >
              {isSubmitting ? 'Sharing...' : 'Share with Community'}
            </ElderButton>
          </div>
        </form>
      </div>
    </div>
  );
}
