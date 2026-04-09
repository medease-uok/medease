const express = require('express')
const router = express.Router()
const { getStatistics, getCareNotes, addCareNote, updateCareNote, deleteCareNote } = require('../controllers/nurses.controller')
const authenticate = require('../middleware/authenticate')
const authorize = require('../middleware/authorize')
const resolveSubject = require('../middleware/resolveSubject')
const resolveNurse = require('../middleware/resolveNurse')

router.use(authenticate)
router.use(resolveSubject)

router.get('/statistics', authorize('admin'), getStatistics)

// Care Notes (nurse-only, per patient)
router.get('/me/care-notes/:patientId', authorize('nurse'), resolveNurse, getCareNotes)
router.post('/me/care-notes/:patientId', authorize('nurse'), resolveNurse, addCareNote)
router.patch('/me/care-notes/:noteId', authorize('nurse'), resolveNurse, updateCareNote)
router.delete('/me/care-notes/:noteId', authorize('nurse'), resolveNurse, deleteCareNote)

module.exports = router
