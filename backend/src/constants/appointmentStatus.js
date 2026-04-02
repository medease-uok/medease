/**
 * Appointment status constants
 * Matches the appointment_status enum in the database
 */
const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
}

/**
 * Statuses that represent "active" appointments (not cancelled or no-show)
 */
const ACTIVE_STATUSES = [
  APPOINTMENT_STATUS.SCHEDULED,
  APPOINTMENT_STATUS.IN_PROGRESS,
  APPOINTMENT_STATUS.COMPLETED,
]

/**
 * Statuses that represent "inactive" appointments
 */
const INACTIVE_STATUSES = [
  APPOINTMENT_STATUS.CANCELLED,
  APPOINTMENT_STATUS.NO_SHOW,
]

/**
 * Valid statuses for appointment status updates (via updateStatus endpoint)
 */
const UPDATEABLE_STATUSES = [
  APPOINTMENT_STATUS.IN_PROGRESS,
  APPOINTMENT_STATUS.COMPLETED,
  APPOINTMENT_STATUS.CANCELLED,
]

module.exports = {
  APPOINTMENT_STATUS,
  ACTIVE_STATUSES,
  INACTIVE_STATUSES,
  UPDATEABLE_STATUSES,
}
