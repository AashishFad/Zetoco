/**
 * Channels & Channel Messaging Router
 * Handles channel management and message dispatching within organizations.
 */
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { supabase } = require('../config/supabase');

const router = express.Router();

// Protect all channel endpoints with Supabase JWT authentication
router.use(authMiddleware);

/**
 * Helper to normalize channel names (lowercase, kebab-case, no special symbols)
 */
function normalizeChannelName(name) {
  return (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Helper to ensure the default #general channel exists for an organization
 */
async function ensureGeneralChannelExists(organizationId, userId) {
  try {
    const { data: existing } = await supabase
      .from('channels')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('name', 'general')
      .maybeSingle();

    if (!existing) {
      await supabase.from('channels').insert({
        organization_id: organizationId,
        name: 'general',
        description: 'Workspace-wide announcements and team updates',
        type: 'general',
        created_by: userId,
      });
    }
  } catch (err) {
    console.warn('ensureGeneralChannelExists notice:', err.message);
  }
}

/**
 * GET /api/channels
 * Fetch all channels for an organization
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const organizationId = req.query.organizationId || req.headers['x-organization-id'];

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required',
      });
    }

    // 1. Verify caller is a member of this organization
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!orgMember) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not a member of this organization',
      });
    }

    // 2. Ensure default #general channel exists
    await ensureGeneralChannelExists(organizationId, userId);

    // 3. Fetch all channels for this org
    const { data: channels, error } = await supabase
      .from('channels')
      .select(`
        *,
        project:projects (
          id,
          name,
          color
        ),
        creator:profiles!channels_created_by_fkey (
          id,
          full_name,
          username
        )
      `)
      .eq('organization_id', organizationId)
      .order('type', { ascending: true }) // 'general' first, then 'custom'/'project'
      .order('name', { ascending: true });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const formatted = (channels || []).map((ch) => ({
      id: ch.id,
      organizationId: ch.organization_id,
      projectId: ch.project_id,
      projectName: ch.project?.name || null,
      name: ch.name,
      description: ch.description,
      type: ch.type,
      createdBy: ch.created_by,
      creatorName: ch.creator?.full_name || 'Team Member',
      createdAt: ch.created_at,
      updatedAt: ch.updated_at,
    }));

    res.json({
      success: true,
      data: formatted,
      count: formatted.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/channels
 * Create a new channel (custom or project-linked)
 */
router.post('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { organizationId, name, description, projectId, type = 'custom' } = req.body;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required',
      });
    }

    const cleanName = normalizeChannelName(name);
    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Channel name must be at least 2 characters (alphanumeric and hyphens only)',
      });
    }

    // 1. Verify caller organization membership
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!orgMember) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not a member of this organization',
      });
    }

    // 2. Check if channel name already exists in this org
    const { data: existing } = await supabase
      .from('channels')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('name', cleanName)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Channel #${cleanName} already exists in this organization`,
      });
    }

    // 3. If projectId is provided, verify project belongs to this org
    if (projectId) {
      const { data: proj } = await supabase
        .from('projects')
        .select('id, organization_id')
        .eq('id', projectId)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (!proj) {
        return res.status(400).json({
          success: false,
          message: 'Project not found in this organization',
        });
      }
    }

    // 4. Create channel
    const channelType = projectId ? 'project' : (type === 'general' ? 'general' : 'custom');
    const { data: newChannel, error: insertErr } = await supabase
      .from('channels')
      .insert({
        organization_id: organizationId,
        project_id: projectId || null,
        name: cleanName,
        description: description?.trim() || null,
        type: channelType,
        created_by: userId,
      })
      .select(`
        *,
        project:projects (
          id,
          name,
          color
        ),
        creator:profiles!channels_created_by_fkey (
          id,
          full_name,
          username
        )
      `)
      .single();

    if (insertErr) {
      return res.status(400).json({
        success: false,
        message: insertErr.message,
      });
    }

    res.status(201).json({
      success: true,
      message: `Channel #${cleanName} created successfully`,
      data: {
        id: newChannel.id,
        organizationId: newChannel.organization_id,
        projectId: newChannel.project_id,
        projectName: newChannel.project?.name || null,
        name: newChannel.name,
        description: newChannel.description,
        type: newChannel.type,
        createdBy: newChannel.created_by,
        creatorName: newChannel.creator?.full_name || 'Team Member',
        createdAt: newChannel.created_at,
        updatedAt: newChannel.updated_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/channels/:channelId
 * Delete a custom/project channel (Cannot delete #general)
 */
router.delete('/:channelId', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { channelId } = req.params;

    // Fetch channel
    const { data: channel, error: fetchErr } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channelId)
      .maybeSingle();

    if (fetchErr || !channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    if (channel.type === 'general' || channel.name === 'general') {
      return res.status(400).json({
        success: false,
        message: 'The default #general channel cannot be deleted',
      });
    }

    // Verify permission: creator or org admin
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', channel.organization_id)
      .eq('user_id', userId)
      .maybeSingle();

    const isCreator = channel.created_by === userId;
    const isOrgAdmin = orgMember?.role === 'admin';

    if (!isCreator && !isOrgAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to delete this channel',
      });
    }

    const { error: delErr } = await supabase
      .from('channels')
      .delete()
      .eq('id', channelId);

    if (delErr) {
      return res.status(400).json({
        success: false,
        message: delErr.message,
      });
    }

    res.json({
      success: true,
      message: `Channel #${channel.name} deleted successfully`,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/channels/:channelId/messages
 * Retrieve messages for a channel (Chronological order)
 */
router.get('/:channelId/messages', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { channelId } = req.params;

    // 1. Verify channel access
    const { data: channel, error: chErr } = await supabase
      .from('channels')
      .select('id, organization_id, project_id, name')
      .eq('id', channelId)
      .maybeSingle();

    if (chErr || !channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    // Verify user is in the organization
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', channel.organization_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!orgMember) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Access denied to this channel',
      });
    }

    // 2. Fetch messages with sender profile
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_user_id_fkey (
          id,
          full_name,
          username,
          avatar_url,
          job_title
        )
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const formatted = (messages || []).map((m) => ({
      id: m.id,
      channelId: m.channel_id,
      userId: m.user_id,
      content: m.content,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
      senderName: m.sender?.full_name || 'Team Member',
      senderUsername: m.sender?.username,
      senderAvatarUrl: m.sender?.avatar_url,
      senderJobTitle: m.sender?.job_title,
      isAuthor: m.user_id === userId,
    }));

    res.json({
      success: true,
      data: formatted,
      count: formatted.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/channels/:channelId/messages
 * Send a message to a channel
 */
router.post('/:channelId/messages', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { channelId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content cannot be empty',
      });
    }

    // 1. Verify channel access
    const { data: channel, error: chErr } = await supabase
      .from('channels')
      .select('id, organization_id, project_id, name')
      .eq('id', channelId)
      .maybeSingle();

    if (chErr || !channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    // Verify user is in the organization
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', channel.organization_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!orgMember) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Access denied to post in this channel',
      });
    }

    // 2. Insert message
    const { data: newMsg, error: insertErr } = await supabase
      .from('messages')
      .insert({
        channel_id: channelId,
        user_id: userId,
        content: content.trim(),
      })
      .select(`
        *,
        sender:profiles!messages_user_id_fkey (
          id,
          full_name,
          username,
          avatar_url,
          job_title
        )
      `)
      .single();

    if (insertErr) {
      return res.status(400).json({
        success: false,
        message: insertErr.message,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        id: newMsg.id,
        channelId: newMsg.channel_id,
        userId: newMsg.user_id,
        content: newMsg.content,
        createdAt: newMsg.created_at,
        updatedAt: newMsg.updated_at,
        senderName: newMsg.sender?.full_name || 'Team Member',
        senderUsername: newMsg.sender?.username,
        senderAvatarUrl: newMsg.sender?.avatar_url,
        senderJobTitle: newMsg.sender?.job_title,
        isAuthor: true,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
