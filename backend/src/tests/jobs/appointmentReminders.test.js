const mockQuery = jest.fn()
const mockSchedule = jest.fn()
const mockValidate = jest.fn(() => true)

jest.mock('../../config/database', () => ({
  query: (...args) => mockQuery(...args),
}))

jest.mock('node-cron', () => ({
  schedule: (...args) => mockSchedule(...args),
  validate: (...args) => mockValidate(...args),
}))

jest.mock('../../utils/emailService', () => ({
  sendAppointmentReminderEmail: jest.fn().mockResolvedValue({ messageId: 'msg-1' }),
}))

jest.mock('../../controllers/notifications.controller', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../../config', () => ({
  reminders: {
    enabled: true,
    hoursBefore: [24, 1],
    cronSchedule: '*/5 * * * *',
  },
  smtp: {
    host: 'smtp.test.com',
    port: 587,
    secure: false,
    user: 'test@test.com',
    pass: 'pass',
    from: '"MedEase" <test@test.com>',
  },
}))

const { sendAppointmentReminderEmail } = require('../../utils/emailService')
const { createNotification } = require('../../controllers/notifications.controller')
const { processReminders, processReminderWindow, sendReminder, startReminderScheduler } = require('../../jobs/appointmentReminders')

const SAMPLE_ROW = {
  appointment_id: 'appt-1',
  scheduled_at: '2026-03-22T09:00:00Z',
  notes: null,
  patient_email: 'john@example.com',
  patient_first_name: 'John',
  patient_last_name: 'Doe',
  patient_user_id: 'usr-pat-1',
  doctor_first_name: 'Kamal',
  doctor_last_name: 'Perera',
  specialization: 'Cardiology',
}

beforeEach(() => {
  mockQuery.mockReset()
  mockSchedule.mockReset()
  mockValidate.mockReset().mockReturnValue(true)
  sendAppointmentReminderEmail.mockClear()
  createNotification.mockClear()
})

// ──────────────────────────────────────────────────────────────
// startReminderScheduler
// ──────────────────────────────────────────────────────────────
describe('startReminderScheduler', () => {
  test('registers a cron job with the configured schedule', () => {
    startReminderScheduler()
    expect(mockSchedule).toHaveBeenCalledWith('*/5 * * * *', expect.any(Function))
  })

  test('does not start if config.reminders.enabled is false', () => {
    const config = require('../../config')
    config.reminders.enabled = false

    startReminderScheduler()
    expect(mockSchedule).not.toHaveBeenCalled()

    // Restore
    config.reminders.enabled = true
  })

  test('does not start if cron schedule is invalid', () => {
    mockValidate.mockReturnValue(false)
    startReminderScheduler()
    expect(mockSchedule).not.toHaveBeenCalled()
  })
})

// ──────────────────────────────────────────────────────────────
// processReminderWindow
// ──────────────────────────────────────────────────────────────
describe('processReminderWindow', () => {
  test('queries for appointments in the given hour window', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })

    await processReminderWindow(24)

    expect(mockQuery).toHaveBeenCalledTimes(1)
    const [sql, params] = mockQuery.mock.calls[0]
    expect(sql).toContain('appointment_reminders')
    expect(params).toEqual([24, 5])
  })

  test('sends reminder for each matching appointment', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [SAMPLE_ROW] }) // find appointments
      .mockResolvedValueOnce({ rows: [] }) // record email reminder
      .mockResolvedValueOnce({ rows: [] }) // record notification reminder

    await processReminderWindow(24)

    expect(sendAppointmentReminderEmail).toHaveBeenCalledWith(
      'john@example.com',
      expect.objectContaining({
        patientName: 'John Doe',
        doctorName: 'Dr. Kamal Perera',
        specialization: 'Cardiology',
        appointmentId: 'appt-1',
        hoursBefore: 24,
      })
    )
  })

  test('does nothing when no appointments found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })

    await processReminderWindow(1)

    expect(sendAppointmentReminderEmail).not.toHaveBeenCalled()
    expect(createNotification).not.toHaveBeenCalled()
  })
})

// ──────────────────────────────────────────────────────────────
// sendReminder
// ──────────────────────────────────────────────────────────────
describe('sendReminder', () => {
  test('sends email and creates notification', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    await sendReminder(SAMPLE_ROW, 24)

    expect(sendAppointmentReminderEmail).toHaveBeenCalledWith(
      'john@example.com',
      expect.objectContaining({
        patientName: 'John Doe',
        doctorName: 'Dr. Kamal Perera',
        hoursBefore: 24,
      })
    )

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: 'usr-pat-1',
        type: 'appointment_reminder',
        title: 'Appointment Reminder',
        referenceId: 'appt-1',
        referenceType: 'appointment',
      })
    )
  })

  test('records both email and notification reminders in DB', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    await sendReminder(SAMPLE_ROW, 1)

    // Should insert two records: email + notification
    const insertCalls = mockQuery.mock.calls.filter(([sql]) =>
      sql.includes('INSERT INTO appointment_reminders')
    )
    expect(insertCalls).toHaveLength(2)
    expect(insertCalls[0][1]).toEqual(['appt-1', 1])
    expect(insertCalls[1][1]).toEqual(['appt-1', 1])
  })

  test('does not record reminder or send notification if email fails', async () => {
    sendAppointmentReminderEmail.mockRejectedValueOnce(new Error('SMTP down'))

    await sendReminder(SAMPLE_ROW, 24)

    // Should not record reminder or create notification
    expect(mockQuery).not.toHaveBeenCalled()
    expect(createNotification).not.toHaveBeenCalled()
  })

  test('skips email for patient without email address', async () => {
    mockQuery.mockResolvedValue({ rows: [] })
    const rowNoEmail = { ...SAMPLE_ROW, patient_email: null }

    await sendReminder(rowNoEmail, 24)

    expect(sendAppointmentReminderEmail).not.toHaveBeenCalled()
    // Should still record and notify
    expect(createNotification).toHaveBeenCalled()
  })

  test('uses correct time description for hours < 24', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    await sendReminder(SAMPLE_ROW, 1)

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('1 hour(s)'),
      })
    )
  })

  test('uses day description for hours >= 24', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    await sendReminder(SAMPLE_ROW, 24)

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('1 day(s)'),
      })
    )
  })
})

// ──────────────────────────────────────────────────────────────
// processReminders
// ──────────────────────────────────────────────────────────────
describe('processReminders', () => {
  test('processes all configured hour windows', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    await processReminders()

    // Should query for both 24h and 1h windows
    expect(mockQuery).toHaveBeenCalledTimes(2)
    expect(mockQuery.mock.calls[0][1][0]).toBe(24)
    expect(mockQuery.mock.calls[1][1][0]).toBe(1)
  })

  test('continues processing other windows if one fails', async () => {
    mockQuery
      .mockRejectedValueOnce(new Error('DB error')) // 24h window fails
      .mockResolvedValueOnce({ rows: [] }) // 1h window succeeds

    await processReminders()

    // Should still process the second window
    expect(mockQuery).toHaveBeenCalledTimes(2)
  })
})
