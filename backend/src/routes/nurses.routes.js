const express = require('express')
const router = express.Router()
const { getStatistics } = require('../controllers/nurses.controller')
const authenticate = require('../middleware/authenticate')
const authorize = require('../middleware/authorize')
const resolveSubject = require('../middleware/resolveSubject')

router.use(authenticate)
router.use(resolveSubject)

router.get('/statistics', authorize('admin'), getStatistics)

module.exports = router
