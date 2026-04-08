const express = require('express');
const router = express.Router();
const { getAll, create, update, remove, reorder } = require('../controllers/nurseTasks.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const resolveNurse = require('../middleware/resolveNurse');
const validate = require('../middleware/validate');
const {
  createTaskValidation,
  updateTaskValidation,
  taskIdValidation,
  reorderValidation,
} = require('../validators/nurseTasks.validators');
const rateLimit = require('express-rate-limit');

const nurseTasksLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each nurse to 100 requests per windowMs for these routes
});

// Protect the entire router with rate limiting as the first priority
router.use(nurseTasksLimiter);
router.use(authenticate, authorize('nurse'), resolveNurse);
router.get('/', getAll);
router.post('/', validate(createTaskValidation), create);
router.put('/reorder', validate(reorderValidation), reorder);
router.patch('/:id', validate(updateTaskValidation), update);
router.delete('/:id', validate(taskIdValidation), remove);

module.exports = router;
