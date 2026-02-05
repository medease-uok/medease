const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to MedEase API',
    version: 'v1',
  });
});

module.exports = router;
