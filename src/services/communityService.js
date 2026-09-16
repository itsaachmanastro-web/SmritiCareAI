import { supabase, isSupabaseConfigured, emitCommunityEvent, subscribeCommunityEvents } from './supabaseClient';

const STORAGE_KEY = 'smriti_cloud_community_store';

// Default Seed Communities / Groups
const DEFAULT_COMMUNITIES = [
  {
    id: 'comm-1',
    name: 'Dementia Caregivers Worldwide',
    slug: 'caregivers-worldwide',
    description: 'A global sanctuary for family and professional caregivers sharing daily strength, tips, and compassionate care routines.',
    type: 'public',
    category: 'Caregiver Support',
    scope: 'global',
    country: 'Global',
    icon: '🌍',
    member_count: 1420
  },
  {
    id: 'comm-2',
    name: 'Caregivers in India',
    slug: 'caregivers-india',
    description: 'Connecting Indian families navigating elder dementia care, AYUSH home support, and local caregiver experiences.',
    type: 'public',
    category: 'Family Support',
    scope: 'country',
    country: 'India',
    icon: '🇮🇳',
    member_count: 860
  },
  {
    id: 'comm-3',
    name: 'North East Elders & Families',
    slug: 'ne-elders',
    description: 'Regional community for Assam and North Eastern families, sharing Bihu memories, tea garden strolls, and indigenous care traditions.',
    type: 'public',
    category: 'Local Activities',
    scope: 'region',
    region: 'Assam / North East',
    country: 'India',
    icon: '🌸',
    member_count: 320
  },
  {
    id: 'comm-4',
    name: 'Memory-Friendly Activities & Arts',
    slug: 'memory-activities',
    description: 'Creative daily ideas: traditional songs, gentle handicrafts, flower gardening, and cultural games that spark joyous memories.',
    type: 'public',
    category: 'Memory & Activities',
    scope: 'global',
    icon: '🎨',
    member_count: 590
  },
  {
    id: 'comm-5',
    name: 'हिंदी भाषी परिवार (Hindi Speaking Community)',
    slug: 'hindi-community',
    description: 'हिंदी में विचार, अनुभव, और बुजुर्गों की सेवा से जुड़े प्रश्न और सहायता साझा करने का सुरक्षित मंच।',
    type: 'public',
    category: 'Family Support',
    scope: 'language',
    language: 'hi',
    icon: '💬',
    member_count: 480
  },
  {
    id: 'comm-6',
    name: 'Early Stage MCI Peer Circle',
    slug: 'mci-peer-circle',
    description: 'A gentle, private peer circle for elders experiencing early memory changes to connect with dignified mutual encouragement.',
    type: 'private',
    category: 'Emotional Support',
    scope: 'global',
    icon: '🛡️',
    member_count: 115
  }
];

// Seed Sample Community Profiles (Zero sensitive medical info!)
const DEFAULT_PROFILES = [
  {
    user_id: 'user-amma',
    display_name: 'Bimala Borah (Amma)',
    role_badge: 'Patient',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256',
    bio: 'Loves morning tea in Jorhat, Assamese Bihu songs, and quiet walks in the garden.',
    broad_location: 'Assam / North East',
    language: 'as',
    visibility: 'public',
    local_discovery_enabled: true,
    show_broad_location: true,
    allow_messages_from: 'connections_only',
    show_online_status: true,
    is_moderator: false
  },
  {
    user_id: 'user-priya',
    display_name: 'Priya Borah',
    role_badge: 'Caregiver',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
    bio: 'Daughter caring for my lovely mother in Assam. Passionate about gentle routine structure and digital accessibility.',
    broad_location: 'Assam / North East',
    language: 'en',
    visibility: 'public',
    local_discovery_enabled: true,
    show_broad_location: true,
    allow_messages_from: 'everyone',
    show_online_status: true,
    is_moderator: true
  },
  {
    user_id: 'user-arun',
    display_name: 'Dr. Arun Phukan',
    role_badge: 'Healthcare Professional',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=256',
    bio: 'Primary Health Center (PHC) Medical Officer. Supporting community awareness and early cognitive screenings.',
    broad_location: 'Assam / North East',
    language: 'en',
    visibility: 'public',
    local_discovery_enabled: true,
    show_broad_location: true,
    allow_messages_from: 'everyone',
    show_online_status: true,
    is_moderator: true
  },
  {
    user_id: 'user-sunita',
    display_name: 'Sunita Sharma',
    role_badge: 'Caregiver',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=256',
    bio: 'Caring for my father-in-law in Delhi. Believer in music therapy and daily patience.',
    broad_location: 'Delhi NCR',
    language: 'hi',
    visibility: 'public',
    local_discovery_enabled: true,
    show_broad_location: true,
    allow_messages_from: 'everyone',
    show_online_status: false,
    is_moderator: false
  },
  {
    user_id: 'user-david',
    display_name: 'David MacLeod',
    role_badge: 'Family Member',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
    bio: 'Family supporter based in Edinburgh. Learning from global caregivers how to support elders with dignified independence.',
    broad_location: 'United Kingdom',
    language: 'en',
    visibility: 'public',
    local_discovery_enabled: true,
    show_broad_location: true,
    allow_messages_from: 'everyone',
    show_online_status: true,
    is_moderator: false
  }
];

