import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getOrFetchProfile } from './useRealtimeMessages';

/**
 * Custom hook to listen for Supabase Realtime notifications for the authenticated user
 *
 * @param {string} userId - Current authenticated user UUID
 * @param {Object} callbacks
 * @param {Function} callbacks.onInsert - Callback when a new notification is inserted
 * @param {Function} callbacks.onUpdate - Callback when a notification is updated (e.g. read state)
 */
export function useRealtimeNotifications(userId, { onInsert, onUpdate } = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const activeChannelRef = useRef(null);

  const onInsertRef = useRef(onInsert);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onInsertRef.current = onInsert;
    onUpdateRef.current = onUpdate;
  }, [onInsert, onUpdate]);

  const subscribe = useCallback(() => {
    if (!userId || !isSupabaseConfigured()) {
      setIsConnected(false);
      return;
    }

    if (activeChannelRef.current) {
      supabase.removeChannel(activeChannelRef.current);
      activeChannelRef.current = null;
    }

    const channelTopic = `realtime:notifications:${userId}`;
    const channel = supabase.channel(channelTopic);

    // Listen for INSERT events on notifications for this user
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        const row = payload.new;
        if (!row || row.user_id !== userId) return;

        // Resolve actor profile
        const actorProfile = row.actor_id ? await getOrFetchProfile(row.actor_id) : null;

        const formattedNotification = {
          id: row.id,
          userId: row.user_id,
          organizationId: row.organization_id,
          type: row.metadata?.realType || row.type,
          title: row.title,
          message: row.message,
          entityType: row.entity_type,
          entityId: row.entity_id,
          actorId: row.actor_id,
          actorName: actorProfile?.full_name || 'Team Member',
          actorUsername: actorProfile?.username,
          actorAvatarUrl: actorProfile?.avatar_url,
          isRead: row.is_read,
          metadata: row.metadata || {},
          createdAt: row.created_at,
        };

        if (onInsertRef.current) {
          onInsertRef.current(formattedNotification);
        }
      }
    );

    // Listen for UPDATE events (e.g. mark as read)
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new;
        if (!row || row.user_id !== userId) return;

        if (onUpdateRef.current) {
          onUpdateRef.current({
            id: row.id,
            isRead: row.is_read,
          });
        }
      }
    );

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    });

    activeChannelRef.current = channel;
  }, [userId]);

  useEffect(() => {
    subscribe();

    return () => {
      if (activeChannelRef.current) {
        supabase.removeChannel(activeChannelRef.current);
        activeChannelRef.current = null;
      }
    };
  }, [subscribe]);

  return { isConnected };
}
