/**
 * Tasks Route Placeholders
 */
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Tasks module is scheduled for future phases',
  });
});

module.exports = router;
