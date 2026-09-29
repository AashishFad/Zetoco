/**
 * Authentication Route Placeholders (Phase 2)
 */
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Auth module is scheduled for Phase 2',
  });
});

module.exports = router;