// Seed Sample Posts
const DEFAULT_POSTS = [
  {
    id: 'post-1',
    author_id: 'user-priya',
    author_name: 'Priya Borah',
    author_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
    author_role: 'Caregiver',
    author_location: 'Assam / North East',
    community_id: 'comm-1',
    community_name: 'Dementia Caregivers Worldwide',
    topic: 'Daily Life',
    post_type: 'experience',
    content: 'Today was a difficult morning with wandering restlessness, but taking a quiet walk together along the tea garden path helped Amma feel calm and grounded again. Sometimes stepping outside into fresh air is the gentlest medicine.',
    likes_count: 24,
    comments_count: 5,
    created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    reactions: { heart: ['user-sunita', 'user-david'], hug: ['user-arun', 'user-amma'] }
  },
  {
    id: 'post-2',
    author_id: 'user-sunita',
    author_name: 'Sunita Sharma',
    author_avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=256',
    author_role: 'Caregiver',
    author_location: 'Delhi NCR',
    community_id: 'comm-5',
    community_name: 'हिंदी भाषी परिवार (Hindi Speaking Community)',
    topic: 'Memory & Activities',
    post_type: 'question',
    content: 'क्या आपके परिवार के बुजुर्ग पुराने भक्ति गीत सुनकर शांति महसूस करते हैं? हम रोज़ शाम 30 मिनट पुराने भजन सुनते हैं और इससे उनकी शाम की बेचैनी (Sundowning) बहुत कम हो गई है। आप सब शाम के समय क्या गतिविधियां करते हैं?',
    likes_count: 18,
    comments_count: 3,
    created_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    reactions: { heart: ['user-priya'], lightbulb: ['user-david'] }
  },
  {
    id: 'post-3',
    author_id: 'user-arun',
    author_name: 'Dr. Arun Phukan',
    author_avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=256',
    author_role: 'Healthcare Professional',
    author_location: 'Assam / North East',
    community_id: 'comm-3',
    community_name: 'North East Elders & Families',
    topic: 'Communication Tips',
    post_type: 'encouragement',
    content: 'Gentle reminder to all family members: when your elder repeats the same question multiple times, remember they are asking for emotional safety, not just information. Respond with warmth in your tone rather than correcting facts.',
    likes_count: 42,
    comments_count: 7,
    created_at: new Date(Date.now() - 3600 * 1000 * 28).toISOString(),
    reactions: { heart: ['user-amma', 'user-priya', 'user-sunita'], hug: ['user-david'] }
  }
];

const DEFAULT_COMMENTS = [
  {
    id: 'comment-1',
    post_id: 'post-1',
    author_id: 'user-david',
    author_name: 'David MacLeod',
    author_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
    author_role: 'Family Member',
    content: 'Thank you for sharing this, Priya. Nature and fresh air have the exact same soothing effect for my father here in Scotland.',
    created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString()
  },
  {
    id: 'comment-2',
    post_id: 'post-1',
    author_id: 'user-amma',
    author_name: 'Bimala Borah (Amma)',
    author_avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256',
    author_role: 'Patient',
    content: 'The green tea leaves and cool breeze were so lovely today. 🌸',
    created_at: new Date(Date.now() - 3600 * 1000 * 1).toISOString()
  }
];

