const express = require('express')
const router = express.Router()
const { search, getCategories } = require('../controllers/medicines.controller')
const authenticate = require('../middleware/authenticate')
const { sensitiveDataLimiter } = require('../middleware/rateLimit')

router.use(authenticate)

router.get('/search', sensitiveDataLimiter, search)
router.get('/categories', getCategories)

module.exports = router
