const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { upload } = require('../middleware/upload');
const { getMe, updateMe, uploadProfileImage, deleteProfileImage } = require('../controllers/profile.controller');

router.use(authenticate);

router.get('/me', getMe);
router.patch('/me', updateMe);
router.post('/me/image', upload.single('profileImage'), uploadProfileImage);
router.delete('/me/image', deleteProfileImage);

module.exports = router;
