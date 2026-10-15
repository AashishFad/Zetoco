import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// In-memory sender profile cache to avoid repeated profile queries
const profileCache = new Map();

/**
 * Helper to fetch and cache user profile details for realtime message payloads
 */
export async function getOrFetchProfile(userId) {
  if (!userId) return null;
  if (profileCache.has(userId)) {
    return profileCache.get(userId);
  }

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, job_title')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        profileCache.set(userId, data);
        return data;
      }
    } catch (err) {
      console.warn('Profile fetch notice for realtime:', err.message);
    }
  }

  return null;
}

/**
 * Custom hook to manage Supabase Realtime message subscriptions for a specific channel
 *
 * @param {string} channelId - The active channel UUID
 * @param {Object} callbacks - Event callbacks
 * @param {Function} callbacks.onInsert - Callback when a new message is inserted
 * @param {Function} callbacks.onUpdate - Callback when a message is updated
 * @param {Function} callbacks.onDelete - Callback when a message is deleted
 */
export function useRealtimeMessages(channelId, { onInsert, onUpdate, onDelete }) {
  const [status, setStatus] = useState('disconnected'); // 'connected' | 'connecting' | 'disconnected' | 'error'
  const activeSubscriptionRef = useRef(null);

  // Keep callback refs fresh without triggering effect re-runs
  const onInsertRef = useRef(onInsert);
  const onUpdateRef = useRef(onUpdate);
  const onDeleteRef = useRef(onDelete);

  useEffect(() => {
    onInsertRef.current = onInsert;
    onUpdateRef.current = onUpdate;
    onDeleteRef.current = onDelete;
  }, [onInsert, onUpdate, onDelete]);

  const subscribe = useCallback(() => {
    if (!channelId || !isSupabaseConfigured()) {
      setStatus('disconnected');
      return;
    }

    // Clean up any existing channel before establishing new one
    if (activeSubscriptionRef.current) {
      supabase.removeChannel(activeSubscriptionRef.current);
      activeSubscriptionRef.current = null;
    }

    setStatus('connecting');

    const channelTopic = `realtime:messages:${channelId}`;
    const channel = supabase.channel(channelTopic, {
      config: {
        broadcast: { ack: true },
      },
    });

    // 1. Listen for INSERT events on messages table scoped to this channel
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`,
      },
      async (payload) => {
        const row = payload.new;
        if (!row || row.channel_id !== channelId) return;

        // Resolve author profile
        const senderProfile = await getOrFetchProfile(row.user_id);

        const formattedMsg = {
          id: row.id,
          channelId: row.channel_id,
          userId: row.user_id,
          content: row.content,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          senderName: senderProfile?.full_name || 'Team Member',
          senderUsername: senderProfile?.username,
          senderAvatarUrl: senderProfile?.avatar_url,
          senderJobTitle: senderProfile?.job_title,
        };

        if (onInsertRef.current) {
          onInsertRef.current(formattedMsg);
        }
      }
    );

    // 2. Listen for UPDATE events
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`,
      },
      async (payload) => {
        const row = payload.new;
        if (!row || row.channel_id !== channelId) return;

        if (onUpdateRef.current) {
          onUpdateRef.current({
            id: row.id,
            channelId: row.channel_id,
            userId: row.user_id,
            content: row.content,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          });
        }
      }
    );

    // 3. Listen for DELETE events
    channel.on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
      },
      (payload) => {
        const oldRow = payload.old;
        if (oldRow && oldRow.id) {
          if (onDeleteRef.current) {
            onDeleteRef.current(oldRow.id);
          }
        }
      }
    );

    // 4. Subscribe and monitor connection status
    channel.subscribe((subStatus, err) => {
      if (subStatus === 'SUBSCRIBED') {
        setStatus('connected');
      } else if (subStatus === 'CLOSED') {
        setStatus('disconnected');
      } else if (subStatus === 'CHANNEL_ERROR' || subStatus === 'TIMED_OUT') {
        console.warn('Realtime channel status warning:', subStatus, err?.message);
        setStatus('error');
      }
    });

    activeSubscriptionRef.current = channel;
  }, [channelId]);

  useEffect(() => {
    subscribe();

    return () => {
      if (activeSubscriptionRef.current) {
        supabase.removeChannel(activeSubscriptionRef.current);
        activeSubscriptionRef.current = null;
      }
    };
  }, [subscribe]);

  const reconnect = useCallback(() => {
    subscribe();
  }, [subscribe]);

  return {
    status,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    isError: status === 'error',
    reconnect,
  };
}