// Helper to get or initialize local cloud store
function getStore() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = {
      communities: DEFAULT_COMMUNITIES,
      profiles: DEFAULT_PROFILES,
      posts: DEFAULT_POSTS,
      comments: DEFAULT_COMMENTS,
      memberships: [
        { community_id: 'comm-1', user_id: 'user-priya' },
        { community_id: 'comm-3', user_id: 'user-priya' },
        { community_id: 'comm-1', user_id: 'user-amma' },
        { community_id: 'comm-3', user_id: 'user-amma' }
      ],
      connections: [
        { requester_id: 'user-priya', recipient_id: 'user-sunita', status: 'accepted' },
        { requester_id: 'user-amma', recipient_id: 'user-priya', status: 'accepted' }
      ],
      messages: [
        {
          id: 'msg-1',
          thread_id: 'thread-priya-sunita',
          sender_id: 'user-sunita',
          sender_name: 'Sunita Sharma',
          recipient_id: 'user-priya',
          content: 'Hi Priya, I loved your post about walking in the tea garden. How do you manage routine when it rains?',
          created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString()
        },
        {
          id: 'msg-2',
          thread_id: 'thread-priya-sunita',
          sender_id: 'user-priya',
          sender_name: 'Priya Borah',
          recipient_id: 'user-sunita',
          content: 'Hello Sunita! On rainy days we sit on the veranda listening to Bihu songs and folding Gamosa towels together. Tactile hand work helps keep restlessness away.',
          created_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString()
        }
      ],
      reports: [],
      saved_posts: ['post-3'],
      user_blocks: []
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(raw);
}

function saveStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

// ==============================================================================
// PUBLIC COMMUNITY SERVICE API
// ==============================================================================

