/**
 * Messages Route Placeholders
 */
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Messages module is scheduled for future phases',
  });
});

module.exports = router;
