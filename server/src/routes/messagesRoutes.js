/**
 * Messages Router
 * Handles direct message modifications (edit, delete) by message authors and admins.
 */
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { supabase } = require('../config/supabase');

const router = express.Router();

// Protect all message modification endpoints with Supabase JWT authentication
router.use(authMiddleware);

/**
 * PATCH /api/messages/:messageId
 * Edit message content (Author only)
 */
router.patch('/:messageId', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content cannot be empty',
      });
    }

    // 1. Fetch message to verify ownership
    const { data: message, error: fetchErr } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .maybeSingle();

    if (fetchErr || !message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    if (message.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only edit your own messages',
      });
    }

    // 2. Update message
    const { data: updatedMsg, error: updateErr } = await supabase
      .from('messages')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
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

    if (updateErr) {
      return res.status(400).json({
        success: false,
        message: updateErr.message,
      });
    }

    res.json({
      success: true,
      message: 'Message updated successfully',
      data: {
        id: updatedMsg.id,
        channelId: updatedMsg.channel_id,
        userId: updatedMsg.user_id,
        content: updatedMsg.content,
        createdAt: updatedMsg.created_at,
        updatedAt: updatedMsg.updated_at,
        senderName: updatedMsg.sender?.full_name || 'Team Member',
        senderUsername: updatedMsg.sender?.username,
        senderAvatarUrl: updatedMsg.sender?.avatar_url,
        senderJobTitle: updatedMsg.sender?.job_title,
        isAuthor: true,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/messages/:messageId
 * Delete a message (Author only or Org Admin)
 */
router.delete('/:messageId', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    // 1. Fetch message and channel details
    const { data: message, error: fetchErr } = await supabase
      .from('messages')
      .select(`
        *,
        channel:channels (
          organization_id
        )
      `)
      .eq('id', messageId)
      .maybeSingle();

    if (fetchErr || !message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    const orgId = message.channel?.organization_id;

    // 2. Check admin or author privileges
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .maybeSingle();

    const isAuthor = message.user_id === userId;
    const isOrgAdmin = orgMember?.role === 'admin';

    if (!isAuthor && !isOrgAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to delete this message',
      });
    }

    // 3. Delete message
    const { error: delErr } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (delErr) {
      return res.status(400).json({
        success: false,
        message: delErr.message,
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
