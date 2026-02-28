const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to MedEase API',
    version: 'v1',
  });
});

router.use('/auth', authRoutes);

module.exports = router;
