/**
 * Channel & Messaging Service
 * Client-side data fetching and mutation handling for organization communication channels.
 * Communicates with Express backend via authenticated apiClient with Supabase fallback.
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import apiClient from './api';

/**
 * Normalizes channel name (lowercase kebab/alphanumeric)
 */
export const normalizeChannelName = (name) => {
  return (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

/**
 * Helper: Hydrate creators for channels
 */
async function hydrateChannelCreators(channelsList) {
  if (!channelsList || channelsList.length === 0) return [];
  const userIds = new Set();
  channelsList.forEach((c) => {
    if (c.created_by) userIds.add(c.created_by);
  });

  let profileMap = new Map();
  if (userIds.size > 0 && isSupabaseConfigured()) {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', Array.from(userIds));

      if (profiles) {
        profileMap = new Map(profiles.map((p) => [p.id, p]));
      }
    } catch (e) {
      console.warn('Could not hydrate channel creators in client:', e.message);
    }
  }

  return channelsList.map((ch) => {
    const creator = profileMap.get(ch.created_by);
    return {
      id: ch.id,
      organizationId: ch.organization_id,
      projectId: ch.project_id,
      projectName: ch.project?.name || null,
      name: ch.name,
      description: ch.description,
      type: ch.type,
      createdBy: ch.created_by,
      creatorName: creator?.full_name || 'Team Member',
      createdAt: ch.created_at,
      updatedAt: ch.updated_at,
    };
  });
}

/**
 * Helper: Hydrate senders for channel messages
 */
async function hydrateMessageSenders(messagesList) {
  if (!messagesList || messagesList.length === 0) return [];
  const userIds = new Set();
  messagesList.forEach((m) => {
    if (m.user_id) userIds.add(m.user_id);
  });

  let profileMap = new Map();
  if (userIds.size > 0 && isSupabaseConfigured()) {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, job_title')
        .in('id', Array.from(userIds));

      if (profiles) {
        profileMap = new Map(profiles.map((p) => [p.id, p]));
      }
    } catch (e) {
      console.warn('Could not hydrate message senders in client:', e.message);
    }
  }

  return messagesList.map((m) => {
    const sender = profileMap.get(m.user_id);
    return {
      id: m.id,
      channelId: m.channel_id,
      userId: m.user_id,
      content: m.content,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
      senderName: sender?.full_name || 'Team Member',
      senderUsername: sender?.username,
      senderAvatarUrl: sender?.avatar_url,
      senderJobTitle: sender?.job_title,
    };
  });
}

/**
 * Fetch all channels for an organization
 */
export const getChannels = async (organizationId) => {
  if (!organizationId) return [];

  // 1. Try Express backend API via authenticated apiClient
  try {
    const res = await apiClient.get('/channels', {
      params: { organizationId },
      headers: { 'x-organization-id': organizationId },
    });
    if (res) {
      return Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    }
  } catch (err) {
    console.warn('API getChannels fallback to Supabase:', err.message);
  }

  // 2. Direct Supabase fallback
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select(`
          *,
          project:projects (
            id,
            name,
            color
          )
        `)
        .eq('organization_id', organizationId)
        .order('type', { ascending: true })
        .order('name', { ascending: true });

      if (!error && data) {
        return await hydrateChannelCreators(data);
      }
    } catch (err) {
      console.warn('Supabase getChannels fallback failed:', err.message);
    }
  }

  return [];
};

/**
 * Create a new communication channel
 */
export const createChannel = async ({ organizationId, name, description, projectId = null, type = 'custom', userId = null }) => {
  const cleanName = normalizeChannelName(name);
  if (!organizationId || !cleanName) {
    return { success: false, error: 'Channel name and organization are required' };
  }

  // 1. Try Express backend API via authenticated apiClient
  try {
    const res = await apiClient.post('/channels', {
      organizationId,
      name: cleanName,
      description,
      projectId,
      type,
    });
    return { success: true, channel: res?.data || res?.channel || res };
  } catch (err) {
    console.warn('API createChannel fallback to Supabase:', err.message);
  }

  // 2. Direct Supabase fallback
  if (isSupabaseConfigured()) {
    try {
      const channelType = projectId ? 'project' : (type === 'general' ? 'general' : 'custom');
      const { data, error } = await supabase
        .from('channels')
        .insert({
          organization_id: organizationId,
          project_id: projectId || null,
          name: cleanName,
          description: description?.trim() || null,
          type: channelType,
          created_by: userId || null,
        })
        .select(`
          *,
          project:projects (
            id,
            name,
            color
          )
        `)
        .single();

      if (!error && data) {
        const [hydrated] = await hydrateChannelCreators([data]);
        return {
          success: true,
          channel: hydrated || {
            id: data.id,
            organizationId: data.organization_id,
            projectId: data.project_id,
            name: data.name,
            description: data.description,
            type: data.type,
            createdAt: data.created_at,
          },
        };
      }
      if (error) {
        if (error.code === '23505') {
          return { success: false, error: `Channel #${cleanName} already exists in this organization` };
        }
        return { success: false, error: error.message };
      }
    } catch (err) {
      console.warn('Supabase createChannel fallback failed:', err.message);
      return { success: false, error: err.message || 'Failed to create channel' };
    }
  }

  return { success: false, error: 'Failed to create channel' };
};

