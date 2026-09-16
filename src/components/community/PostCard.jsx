import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageSquare, Bookmark, Flag, Trash2, Globe, Sparkles, Send, Check, ShieldAlert, Share2 } from 'lucide-react';
import { communityService } from '../../services/communityService';
import { playMatchSuccessSound, playCardFlipSound } from '../../audio/synthAudio';

export default function PostCard({
  post,
  currentUser,
  onOpenReport,
  onOpenAiHelper,
  onPostDeleted
}) {
  const [reactions, setReactions] = useState(post.reactions || {});
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedText, setTranslatedText] = useState('');

  const currentUserId = currentUser?.id ? `user-${currentUser.id}` : (currentUser?.user_id || 'user-guest');
  const isAuthor = currentUserId === post.author_id || currentUser?.name === post.author_name;

  // Check initial saved status
  React.useEffect(() => {
    communityService.isPostSaved(post.id).then(setIsSaved);
  }, [post.id]);

  const handleToggleReaction = async (reactionType) => {
    playCardFlipSound();
    const updatedPost = await communityService.toggleReaction(post.id, currentUserId, reactionType);
    if (updatedPost) {
      setReactions({ ...updatedPost.reactions });
      setLikesCount(updatedPost.likes_count);
    }
  };

  const handleToggleSave = async () => {
    const saved = await communityService.toggleSavePost(post.id, currentUserId);
    setIsSaved(saved);
  };

  const handleToggleComments = async () => {
    if (!showComments) {
      const list = await communityService.getComments(post.id);
      setComments(list);
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const added = await communityService.addComment(post.id, currentUser, newComment.trim());
      setComments((prev) => [...prev, added]);
      setNewComment('');
      playMatchSuccessSound();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (window.confirm('Are you sure you want to remove this conversation?')) {
      await communityService.deletePost(post.id);
      if (onPostDeleted) onPostDeleted(post.id);
    }
  };

  const handleTranslate = () => {
    if (isTranslated) {
      setIsTranslated(false);
    } else {
      // Gentle mock translation
      if (post.content.includes('क्या आपके परिवार')) {
        setTranslatedText('English Translation: "Do elders in your family feel peaceful listening to old devotional songs? We listen to old bhajans for 30 minutes every evening and it has noticeably reduced sundowning restlessness. What evening activities do you all do?"');
      } else {
        setTranslatedText(`हिंदी अनुवाद: "${post.content}" (सहानुभूतिपूर्ण समुदाय साझाकरण)`);
      }
      setIsTranslated(true);
    }
  };

  const hasHearted = (reactions.heart || []).includes(currentUserId);
  const hasHugged = (reactions.hug || []).includes(currentUserId);
  const hasSmiled = (reactions.smile || []).includes(currentUserId);
  const hasLightbulb = (reactions.lightbulb || []).includes(currentUserId);

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'patient':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800';
      case 'caregiver':
      case 'family caregiver':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800';
      case 'healthcare professional':
        return 'bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 border-teal-300 dark:border-teal-800';
      case 'volunteer':
        return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border-indigo-300 dark:border-indigo-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#131D33] rounded-3xl p-6 md:p-7 border border-slate-200 dark:border-[#243352] shadow-healthcare hover:shadow-healthcare-hover transition-all"
    >
      {/* Post Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#243352]">
        <div className="flex items-center gap-3.5">
          <img
            src={post.author_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'}
            alt={post.author_name}
            className="w-13 h-13 md:w-14 md:h-14 rounded-full object-cover border-2 border-smriti-teal-500 shadow-xs"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base md:text-lg">
                {post.author_name}
              </h3>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getRoleBadgeColor(post.author_role)}`}>
                {post.author_role}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {post.author_location && (
                <>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">📍 {post.author_location}</span>
                  <span>&bull;</span>
                </>
              )}
              <span>{new Date(post.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
              {post.community_name && (
                <>
                  <span>&bull;</span>
                  <span className="text-smriti-teal-700 dark:text-teal-400 font-bold">{post.community_name}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Safety & Action Icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onOpenAiHelper(post)}
            className="p-2 rounded-xl text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition-colors cursor-pointer"
            title="Ask SmritiCare: Summarize, explain simply, or draft a response"
          >
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </button>

          <button
            onClick={handleToggleSave}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isSaved ? 'text-smriti-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/80' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            title={isSaved ? 'Saved to Bookmarks' : 'Bookmark this post'}
          >
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-smriti-teal-600 dark:fill-teal-400' : ''}`} />
          </button>

          <button
            onClick={() => onOpenReport('post', post.id, post.author_name)}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
            title="Report this post for moderation"
          >
            <Flag className="w-5 h-5" />
          </button>

          {isAuthor && (
            <button
              onClick={handleDeletePost}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
              title="Delete my post"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Post Topic Tag */}
      <div className="pt-3 pb-2 flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-smriti-teal-700 dark:text-teal-300 bg-teal-50/80 dark:bg-teal-950/80 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800">
          🏷️ {post.topic}
        </span>
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 capitalize">
          &bull; {post.post_type}
        </span>
      </div>

      {/* Post Content */}
      <div className="py-2">
        <p className="text-base md:text-xl text-slate-800 dark:text-slate-200 font-medium leading-relaxed select-text">
          {isTranslated ? translatedText : post.content}
        </p>

        {/* Translation Toggle */}
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={handleTranslate}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-smriti-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{isTranslated ? 'Show Original Language' : 'Translate to English / Hindi'}</span>
          </button>
        </div>
      </div>

      {/* Tactile Reaction & Interaction Buttons */}
      <div className="pt-4 mt-2 border-t border-slate-100 dark:border-[#243352] flex flex-wrap items-center justify-between gap-3">
        {/* Supportive Reactions Pill Array */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Heart */}
          <button
            onClick={() => handleToggleReaction('heart')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border transition-all cursor-pointer ${
              hasHearted
                ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 shadow-xs'
                : 'bg-slate-50 dark:bg-[#1E293B] hover:bg-slate-100 dark:hover:bg-[#25334D] border-slate-200 dark:border-[#243352] text-slate-600 dark:text-slate-300'
            }`}
          >
            <span className="text-base">❤️</span>
            <span>{(reactions.heart || []).length}</span>
          </button>

          {/* Warm Hug */}
          <button
            onClick={() => handleToggleReaction('hug')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border transition-all cursor-pointer ${
              hasHugged
                ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 shadow-xs'
                : 'bg-slate-50 dark:bg-[#1E293B] hover:bg-slate-100 dark:hover:bg-[#25334D] border-slate-200 dark:border-[#243352] text-slate-600 dark:text-slate-300'
            }`}
          >
            <span className="text-base">🤗</span>
            <span className="text-xs">Support</span>
            <span>{(reactions.hug || []).length > 0 ? `(${(reactions.hug || []).length})` : ''}</span>
          </button>

          {/* Smile */}
          <button
            onClick={() => handleToggleReaction('smile')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border transition-all cursor-pointer ${
              hasSmiled
                ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'bg-slate-50 dark:bg-[#1E293B] hover:bg-slate-100 dark:hover:bg-[#25334D] border-slate-200 dark:border-[#243352] text-slate-600 dark:text-slate-300'
            }`}
          >
            <span className="text-base">😊</span>
            <span>{(reactions.smile || []).length > 0 ? (reactions.smile || []).length : ''}</span>
          </button>

          {/* Helpful */}
          <button
            onClick={() => handleToggleReaction('lightbulb')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border transition-all cursor-pointer ${
              hasLightbulb
                ? 'bg-yellow-50 dark:bg-yellow-950/70 border-yellow-300 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 shadow-xs'
                : 'bg-slate-50 dark:bg-[#1E293B] hover:bg-slate-100 dark:hover:bg-[#25334D] border-slate-200 dark:border-[#243352] text-slate-600 dark:text-slate-300'
            }`}
          >
            <span className="text-base">💡</span>
            <span className="text-xs">Helpful</span>
          </button>
        </div>

        {/* Comments Accordion Trigger */}
        <button
          onClick={handleToggleComments}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#25334D] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#243352] font-bold text-sm transition-colors cursor-pointer"
        >
          <MessageSquare className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span>{post.comments_count || comments.length} Responses</span>
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="pt-4 mt-4 border-t border-slate-100 dark:border-[#243352] space-y-4 overflow-hidden"
          >
            {/* Add Comment Box */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share a gentle, compassionate response..."
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 dark:border-[#2E4166] bg-white dark:bg-[#162238] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium focus:ring-2 focus:ring-smriti-teal-500"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !newComment.trim()}
                className="bg-smriti-teal-600 hover:bg-smriti-teal-700 text-white font-bold px-5 py-3 rounded-2xl inline-flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <Send className="w-4 h-4" />
                Reply
              </button>
            </form>

            {/* Comments List */}
            <div className="space-y-3 pt-2">
              {comments.map((c) => (
                <div key={c.id} className="p-3.5 bg-slate-50 dark:bg-[#1E293B] rounded-2xl border border-slate-200/80 dark:border-[#243352] text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 dark:text-white">{c.author_name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-[#25334D] border border-slate-200 dark:border-[#243352] text-slate-600 dark:text-slate-300">
                        {c.author_role}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    {c.content}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