export const communityService = {
  // 1. PROFILES
  async getProfile(userId) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('community_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase profile fetch fallback:', err);
      }
    }
    const store = getStore();
    return store.profiles.find((p) => p.user_id === userId) || {
      user_id: userId,
      display_name: 'Community Member',
      role_badge: 'Community Member',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
      broad_location: 'Central India',
      language: 'en',
      visibility: 'public',
      local_discovery_enabled: true,
      show_broad_location: true,
      allow_messages_from: 'everyone',
      show_online_status: true,
      is_moderator: false
    };
  },

  async updateProfile(profile) {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('community_profiles')
          .upsert(profile, { onConflict: 'user_id' });
      } catch (err) {
        console.warn('Supabase profile update fallback:', err);
      }
    }
    const store = getStore();
    const idx = store.profiles.findIndex((p) => p.user_id === profile.user_id);
    if (idx >= 0) {
      store.profiles[idx] = { ...store.profiles[idx], ...profile, updated_at: new Date().toISOString() };
    } else {
      store.profiles.push({ ...profile, created_at: new Date().toISOString() });
    }
    saveStore(store);
    emitCommunityEvent('PROFILE_UPDATED', profile);
    return profile;
  },

  // 2. COMMUNITIES & GROUPS
  async getCommunities() {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('communities').select('*');
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn('Supabase communities fallback:', e);
      }
    }
    const store = getStore();
    return store.communities;
  },

  async joinCommunity(communityId, userId) {
    const store = getStore();
    const exists = store.memberships.some((m) => m.community_id === communityId && m.user_id === userId);
    if (!exists) {
      store.memberships.push({ community_id: communityId, user_id: userId });
      const comm = store.communities.find((c) => c.id === communityId);
      if (comm) comm.member_count = (comm.member_count || 0) + 1;
      saveStore(store);
      emitCommunityEvent('COMMUNITY_JOINED', { communityId, userId });
    }
    return true;
  },

  async leaveCommunity(communityId, userId) {
    const store = getStore();
    store.memberships = store.memberships.filter((m) => !(m.community_id === communityId && m.user_id === userId));
    const comm = store.communities.find((c) => c.id === communityId);
    if (comm && comm.member_count > 1) comm.member_count -= 1;
    saveStore(store);
    emitCommunityEvent('COMMUNITY_LEFT', { communityId, userId });
    return true;
  },

  async getUserCommunities(userId) {
    const store = getStore();
    const joinedIds = store.memberships.filter((m) => m.user_id === userId).map((m) => m.community_id);
    return store.communities.filter((c) => joinedIds.includes(c.id));
  },

  // 3. POSTS & FEED
  async getPosts({ scope = 'all', topic = null, communityId = null, searchQuery = '' } = {}) {
    if (isSupabaseConfigured() && supabase) {
      try {
        let q = supabase.from('posts').select('*').eq('is_removed', false).order('created_at', { ascending: false });
        if (communityId) q = q.eq('community_id', communityId);
        if (topic && topic !== 'All') q = q.eq('topic', topic);
        const { data, error } = await q;
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn('Supabase posts fallback:', e);
      }
    }

    const store = getStore();
    let posts = [...store.posts];

    // Filter out posts from blocked users
    const blockedIds = store.user_blocks.map((b) => b.blocked_user_id);
    posts = posts.filter((p) => !blockedIds.includes(p.author_id) && !p.is_removed);

    if (communityId) {
      posts = posts.filter((p) => p.community_id === communityId);
    }
    if (topic && topic !== 'All') {
      posts = posts.filter((p) => p.topic === topic);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      posts = posts.filter((p) =>
        p.content.toLowerCase().includes(q) ||
        p.author_name.toLowerCase().includes(q) ||
        (p.community_name && p.community_name.toLowerCase().includes(q))
      );
    }

    return posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async createPost(postData) {
    const newPost = {
      id: `post-${Date.now()}`,
      author_id: postData.author_id,
      author_name: postData.author_name,
      author_avatar: postData.author_avatar,
      author_role: postData.author_role || 'Caregiver',
      author_location: postData.author_location || 'Central India',
      community_id: postData.community_id || null,
      community_name: postData.community_name || null,
      topic: postData.topic || 'Caregiver Support',
      post_type: postData.post_type || 'experience',
      content: postData.content,
      likes_count: 0,
      comments_count: 0,
      reactions: {},
      is_removed: false,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('posts').insert(newPost);
      } catch (err) {
        console.warn('Supabase insert fallback:', err);
      }
    }

    const store = getStore();
    store.posts.unshift(newPost);
    saveStore(store);

    emitCommunityEvent('POST_CREATED', newPost);
    return newPost;
  },

  async deletePost(postId) {
    const store = getStore();
    store.posts = store.posts.filter((p) => p.id !== postId);
    store.comments = store.comments.filter((c) => c.post_id !== postId);
    saveStore(store);
    emitCommunityEvent('POST_DELETED', { postId });
    return true;
  },

  async toggleReaction(postId, userId, reactionType = 'heart') {
    const store = getStore();
    const post = store.posts.find((p) => p.id === postId);
    if (!post) return null;

    if (!post.reactions) post.reactions = {};
    if (!post.reactions[reactionType]) post.reactions[reactionType] = [];

    const existingIdx = post.reactions[reactionType].indexOf(userId);
    if (existingIdx >= 0) {
      post.reactions[reactionType].splice(existingIdx, 1);
      post.likes_count = Math.max(0, (post.likes_count || 1) - 1);
    } else {
      post.reactions[reactionType].push(userId);
      post.likes_count = (post.likes_count || 0) + 1;
    }

    saveStore(store);
    emitCommunityEvent('REACTION_UPDATED', { postId, reactions: post.reactions, likes_count: post.likes_count });
    return post;
  },

  // 4. COMMENTS
  async getComments(postId) {
    const store = getStore();
    return store.comments
      .filter((c) => c.post_id === postId && !c.is_removed)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  },

  async addComment(postId, author, content) {
    const newComment = {
      id: `comment-${Date.now()}`,
      post_id: postId,
      author_id: author.id || author.user_id,
      author_name: author.name || author.display_name,
      author_avatar: author.avatar,
      author_role: author.role_badge || author.role || 'Caregiver',
      content,
      created_at: new Date().toISOString()
    };

    const store = getStore();
    store.comments.push(newComment);

    const post = store.posts.find((p) => p.id === postId);
    if (post) {
      post.comments_count = (post.comments_count || 0) + 1;
    }

    saveStore(store);
    emitCommunityEvent('COMMENT_ADDED', newComment);
    return newComment;
  },

  // 5. SAVED / BOOKMARKS
  async toggleSavePost(postId, userId) {
    const store = getStore();
    if (!store.saved_posts) store.saved_posts = [];
    const idx = store.saved_posts.indexOf(postId);
    let saved = false;
    if (idx >= 0) {
      store.saved_posts.splice(idx, 1);
      saved = false;
    } else {
      store.saved_posts.push(postId);
      saved = true;
    }
    saveStore(store);
    return saved;
  },

  async isPostSaved(postId) {
    const store = getStore();
    return (store.saved_posts || []).includes(postId);
  },

  // 6. DISCOVER PEOPLE & CONNECTIONS
  async getPeople({ language = null, broadLocation = null, role = null, query = '' } = {}) {
    const store = getStore();
    let people = [...store.profiles];

    // Filter by visibility and active block list
    const blockedIds = store.user_blocks.map((b) => b.blocked_user_id);
    people = people.filter((p) => p.visibility !== 'private' && !blockedIds.includes(p.user_id));

    if (language) people = people.filter((p) => p.language === language);
    if (broadLocation) people = people.filter((p) => p.broad_location === broadLocation && p.local_discovery_enabled !== false);
    if (role && role !== 'All') people = people.filter((p) => p.role_badge === role);
    if (query.trim()) {
      const q = query.toLowerCase();
      people = people.filter((p) =>
        p.display_name.toLowerCase().includes(q) ||
        (p.bio && p.bio.toLowerCase().includes(q)) ||
        (p.broad_location && p.broad_location.toLowerCase().includes(q))
      );
    }

    return people;
  },

  async sendConnectionRequest(requesterId, recipientId) {
    const store = getStore();
    if (!store.connections) store.connections = [];
    const existing = store.connections.find(
      (c) =>
        (c.requester_id === requesterId && c.recipient_id === recipientId) ||
        (c.requester_id === recipientId && c.recipient_id === requesterId)
    );
    if (!existing) {
      store.connections.push({
        requester_id: requesterId,
        recipient_id: recipientId,
        status: 'accepted' // auto-connect for gentle peer support
      });
      saveStore(store);
      emitCommunityEvent('CONNECTION_UPDATED', { requesterId, recipientId, status: 'accepted' });
    }
    return true;
  },

  async getConnectionStatus(userA, userB) {
    const store = getStore();
    const conn = (store.connections || []).find(
      (c) =>
        (c.requester_id === userA && c.recipient_id === userB) ||
        (c.requester_id === userB && c.recipient_id === userA)
    );
    return conn ? conn.status : 'none';
  },

  // 7. PRIVATE 1-TO-1 MESSAGING
  async getMessages(userA, userB) {
    const store = getStore();
    return (store.messages || []).filter(
      (m) =>
        (m.sender_id === userA && m.recipient_id === userB) ||
        (m.sender_id === userB && m.recipient_id === userA)
    ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  },

  async sendMessage(sender, recipientId, content) {
    const store = getStore();
    if (!store.messages) store.messages = [];

    const threadId = [sender.id || sender.user_id, recipientId].sort().join('-');

    const newMsg = {
      id: `msg-${Date.now()}`,
      thread_id: threadId,
      sender_id: sender.id || sender.user_id,
      sender_name: sender.name || sender.display_name,
      recipient_id: recipientId,
      content,
      read: false,
      created_at: new Date().toISOString()
    };

    store.messages.push(newMsg);
    saveStore(store);

    emitCommunityEvent('MESSAGE_SENT', newMsg);
    return newMsg;
  },

  // 8. SAFETY & MODERATION
  async reportContent({ reporterId, targetType, targetId, reason, details }) {
    const store = getStore();
    if (!store.reports) store.reports = [];

    const newReport = {
      id: `report-${Date.now()}`,
      reporter_id: reporterId,
      target_type: targetType, // 'post', 'comment', 'user'
      target_id: targetId,
      reason,
      details,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    store.reports.push(newReport);
    saveStore(store);

    emitCommunityEvent('REPORT_SUBMITTED', newReport);
    return newReport;
  },

  async getPendingReports() {
    const store = getStore();
    return (store.reports || []).filter((r) => r.status === 'pending');
  },

  async moderateReport(reportId, actionTaken, notes = '') {
    const store = getStore();
    const report = (store.reports || []).find((r) => r.id === reportId);
    if (report) {
      report.status = actionTaken === 'dismiss' ? 'dismissed' : 'action_taken';
      report.action_taken = actionTaken;
      report.notes = notes;

      // If removed post, mark post as removed
      if (actionTaken === 'remove_content' && report.target_type === 'post') {
        const p = store.posts.find((item) => item.id === report.target_id);
        if (p) p.is_removed = true;
      }
      saveStore(store);
      emitCommunityEvent('REPORT_MODERATED', { reportId, actionTaken });
    }
    return true;
  },

  async blockUser(blockerId, blockedUserId) {
    const store = getStore();
    if (!store.user_blocks) store.user_blocks = [];
    store.user_blocks.push({
      blocker_id: blockerId,
      blocked_user_id: blockedUserId,
      created_at: new Date().toISOString()
    });
    saveStore(store);
    emitCommunityEvent('USER_BLOCKED', { blockerId, blockedUserId });
    return true;
  }
};
