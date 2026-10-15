/**
 * Main API Router
 * Aggregates all modular sub-routers under /api
 */
const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const usersRoutes = require('./usersRoutes');
const organizationsRoutes = require('./organizationsRoutes');
const projectsRoutes = require('./projectsRoutes');
const tasksRoutes = require('./tasksRoutes');
const commentsRoutes = require('./commentsRoutes');
const channelsRoutes = require('./channelsRoutes');
const messagesRoutes = require('./messagesRoutes');
const notificationsRoutes = require('./notificationsRoutes');
const attachmentsRoutes = require('./attachmentsRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const invitationsRoutes = require('./invitationsRoutes');

const router = express.Router();

// Root API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to FlowSync REST API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      fullHealth: '/api/health/full',
      auth: '/api/auth',
      users: '/api/users',
      organizations: '/api/organizations',
      invitations: '/api/organizations/:organizationId/invitations',
      projects: '/api/projects',
      tasks: '/api/tasks',
      comments: '/api/tasks/:taskId/comments',
      activity: '/api/tasks/:taskId/activity',
      channels: '/api/channels',
      messages: '/api/messages',
      notifications: '/api/notifications',
      attachments: '/api/attachments',
      taskAttachments: '/api/tasks/:taskId/attachments',
      analytics: '/api/analytics',
    },
  });
});

// Mount modular sub-routers
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/organizations', organizationsRoutes);
router.use('/', invitationsRoutes);
router.use('/projects', projectsRoutes);
router.use('/tasks', tasksRoutes);
router.use('/', commentsRoutes);
router.use('/channels', channelsRoutes);
router.use('/messages', messagesRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/', attachmentsRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;