/**
 * Delete a channel (General channel cannot be deleted)
 */
export const deleteChannel = async (channelId) => {
  if (!channelId) return { success: false, error: 'Channel ID is required' };

  // 1. Try Express backend API via authenticated apiClient
  try {
    await apiClient.delete(`/channels/${channelId}`);
    return { success: true };
  } catch (err) {
    console.warn('API deleteChannel fallback to Supabase:', err.message);
  }

  // 2. Direct Supabase fallback
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', channelId);

      if (!error) return { success: true };
      if (error) return { success: false, error: error.message };
    } catch (err) {
      console.warn('Supabase deleteChannel fallback failed:', err.message);
      return { success: false, error: err.message || 'Failed to delete channel' };
    }
  }

  return { success: false, error: 'Failed to delete channel' };
};

/**
 * Fetch messages for a specific channel
 */
export const getChannelMessages = async (channelId) => {
  if (!channelId) return [];

  // 1. Try Express backend API via authenticated apiClient
  try {
    const res = await apiClient.get(`/channels/${channelId}/messages`);
    if (res) {
      return Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    }
  } catch (err) {
    console.warn('API getChannelMessages fallback to Supabase:', err.message);
  }

  // 2. Direct Supabase fallback
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        return await hydrateMessageSenders(data);
      }
    } catch (err) {
      console.warn('Supabase getChannelMessages fallback failed:', err.message);
    }
  }

  return [];
};

/**
 * Send a message in a channel
 */
export const sendChannelMessage = async (channelId, content, userId) => {
  if (!channelId || !content?.trim()) {
    return { success: false, error: 'Message content is required' };
  }

  // 1. Try Express backend API via authenticated apiClient
  try {
    const res = await apiClient.post(`/channels/${channelId}/messages`, { content });
    return { success: true, message: res?.data || res?.message || res };
  } catch (err) {
    console.warn('API sendChannelMessage fallback to Supabase:', err.message);
  }

  // 2. Direct Supabase fallback
  if (isSupabaseConfigured() && userId) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          channel_id: channelId,
          user_id: userId,
          content: content.trim(),
        })
        .select('*')
        .single();

      if (!error && data) {
        const [hydrated] = await hydrateMessageSenders([data]);
        return {
          success: true,
          message: hydrated || {
            id: data.id,
            channelId: data.channel_id,
            userId: data.user_id,
            content: data.content,
            createdAt: data.created_at,
            isAuthor: true,
          },
        };
      }
      if (error) {
        return { success: false, error: error.message };
      }
    } catch (err) {
      console.warn('Supabase sendChannelMessage fallback failed:', err.message);
      return { success: false, error: err.message || 'Failed to send message' };
    }
  }

  return { success: false, error: 'Failed to send message' };
};

/**
 * Edit a message
 */
export const updateMessage = async (messageId, content) => {
  if (!messageId || !content?.trim()) {
    return { success: false, error: 'Message content is required' };
  }

  // 1. Try Express backend API via authenticated apiClient
  try {
    const res = await apiClient.patch(`/messages/${messageId}`, { content });
    return { success: true, message: res?.data || res?.message || res };
  } catch (err) {
    console.warn('API updateMessage fallback to Supabase:', err.message);
  }

  // 2. Direct Supabase fallback
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .update({
          content: content.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .select('*')
        .single();

      if (!error && data) {
        const [hydrated] = await hydrateMessageSenders([data]);
        return {
          success: true,
          message: hydrated || {
            id: data.id,
            channelId: data.channel_id,
            userId: data.user_id,
            content: data.content,
            createdAt: data.created_at,
            isAuthor: true,
          },
        };
      }
      if (error) {
        return { success: false, error: error.message };
      }
    } catch (err) {
      console.warn('Supabase updateMessage fallback failed:', err.message);
      return { success: false, error: err.message || 'Failed to update message' };
    }
  }

  return { success: false, error: 'Failed to update message' };
};

/**
 * Delete a message
 */
export const deleteMessage = async (messageId) => {
  if (!messageId) return { success: false, error: 'Message ID is required' };

  // 1. Try Express backend API via authenticated apiClient
  try {
    await apiClient.delete(`/messages/${messageId}`);
    return { success: true };
  } catch (err) {
    console.warn('API deleteMessage fallback to Supabase:', err.message);
  }

  // 2. Direct Supabase fallback
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (!error) return { success: true };
      if (error) return { success: false, error: error.message };
    } catch (err) {
      console.warn('Supabase deleteMessage fallback failed:', err.message);
      return { success: false, error: err.message || 'Failed to delete message' };
    }
  }

  return { success: false, error: 'Failed to delete message' };
};

export default {
  normalizeChannelName,
  getChannels,
  createChannel,
  deleteChannel,
  getChannelMessages,
  sendChannelMessage,
  updateMessage,
  deleteMessage,
};
