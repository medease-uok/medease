const express = require('express')
const router = express.Router()
const { getAll, create, update, remove, reorder } = require('../controllers/doctorTasks.controller')
const authenticate = require('../middleware/authenticate')
const authorize = require('../middleware/authorize')
const validate = require('../middleware/validate')
const {
  createTaskValidation,
  updateTaskValidation,
  taskIdValidation,
  reorderValidation,
} = require('../validators/doctorTasks.validators')

router.use(authenticate)
router.use(authorize('doctor'))

router.get('/', getAll)
router.post('/', validate(createTaskValidation), create)
router.patch('/:id', validate(updateTaskValidation), update)
router.delete('/:id', validate(taskIdValidation), remove)
router.put('/reorder', validate(reorderValidation), reorder)

module.exports = router
