const cron = require('node-cron');
const db = require('../config/database');
const config = require('../config');
const { sendAppointmentReminderEmail } = require('../utils/emailService');
const { createNotification } = require('../controllers/notifications.controller');

const BATCH_SIZE = 50;

/**
 * Parses a simple cron expression and returns the interval in minutes.
 * Handles common patterns like * /N (every N minutes) and falls back to a default.
 */
function deriveCronIntervalMinutes(cronExpression) {
  const parts = cronExpression.trim().split(/\s+/);
  const minuteField = parts[0];

  // */N pattern (e.g. */5 = every 5 minutes)
  const stepMatch = minuteField.match(/^\*\/(\d+)$/);
  if (stepMatch) return parseInt(stepMatch[1], 10);

  // Single number means once per hour — use 60
  if (/^\d+$/.test(minuteField)) return 60;

  // Fallback for complex expressions
  return 5;
}

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
  const { hoursBefore } = config.reminders;

  for (const hours of hoursBefore) {
    try {
      await processReminderWindow(hours);
    } catch (err) {
      console.error(`[Reminders] Error processing ${hours}h window:`, err.message);
    }
  }
}

async function processReminderWindow(hours) {
  // Tolerance is derived from cron interval to avoid missing appointments between ticks.
  const toleranceMinutes = deriveCronIntervalMinutes(config.reminders.cronSchedule);

  // Process in batches to handle high-volume windows
  let offset = 0;
  let processed = 0;

  while (true) {
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
       WHERE a.status = 'scheduled'
         AND a.scheduled_at BETWEEN NOW() + make_interval(hours => $1) - make_interval(mins => $2)
                                 AND NOW() + make_interval(hours => $1) + make_interval(mins => $2)
         AND NOT EXISTS (
           SELECT 1 FROM appointment_reminders ar
           WHERE ar.appointment_id = a.id
             AND ar.hours_before = $1
             AND ar.reminder_type = 'email'
         )
       ORDER BY a.scheduled_at ASC
       LIMIT $3 OFFSET $4`,
      [hours, toleranceMinutes, BATCH_SIZE, offset]
    );

    if (result.rows.length === 0) break;

    if (offset === 0) {
      console.log(`[Reminders] Processing ${hours}h reminder window`);
    }

    for (const row of result.rows) {
      await sendReminder(row, hours);
    }

    processed += result.rows.length;
    if (result.rows.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }

  if (processed > 0) {
    console.log(`[Reminders] Sent ${processed} reminders for ${hours}h window`);
  }
}

async function sendReminder(row, hours) {
  const patientName = `${row.patient_first_name} ${row.patient_last_name}`;
  const doctorName = `Dr. ${row.doctor_first_name} ${row.doctor_last_name}`;
  const timeUntil = hours >= 24
    ? `${Math.round(hours / 24)} day(s)`
    : `${hours} hour(s)`;

  const dateStr = new Date(row.scheduled_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    timeZone: 'Asia/Colombo',
  });
  const timeStr = new Date(row.scheduled_at).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: 'Asia/Colombo',
  });

  // Send email reminder (independent of notification)
  let emailSent = false;
  if (row.patient_email) {
    try {
      await sendAppointmentReminderEmail(row.patient_email, {
        patientName,
        doctorName,
        specialization: row.specialization || '',
        scheduledAt: row.scheduled_at,
        appointmentId: row.appointment_id,
        hoursBefore: hours,
      });
      emailSent = true;
    } catch (err) {
      console.error(`[Reminders] Failed to email ${row.appointment_id}:`, err.message);
    }
  }

  // Record email reminder if sent
  if (emailSent) {
    try {
      await db.query(
        `INSERT INTO appointment_reminders (appointment_id, reminder_type, hours_before)
         VALUES ($1, 'email', $2)
         ON CONFLICT (appointment_id, reminder_type, hours_before) DO NOTHING`,
        [row.appointment_id, hours]
      );
    } catch (err) {
      console.error(`[Reminders] Failed to record email reminder for ${row.appointment_id}:`, err.message);
    }
  }

  // Send in-app notification (independent of email)
  try {
    await createNotification({
      recipientId: row.patient_user_id,
      type: 'appointment_reminder',
      title: 'Appointment Reminder',
      message: `Your appointment with ${doctorName} is in ${timeUntil} (${dateStr} at ${timeStr}).`,
      referenceId: row.appointment_id,
      referenceType: 'appointment',
    });

    await db.query(
      `INSERT INTO appointment_reminders (appointment_id, reminder_type, hours_before)
       VALUES ($1, 'notification', $2)
       ON CONFLICT (appointment_id, reminder_type, hours_before) DO NOTHING`,
      [row.appointment_id, hours]
    );
  } catch (err) {
    console.error(`[Reminders] Failed to create notification for ${row.appointment_id}:`, err.message);
  }
}

/**
 * Starts the appointment reminder cron job.
 * Called once from the backend entry point.
 */
function startReminderScheduler() {
  if (!config.reminders.enabled) {
    console.log('[Reminders] Scheduler disabled via REMINDER_ENABLED=false');
    return;
  }

  const { hoursBefore } = config.reminders;
  if (hoursBefore.length === 0) {
    console.warn('[Reminders] No valid REMINDER_HOURS_BEFORE values configured — scheduler disabled');
    return;
  }

  const schedule = config.reminders.cronSchedule;
  if (!cron.validate(schedule)) {
    console.error(`[Reminders] Invalid cron schedule: "${schedule}" — scheduler disabled`);
    return;
  }

  console.log(`[Reminders] Scheduler started (schedule: ${schedule}, windows: ${hoursBefore.join('h, ')}h)`);

  cron.schedule(schedule, async () => {
    try {
      await processReminders();
    } catch (err) {
      console.error('[Reminders] Unhandled error in reminder job:', err.message);
    }
  });
}

module.exports = { startReminderScheduler, processReminders, processReminderWindow, sendReminder };
