const express = require('express')
const router = express.Router()
const { search, getCategories } = require('../controllers/icd10.controller')
const authenticate = require('../middleware/authenticate')

router.use(authenticate)

router.get('/search', search)
router.get('/categories', getCategories)

module.exports = router
