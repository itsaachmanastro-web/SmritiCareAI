import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Bookmark,
  MoreVertical,
  Globe,
  ChevronDown,
  Send,
  Check,
  Sparkles,
  MapPin,
  Share2,
  Trash2,
  Calendar
} from 'lucide-react';
import { communityService } from '../../services/communityService';
import { useLanguage } from '../../context/LanguageContext';
import { playMatchSuccessSound, playCardFlipSound } from '../../audio/synthAudio';

// Multilingual translations for community feed posts
const POST_TRANSLATIONS = {
  // Saubhagya Post
  'post-101': {
    en: {
      title: 'Good morning!',
      content: 'How do you help patients who feel restless in the evening? Any simple activities that work well?'
    },
    hi: {
      title: 'शुभ प्रभात!',
      content: 'आप शाम के समय बेचैन महसूस करने वाले मरीजों की मदद कैसे करते हैं? क्या कोई सरल गतिविधियाँ हैं जो अच्छी तरह काम करती हैं?'
    },
    as: {
      title: 'শুভ ৰাতিপুৱা!',
      content: 'গধূলি সময়ত অস্থিৰ অনুভৱ কৰা ৰোগীক আপোনালোকে কেনেকৈ সহায় কৰে? এনে কোনো সৰল কাৰ্য্যকলাপ আছেনে যিয়ে ভাল ফল দিয়ে?'
    },
    bn: {
      title: 'সুপ্রভাত!',
      content: 'সন্ধ্যায় অস্থির বোধ করা রোগীদের আপনি কীভাবে সাহায্য করেন? এমন কোনো সহজ ক্রিয়াকলাপ আছে কি যা ভালো কাজ করে?'
    },
    mni: {
      title: 'অয়ুক্কী য়াইফ-পাউজেল!',
      content: 'নুমিদাংৱাইরমদা ৱাখল পেন্দবা অনাবশিংবু অদোমনা করম্না মতেং পাংবগে? চুনবা অমসুং লাইথোকহনবা থবক-থৌরমশিং লৈব্রা?'
    }
  },
  // Priya Borah Post
  'post-102': {
    en: {
      title: 'Today was a difficult morning...',
      content: 'My mother seemed more confused today. Looking for advice on how to keep her calm and engaged.'
    },
    hi: {
      title: 'आज की सुबह थोड़ी कठिन थी...',
      content: 'मेरी माँ आज थोड़ी अधिक भ्रमित लग रही थीं। उन्हें शांत और व्यस्त रखने के लिए कोई सलाह चाहिए।'
    },
    as: {
      title: 'আজি পুৱাটো অলপ কঠিন আছিল...',
      content: 'মোৰ মা আজি বেছি বিভ্ৰান্ত যেন লাগিছিল। তেওঁক শান্ত আৰু ব্যস্ত কৰি ৰখাৰ বাবে কিছু দিহা-পৰামৰ্শ বিচাৰিছোঁ।'
    },
    bn: {
      title: 'আজ সকালটা বেশ কঠিন ছিল...',
      content: 'আমার মা আজ কিছুটা বেশি বিভ্রান্ত ছিলেন। তাঁকে শান্ত এবং কাজে যুক্ত রাখার বিষয়ে পরামর্শ খুঁজছি।'
    },
    mni: {
      title: 'ঙসি অয়ুক অসি য়াম্না ৱাবা অমা ওইখি...',
      content: 'ঐগী ইমানা ঙসি খরা হেন্না ৱাখল হুন্না লৈখি। মহাকপু তন্থাহনবা অমসুং থবক্তা য়াওহনবগী পাউতাক দরকার ওইরি।'
    }
  },
  // Dr. Arun Phukan Post
  'post-103': {
    en: {
      title: 'Validation over correction',
      content: 'When our elders remember events from 30 years ago as if they happened today, validate their emotions instead of contradicting them. Meeting them in their reality creates trust and peace.'
    },
    hi: {
      title: 'सुधारने से बेहतर है भावनाओं को स्वीकारना',
      content: 'जब हमारे बुजुर्ग 30 साल पहले की घटनाओं को ऐसे याद करें जैसे वे आज हुई हों, तो उनका विरोध करने के बजाय उनकी भावनाओं को स्वीकार करें। उनकी वास्तविकता में उनसे मिलना विश्वास और शांति पैदा करता है।'
    },
    as: {
      title: 'সংশোধন কৰাতকৈ সঁহাৰি জনোৱা শ্ৰেষ্ঠ',
      content: 'যেতিয়া আমাৰ জ্যেষ্ঠসকলে ৩০ বছৰ পুৰণি ঘটনা আজি ঘটাৰ দৰে মনত পেলায়, তেতিয়া তেওঁলোকৰ কথা কাটি দিয়াৰ পৰিৱৰ্তে অনুভূতিক স্বীকৃতি দিয়ক। তেওঁলোকৰ বাস্তৱত অংশ ল’লে বিশ্বাস আৰু শান্তি জাগ্ৰত হয়।'
    },
    bn: {
      title: 'সংশোধন করার চেয়ে অনুভূতি স্বীকার করা শ্রেয়',
      content: 'আমাদের প্রবীণরা যখন ৩০ বছর আগের স্মৃতিকে আজকের মতো মনে করেন, তখন তাদের সাথে তর্ক না করে অনুভূতিকে প্রাধান্য দিন। তাদের মানসিক অবস্থাকে গ্রহণ করলেই আস্থা ও শান্তি তৈরি হয়।'
    },
    mni: {
      title: 'অশোইবা য়ারোই হায়বদগী মখোয়গী ৱাখলবু য়াবনা হেন্না ফৈ',
      content: 'ঐখোয়গী অহলশিংনা চহি ৩০গী মমাংগী থৌদোকপু ঙসি থোকখিবা গুম্না নিংশিংলকপা মতমদা, মখোয়গী ৱাখলবু কাওথোকহনবগী মহুৎ মখোয়গী ফাওবশিংবু য়াবিয়ু। মখোয়গী লৈরিবা ফিভমদা থম্নবনা থাজবা অমসুং শান্তি পুরকই।'
    }
  }
};

