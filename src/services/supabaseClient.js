import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) || (typeof process !== 'undefined' && process.env) || {};
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project-id')
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// Cross-tab Realtime Event Bus (Ensures multi-tab realtime synchronization runs out-of-the-box!)
const broadcastChannel = typeof window !== 'undefined' && window.BroadcastChannel
  ? new BroadcastChannel('smriti_community_bus')
  : null;

export const emitCommunityEvent = (eventType, payload) => {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: eventType, payload, timestamp: Date.now() });
  }
};

export const subscribeCommunityEvents = (handler) => {
  if (!broadcastChannel) return () => {};
  const listener = (event) => {
    if (event.data && handler) {
      handler(event.data);
    }
  };
  broadcastChannel.addEventListener('message', listener);
  return () => {
    broadcastChannel.removeEventListener('message', listener);
  };
};
