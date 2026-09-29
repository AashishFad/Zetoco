const express = require('express');
const { getHealth, getFullHealth } = require('../controllers/healthController');

const router = express.Router();

// GET /api/health - Basic health check
router.get('/', getHealth);

// GET /api/health/full - Comprehensive health check including database status
router.get('/full', getFullHealth);

module.exports = router;
