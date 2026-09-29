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
const messagesRoutes = require('./messagesRoutes');
const notificationsRoutes = require('./notificationsRoutes');

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
      projects: '/api/projects',
      tasks: '/api/tasks',
      messages: '/api/messages',
      notifications: '/api/notifications',
    },
  });
});

// Mount modular sub-routers
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/organizations', organizationsRoutes);
router.use('/projects', projectsRoutes);
router.use('/tasks', tasksRoutes);
router.use('/messages', messagesRoutes);
router.use('/notifications', notificationsRoutes);

module.exports = router;
