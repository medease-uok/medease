const express = require('express')
const router = express.Router()
const { search, getCategories } = require('../controllers/icd10.controller')
const authenticate = require('../middleware/authenticate')
const authorize = require('../middleware/authorize')

router.use(authenticate)
router.use(authorize('doctor', 'admin', 'nurse'))

router.get('/search', search)
router.get('/categories', getCategories)

module.exports = router
