const { body, param, query } = require('express-validator')

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

const upsertScheduleValidation = [
  param('doctorId')
    .matches(UUID_REGEX).withMessage('Invalid doctor ID format.'),
  body('schedule')
    .isArray({ min: 1, max: 7 }).withMessage('Schedule must be an array of 1-7 day entries.'),
  body('schedule.*.dayOfWeek')
    .isInt({ min: 0, max: 6 }).withMessage('dayOfWeek must be an integer between 0 (Sun) and 6 (Sat).'),
  body('schedule.*.startTime')
    .matches(TIME_REGEX).withMessage('startTime must be in HH:MM format (24h).'),
  body('schedule.*.endTime')
    .matches(TIME_REGEX).withMessage('endTime must be in HH:MM format (24h).')
    .custom((value, { req, path }) => {
      const idx = path.match(/\[(\d+)]/)[1]
      const startTime = req.body.schedule[idx]?.startTime
      if (startTime && value <= startTime) {
        throw new Error('endTime must be after startTime.')
      }
      return true
    }),
  body('schedule.*.isActive')
    .isBoolean().withMessage('isActive must be true or false.'),
]

const getDoctorIdValidation = [
  param('doctorId')
    .matches(UUID_REGEX).withMessage('Invalid doctor ID format.'),
]

const getSlotsValidation = [
  param('doctorId')
    .matches(UUID_REGEX).withMessage('Invalid doctor ID format.'),
  query('date')
    .isISO8601().withMessage('date must be a valid ISO 8601 date (YYYY-MM-DD).'),
]

module.exports = {
  upsertScheduleValidation,
  getDoctorIdValidation,
  getSlotsValidation,
}
