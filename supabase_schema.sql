-- ==============================================================================
-- SMRITICARE: GLOBAL DEMENTIA COMMUNITY SCHEMA
-- Problem Statement: SIH26003 | Team AvishkarX
-- ==============================================================================
-- Note: Private local patient medical data (cognitive scores, medications, PHC notes)
-- is strictly isolated in the local Dexie.js database and NEVER stored in this cloud schema.
-- This schema handles public/community interactions, peer support, groups, and safe messaging.
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COMMUNITY PROFILES
-- Contains safe public profile details. Does NOT contain clinical diagnostic or medical telemetry.
CREATE TABLE IF NOT EXISTS community_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT UNIQUE NOT NULL, -- references auth.users(id) or local app user id
    display_name TEXT NOT NULL,
    role_badge TEXT NOT NULL DEFAULT 'Community Member', -- 'Caregiver', 'Patient', 'Family Member', 'Healthcare Professional', 'Community Supporter'
    avatar TEXT,
    bio TEXT,
    broad_location TEXT, -- e.g. "Assam / North East", "Central India", "California" (NO exact addresses/GPS)
    language TEXT DEFAULT 'en', -- 'en', 'hi', 'as', 'bn'
    visibility TEXT DEFAULT 'public', -- 'public', 'community_only', 'private'
    local_discovery_enabled BOOLEAN DEFAULT true,
    show_broad_location BOOLEAN DEFAULT true,
    allow_messages_from TEXT DEFAULT 'everyone', -- 'everyone', 'connections_only', 'nobody'
    show_online_status BOOLEAN DEFAULT false,
    is_moderator BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. COMMUNITIES / GROUPS
CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'public', -- 'public', 'private'
    category TEXT NOT NULL DEFAULT 'General Support', -- 'Caregiver Support', 'Memory & Activities', 'Daily Life', 'Family Support', 'Regional'
    scope TEXT NOT NULL DEFAULT 'global', -- 'global', 'country', 'region', 'language'
    country TEXT,
    region TEXT,
    language TEXT,
    icon TEXT,
    member_count INTEGER DEFAULT 1,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. COMMUNITY MEMBERS
CREATE TABLE IF NOT EXISTS community_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'member', -- 'admin', 'moderator', 'member'
    status TEXT DEFAULT 'active', -- 'active', 'pending_approval', 'banned'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(community_id, user_id)
);

-- 4. COMMUNITY POSTS
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    author_role TEXT DEFAULT 'Caregiver',
    author_location TEXT,
    community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
    community_name TEXT,
    topic TEXT NOT NULL DEFAULT 'Caregiver Support',
    post_type TEXT NOT NULL DEFAULT 'experience', -- 'story', 'question', 'encouragement', 'text', 'announcement'
    content TEXT NOT NULL,
    image_url TEXT,
    language TEXT DEFAULT 'en',
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    is_removed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. COMMENTS
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    author_role TEXT,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    is_removed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. REACTIONS
CREATE TABLE IF NOT EXISTS reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    reaction_type TEXT NOT NULL, -- 'heart', 'hug', 'smile', 'lightbulb'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id, reaction_type)
);

-- 7. CONNECTIONS (PEOPLE DISCOVERY)
CREATE TABLE IF NOT EXISTS connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id TEXT NOT NULL,
    recipient_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(requester_id, recipient_id)
);

-- 8. MESSAGE THREADS
CREATE TABLE IF NOT EXISTS message_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_1 TEXT NOT NULL,
    participant_2 TEXT NOT NULL,
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participant_1, participant_2)
);

-- 9. MESSAGES
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID REFERENCES message_threads(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. SAVED POSTS (BOOKMARKS)
CREATE TABLE IF NOT EXISTS saved_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- 11. REPORTS (SAFETY & CONTENT MODERATION)
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id TEXT NOT NULL,
    target_type TEXT NOT NULL, -- 'post', 'comment', 'user'
    target_id TEXT NOT NULL,
    reason TEXT NOT NULL, -- 'Harassment', 'Spam', 'Scam', 'Inappropriate content', 'Medical misinformation', 'Dangerous advice', 'Other'
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'dismissed', 'action_taken'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. MODERATION ACTIONS
CREATE TABLE IF NOT EXISTS moderation_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
    moderator_id TEXT NOT NULL,
    action_taken TEXT NOT NULL, -- 'content_removed', 'warning_sent', 'user_muted', 'user_suspended', 'dismissed'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    type TEXT NOT NULL, -- 'comment', 'reaction', 'message', 'connection', 'moderation'
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. USER BLOCKS
CREATE TABLE IF NOT EXISTS user_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id TEXT NOT NULL,
    blocked_user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_user_id)
);

-- ==============================================================================
-- INDEXES FOR REALTIME & SEARCH PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_topic ON posts(topic);
CREATE INDEX IF NOT EXISTS idx_posts_community_id ON posts(community_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE community_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can view public profiles; owners can update their own
CREATE POLICY "Public profiles are viewable by everyone" ON community_profiles
    FOR SELECT USING (visibility = 'public' OR visibility = 'community_only');

CREATE POLICY "Users can update own profile" ON community_profiles
    FOR ALL USING (auth.uid()::text = user_id);

-- Posts: View non-removed posts; authors can insert/update/delete own posts
CREATE POLICY "Anyone can view active posts" ON posts
    FOR SELECT USING (is_removed = false);

CREATE POLICY "Authenticated users can create posts" ON posts
    FOR INSERT WITH CHECK (auth.uid()::text = author_id);

CREATE POLICY "Authors can update or delete own posts" ON posts
    FOR ALL USING (auth.uid()::text = author_id);

-- Comments: View active comments; authors manage own comments
CREATE POLICY "Anyone can view comments" ON comments
    FOR SELECT USING (is_removed = false);

CREATE POLICY "Authenticated users can add comments" ON comments
    FOR INSERT WITH CHECK (auth.uid()::text = author_id);

-- Messages: Participants can select and insert
CREATE POLICY "Participants can view thread messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM message_threads mt
            WHERE mt.id = messages.thread_id
            AND (mt.participant_1 = auth.uid()::text OR mt.participant_2 = auth.uid()::text)
        )
    );

CREATE POLICY "Participants can send messages" ON messages
    FOR INSERT WITH CHECK (auth.uid()::text = sender_id);

-- Reports: Anyone can report; only moderators can view all reports
CREATE POLICY "Anyone can submit a report" ON reports
    FOR INSERT WITH CHECK (true);
