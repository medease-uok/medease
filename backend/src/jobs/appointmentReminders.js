const cron = require('node-cron')
const db = require('../config/database')
const config = require('../config')
const { sendAppointmentReminderEmail } = require('../utils/emailService')
const { createNotification } = require('../controllers/notifications.controller')

/**
 * Finds upcoming appointments that need reminders and sends them.
 *
 * For each configured `hoursBefore` window (e.g. 24h and 1h), the job:
 *  1. Queries appointments in the time window that haven't had a reminder sent yet
 *  2. Sends an email reminder to the patient
 *  3. Creates an in-app notification for the patient
 *  4. Records the reminder in `appointment_reminders` to prevent duplicates
 */
async function processReminders() {
  const { hoursBefore } = config.reminders

  for (const hours of hoursBefore) {
    try {
      await processReminderWindow(hours)
    } catch (err) {
      console.error(`[Reminders] Error processing ${hours}h window:`, err.message)
    }
  }
}

async function processReminderWindow(hours) {
  // Find appointments scheduled within the reminder window that:
  //  - Are still 'scheduled' or 'confirmed'
  //  - Haven't already had this reminder sent
  //  - Are within the time window: now + hours ± tolerance
  //
  // Tolerance is half the cron interval (5 min default → 2.5 min each side)
  // to avoid missing appointments between cron ticks.
  const toleranceMinutes = 5

  const result = await db.query(
    `SELECT
       a.id AS appointment_id,
       a.scheduled_at,
       a.notes,
       pu.email AS patient_email,
       pu.first_name AS patient_first_name,
       pu.last_name AS patient_last_name,
       pu.id AS patient_user_id,
       du.first_name AS doctor_first_name,
       du.last_name AS doctor_last_name,
       d.specialization
     FROM appointments a
     JOIN patients p ON a.patient_id = p.id
     JOIN users pu ON p.user_id = pu.id
     JOIN doctors d ON a.doctor_id = d.id
     JOIN users du ON d.user_id = du.id
     WHERE a.status IN ('scheduled', 'confirmed')
       AND a.scheduled_at BETWEEN NOW() + make_interval(hours => $1) - make_interval(mins => $2)
                               AND NOW() + make_interval(hours => $1) + make_interval(mins => $2)
       AND NOT EXISTS (
         SELECT 1 FROM appointment_reminders ar
         WHERE ar.appointment_id = a.id
           AND ar.hours_before = $1
           AND ar.reminder_type = 'email'
       )
     ORDER BY a.scheduled_at ASC
     LIMIT 50`,
    [hours, toleranceMinutes]
  )

  if (result.rows.length === 0) return

  console.log(`[Reminders] Found ${result.rows.length} appointments for ${hours}h reminder`)

  for (const row of result.rows) {
    await sendReminder(row, hours)
  }
}

async function sendReminder(row, hours) {
  const patientName = `${row.patient_first_name} ${row.patient_last_name}`
  const doctorName = `Dr. ${row.doctor_first_name} ${row.doctor_last_name}`
  const timeUntil = hours >= 24
    ? `${Math.round(hours / 24)} day(s)`
    : `${hours} hour(s)`

  // Send email reminder
  if (row.patient_email) {
    try {
      await sendAppointmentReminderEmail(row.patient_email, {
        patientName,
        doctorName,
        specialization: row.specialization || '',
        scheduledAt: row.scheduled_at,
        appointmentId: row.appointment_id,
        hoursBefore: hours,
      })
    } catch (err) {
      console.error(`[Reminders] Failed to email ${row.appointment_id}:`, err.message)
      // Don't record the reminder if email failed — retry on next tick
      return
    }
  }

  // Record that this email reminder was sent
  try {
    await db.query(
      `INSERT INTO appointment_reminders (appointment_id, reminder_type, hours_before)
       VALUES ($1, 'email', $2)
       ON CONFLICT (appointment_id, reminder_type, hours_before) DO NOTHING`,
      [row.appointment_id, hours]
    )
  } catch (err) {
    console.error(`[Reminders] Failed to record reminder for ${row.appointment_id}:`, err.message)
  }

  // Send in-app notification
  const dateStr = new Date(row.scheduled_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    timeZone: 'Asia/Colombo',
  })
  const timeStr = new Date(row.scheduled_at).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: 'Asia/Colombo',
  })

  createNotification({
    recipientId: row.patient_user_id,
    type: 'appointment_reminder',
    title: 'Appointment Reminder',
    message: `Your appointment with ${doctorName} is in ${timeUntil} (${dateStr} at ${timeStr}).`,
    referenceId: row.appointment_id,
    referenceType: 'appointment',
  })

  // Record that this notification reminder was sent
  try {
    await db.query(
      `INSERT INTO appointment_reminders (appointment_id, reminder_type, hours_before)
       VALUES ($1, 'notification', $2)
       ON CONFLICT (appointment_id, reminder_type, hours_before) DO NOTHING`,
      [row.appointment_id, hours]
    )
  } catch (err) {
    // Non-critical — notification was already sent
    console.error(`[Reminders] Failed to record notification reminder for ${row.appointment_id}:`, err.message)
  }
}

/**
 * Starts the appointment reminder cron job.
 * Called once from the backend entry point.
 */
function startReminderScheduler() {
  if (!config.reminders.enabled) {
    console.log('[Reminders] Scheduler disabled via REMINDER_ENABLED=false')
    return
  }

  const schedule = config.reminders.cronSchedule
  if (!cron.validate(schedule)) {
    console.error(`[Reminders] Invalid cron schedule: ${schedule}`)
    return
  }

  console.log(`[Reminders] Scheduler started (schedule: ${schedule}, windows: ${config.reminders.hoursBefore.join('h, ')}h)`)

  cron.schedule(schedule, async () => {
    try {
      await processReminders()
    } catch (err) {
      console.error('[Reminders] Unhandled error in reminder job:', err.message)
    }
  })
}

module.exports = { startReminderScheduler, processReminders, processReminderWindow, sendReminder }