const LANGUAGE_LABELS = {
  en: 'English',
  hi: 'हिंदी (Hindi)',
  as: 'অসমীয়া (Assamese)',
  bn: 'বাংলা (Bengali)',
  mni: 'মণিপুরী (Manipuri)'
};

export default function PostCard({
  post,
  currentUser,
  onOpenReport,
  onPostDeleted
}) {
  const { language: currentAppLanguage, t } = useLanguage();
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Translation State: null = auto-follow global app language, 'original' = force original text, or explicit lang code
  const [translateMenuOpen, setTranslateMenuOpen] = useState(false);
  const [activeTranslationLang, setActiveTranslationLang] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  const currentUserId = currentUser?.id ? `user-${currentUser.id}` : (currentUser?.user_id || 'user-guest');
  const isAuthor = currentUserId === post.author_id || currentUser?.name === post.author_name;

  // Toggle Like
  const handleToggleLike = async () => {
    playCardFlipSound();
    setIsLiked(!isLiked);
    setLikesCount(prev => (isLiked ? Math.max(0, prev - 1) : prev + 1));
    await communityService.toggleReaction(post.id, currentUserId, 'heart');
  };

  // Toggle Bookmark
  const handleToggleSave = async () => {
    playMatchSuccessSound();
    const newSaved = !isSaved;
    setIsSaved(newSaved);
    await communityService.toggleSavePost(post.id, currentUserId);
  };

  // Toggle Comments Drawer
  const handleToggleComments = async () => {
    if (!showComments && comments.length === 0) {
      const list = await communityService.getComments(post.id);
      if (list && list.length > 0) setComments(list);
    }
    setShowComments(!showComments);
  };

  // Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const added = await communityService.addComment(post.id, currentUser, newComment.trim());
      setComments(prev => [...prev, added || {
        id: `c-${Date.now()}`,
        author_name: currentUser?.name || 'You',
        author_role: currentUser?.role || 'Member',
        content: newComment.trim(),
        created_at: new Date().toISOString()
      }]);
      setNewComment('');
      playMatchSuccessSound();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Select Translation
  const handleSelectLanguage = (langCode) => {
    setActiveTranslationLang(langCode);
    setTranslateMenuOpen(false);
  };

  // Determine effective translation language:
  // If activeTranslationLang === 'original', show original English.
  // If activeTranslationLang is specified (e.g. 'hi', 'as', 'bn', 'mni', 'en'), use that.
  // If activeTranslationLang === null, automatically follow global currentAppLanguage if not 'en'.
  const effectiveLang = activeTranslationLang !== null
    ? (activeTranslationLang === 'original' ? null : activeTranslationLang)
    : (currentAppLanguage !== 'en' ? currentAppLanguage : null);

  // Get displayed text based on translation state
  const postId = post.id;
  const translationEntry = POST_TRANSLATIONS[postId];
  let displayedTitle = post.title;
  let displayedContent = post.content;

  if (effectiveLang && translationEntry && translationEntry[effectiveLang]) {
    displayedTitle = translationEntry[effectiveLang].title || displayedTitle;
    displayedContent = translationEntry[effectiveLang].content || displayedContent;
  } else if (effectiveLang && effectiveLang !== 'en' && !translationEntry) {
    // Graceful indicator for custom community posts
    displayedContent = `[${LANGUAGE_LABELS[effectiveLang] || effectiveLang}] ${post.content}`;
  }

  // Author Role Badge styling
  const isClinician = post.author_role?.toLowerCase().includes('healthcare') || post.author_role?.toLowerCase().includes('professional');
  const isCaregiver = post.author_role?.toLowerCase().includes('caregiver');

  return (
    <article className="bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-2xs transition-colors hover:border-[#D5CDC1] dark:hover:border-[#223940]">
      {/* 1. POST HEADER: Author Avatar, Name, Role Badge, Location, Date & Translation Dropdown */}
      <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-[#ECE7DE]/60 dark:border-[#18292D]/60">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={post.author_avatar || '/assets/images/auth-patient.jpg'}
            alt={post.author_name}
            className="w-10 h-10 rounded-full object-cover border border-emerald-300 dark:border-emerald-600/40 shrink-0 shadow-2xs"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-[#192320] dark:text-white truncate">
                {post.author_name}
              </h3>
              {/* Role Badge */}
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                  isClinician
                    ? 'bg-[#E8F1EC] text-[#143D30] border border-[#D5E5DC] dark:bg-[#122C27] dark:text-[#4ADE80] dark:border-[#1E4D43]'
                    : isCaregiver
                    ? 'bg-[#FDF2ED] text-[#C86D51] border border-[#F6D5C9] dark:bg-[#2A1B16] dark:text-[#FCA5A5] dark:border-[#4B281F]'
                    : 'bg-[#E1EFFE] text-[#1E429F] border border-[#BCDAF9] dark:bg-[#0E2838] dark:text-[#60A5FA] dark:border-[#1B4360]'
                }`}
              >
                {post.author_role || 'Community Member'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#6E7D76] dark:text-[#889B95] mt-0.5">
              <span>{post.author_location || 'Assam, India'}</span>
              <span>&bull;</span>
              <span>{post.created_at ? new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Sep 15, 2024'}</span>
            </div>
          </div>
        </div>

        {/* Translation Dropdown & Options Menu */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Translate Button with Dropdown matching Reference Image */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setTranslateMenuOpen(!translateMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF8F5] dark:bg-[#121E22] border border-[#ECE7DE] dark:border-[#18292D] text-xs font-semibold text-[#143D30] dark:text-[#2DD4BF] hover:bg-[#E8F1EC] dark:hover:bg-[#1C3832] transition-all cursor-pointer shadow-2xs"
              aria-label="Translate post"
            >
              <span className="font-serif text-[11px]">文A</span>
              <span>{t('community.translate') || 'Translate'}</span>
              <ChevronDown className="w-3 h-3 text-[#8C9B95]" />
            </button>

            {translateMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-2xl shadow-xl py-1.5 z-40 animate-in fade-in slide-in-from-top-1">
                {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleSelectLanguage(code)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition-colors cursor-pointer ${
                      effectiveLang === code
                        ? 'bg-[#E8F1EC] dark:bg-[#0E2320] text-[#143D30] dark:text-[#4ADE80] font-bold'
                        : 'text-[#4A5954] dark:text-[#94A3B8] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>{label}</span>
                    {effectiveLang === code && (
                      <Check className="w-3.5 h-3.5 text-[#143D30] dark:text-[#4ADE80]" />
                    )}
                  </button>
                ))}
                <div className="border-t border-[#ECE7DE] dark:border-[#18292D] mt-1 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSelectLanguage('original')}
                    className="w-full px-3.5 py-2 text-xs text-left text-[#6E7D76] dark:text-[#889B95] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                  >
                    {t('community.viewOriginal') || 'View Original'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Three dots menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#8C9B95] dark:text-[#64748B] transition-colors cursor-pointer"
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-[#0E1719] border border-[#ECE7DE] dark:border-[#18292D] rounded-2xl shadow-xl py-1 z-40 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    handleToggleSave();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-black/5 dark:hover:bg-white/5 text-[#4A5954] dark:text-[#94A3B8]"
                >
                  {isSaved ? (t('community.saved') || 'Saved') : (t('community.save') || 'Save Discussion')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenReport) onOpenReport(post);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-black/5 dark:hover:bg-white/5 text-rose-600 dark:text-rose-400"
                >
                  {t('community.report') || 'Report Post'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. TRANSLATION INDICATOR BANNER (Appears when translated) */}
      {effectiveLang && (
        <div className="mt-3 flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#E8F1EC]/80 dark:bg-[#0E2320]/80 border border-[#D5E5DC] dark:border-[#163832] text-xs text-[#143D30] dark:text-[#2DD4BF]">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            <span>
              {t('community.translatedTo') || 'Translated to'} <strong>{LANGUAGE_LABELS[effectiveLang] || effectiveLang}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTranslationLang('original')}
            className="text-xs font-bold underline hover:opacity-80 cursor-pointer ml-2"
          >
            {t('community.viewOriginal') || 'View Original'}
          </button>
        </div>
      )}

      {/* 3. POST CONTENT BODY */}
      <div className="my-3.5 space-y-1.5">
        {displayedTitle && (
          <h4 className="font-bold text-base text-[#192320] dark:text-white leading-snug">
            {displayedTitle}
          </h4>
        )}
        <p className="text-xs sm:text-sm text-[#3A4742] dark:text-[#CBD5E1] leading-relaxed whitespace-pre-line">
          {displayedContent}
        </p>
      </div>

      {/* 4. POST ACTIONS BAR: Like, Comments, Save */}
      <div className="flex items-center justify-between pt-3 border-t border-[#ECE7DE]/60 dark:border-[#18292D]/60 text-xs text-[#6E7D76] dark:text-[#889B95]">
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Like Button */}
          <button
            type="button"
            onClick={handleToggleLike}
            className={`flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
              isLiked
                ? 'text-[#C2185B] dark:text-[#F48FB1]'
                : 'hover:text-[#192320] dark:hover:text-white'
            }`}
            aria-label="Like post"
          >
            <Heart
              className={`w-4 h-4 ${
                isLiked ? 'fill-[#C2185B] dark:fill-[#F48FB1] text-[#C2185B] dark:text-[#F48FB1]' : ''
              }`}
            />
            <span>{likesCount}</span>
          </button>

          {/* Comments Button */}
          <button
            type="button"
            onClick={handleToggleComments}
            className="flex items-center gap-1.5 font-medium hover:text-[#192320] dark:hover:text-white transition-colors cursor-pointer"
            aria-label="View comments"
          >
            <MessageCircle className="w-4 h-4" />
            <span>
              {comments.length || post.comments_count || 0} {t('community.comments') || 'Comments'}
            </span>
          </button>
        </div>

        {/* Save / Bookmark Button */}
        <button
          type="button"
          onClick={handleToggleSave}
          className={`flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
            isSaved
              ? 'text-[#143D30] dark:text-[#2DD4BF] font-semibold'
              : 'hover:text-[#192320] dark:hover:text-white'
          }`}
          aria-label="Bookmark post"
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          <span className="hidden sm:inline">
            {isSaved ? (t('community.saved') || 'Saved') : (t('community.save') || 'Save')}
          </span>
        </button>
      </div>

      {/* 5. EXPANDABLE COMMENTS DRAWER */}
      {showComments && (
        <div className="mt-4 pt-3.5 border-t border-[#ECE7DE] dark:border-[#18292D] space-y-3 animate-in fade-in duration-150">
          {/* Comment List */}
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {comments.map((c, i) => (
              <div key={c.id || i} className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#121E22] border border-[#ECE7DE]/70 dark:border-[#18292D] text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#192320] dark:text-white">
                    {c.author_name || 'Caregiver'}
                  </span>
                  <span className="text-[10px] text-[#8C9B95] dark:text-[#64748B]">
                    {c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Earlier today'}
                  </span>
                </div>
                <p className="text-[#3A4742] dark:text-[#CBD5E1]">
                  {c.content}
                </p>
              </div>
            ))}
          </div>

          {/* Add Comment Input Form */}
          <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t('community.replyPlaceholder') || 'Leave an encouraging reply...'}
              className="flex-1 bg-[#FAF8F5] dark:bg-[#121E22] text-xs text-[#192320] dark:text-white placeholder-[#8C9B95] dark:placeholder-[#64748B] rounded-full px-4 py-2 border border-[#DCD6CA] dark:border-[#1E3339] outline-none focus:border-[#143D30] dark:focus:border-[#2DD4BF]"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmittingComment}
              className="px-3.5 py-2 rounded-full bg-[#143D30] dark:bg-[#2DD4BF] text-white dark:text-[#091113] text-xs font-semibold disabled:opacity-40 transition-all cursor-pointer shrink-0"
            >
              {isSubmittingComment ? (t('community.replying') || 'Posting...') : (t('community.postReply') || 'Reply')}
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
