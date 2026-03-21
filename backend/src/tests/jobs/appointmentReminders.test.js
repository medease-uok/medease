const mockQuery = jest.fn();
const mockSchedule = jest.fn();
const mockValidate = jest.fn(() => true);

jest.mock('../../config/database', () => ({
  query: (...args) => mockQuery(...args),
}));

jest.mock('node-cron', () => ({
  schedule: (...args) => mockSchedule(...args),
  validate: (...args) => mockValidate(...args),
}));

jest.mock('../../utils/emailService', () => ({
  sendAppointmentReminderEmail: jest.fn().mockResolvedValue({ messageId: 'msg-1' }),
}));

jest.mock('../../controllers/notifications.controller', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
}));

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
}));

const { sendAppointmentReminderEmail } = require('../../utils/emailService');
const { createNotification } = require('../../controllers/notifications.controller');
const { processReminders, processReminderWindow, sendReminder, startReminderScheduler } = require('../../jobs/appointmentReminders');

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
};

beforeEach(() => {
  mockQuery.mockReset();
  mockSchedule.mockReset();
  mockValidate.mockReset().mockReturnValue(true);
  sendAppointmentReminderEmail.mockClear();
  createNotification.mockClear();
});

// ──────────────────────────────────────────────────────────────
// startReminderScheduler
// ──────────────────────────────────────────────────────────────
describe('startReminderScheduler', () => {
  test('registers a cron job with the configured schedule', () => {
    startReminderScheduler();
    expect(mockSchedule).toHaveBeenCalledWith('*/5 * * * *', expect.any(Function));
  });

  test('does not start if config.reminders.enabled is false', () => {
    const config = require('../../config');
    config.reminders.enabled = false;

    startReminderScheduler();
    expect(mockSchedule).not.toHaveBeenCalled();

    config.reminders.enabled = true;
  });

  test('does not start if cron schedule is invalid', () => {
    mockValidate.mockReturnValue(false);
    startReminderScheduler();
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  test('does not start if hoursBefore is empty', () => {
    const config = require('../../config');
    const original = config.reminders.hoursBefore;
    config.reminders.hoursBefore = [];

    startReminderScheduler();
    expect(mockSchedule).not.toHaveBeenCalled();

    config.reminders.hoursBefore = original;
  });
});

// ──────────────────────────────────────────────────────────────
// processReminderWindow
// ──────────────────────────────────────────────────────────────
describe('processReminderWindow', () => {
  test('queries with tolerance derived from cron interval', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await processReminderWindow(24);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('appointment_reminders');
    // tolerance = 5 (from */5 cron), BATCH_SIZE = 50, offset = 0
    expect(params).toEqual([24, 5, 50, 0]);
  });

  test('sends reminder for each matching appointment', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [SAMPLE_ROW] }) // find appointments (batch 1)
      .mockResolvedValueOnce({ rows: [] }) // record email reminder
      .mockResolvedValueOnce({ rows: [] }); // record notification reminder

    await processReminderWindow(24);

    expect(sendAppointmentReminderEmail).toHaveBeenCalledWith(
      'john@example.com',
      expect.objectContaining({
        patientName: 'John Doe',
        doctorName: 'Dr. Kamal Perera',
        specialization: 'Cardiology',
        appointmentId: 'appt-1',
        hoursBefore: 24,
      })
    );
  });

  test('does nothing when no appointments found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await processReminderWindow(1);

    expect(sendAppointmentReminderEmail).not.toHaveBeenCalled();
    expect(createNotification).not.toHaveBeenCalled();
  });

  test('paginates through multiple batches', async () => {
    // First batch: 50 rows (full batch triggers another query)
    const fullBatch = Array.from({ length: 50 }, (_, i) => ({
      ...SAMPLE_ROW,
      appointment_id: `appt-${i}`,
    }));

    // Default mock returns empty for all insert calls
    mockQuery.mockResolvedValue({ rows: [] });
    // Override first call: batch 1 returns full batch
    mockQuery.mockResolvedValueOnce({ rows: fullBatch });

    await processReminderWindow(24);

    // Find the SELECT queries (contain FROM appointments)
    const selectCalls = mockQuery.mock.calls.filter(([sql]) =>
      sql.includes('FROM appointments')
    );
    expect(selectCalls.length).toBeGreaterThanOrEqual(2);
    // Second SELECT should have offset = 50
    expect(selectCalls[1][1][3]).toBe(50);
  });
});

// ──────────────────────────────────────────────────────────────
// sendReminder
// ──────────────────────────────────────────────────────────────
describe('sendReminder', () => {
  test('sends email and creates notification independently', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    await sendReminder(SAMPLE_ROW, 24);

    expect(sendAppointmentReminderEmail).toHaveBeenCalledWith(
      'john@example.com',
      expect.objectContaining({
        patientName: 'John Doe',
        doctorName: 'Dr. Kamal Perera',
        hoursBefore: 24,
      })
    );

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: 'usr-pat-1',
        type: 'appointment_reminder',
        title: 'Appointment Reminder',
        referenceId: 'appt-1',
        referenceType: 'appointment',
      })
    );
  });

  test('records both email and notification reminders in DB', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    await sendReminder(SAMPLE_ROW, 1);

    const insertCalls = mockQuery.mock.calls.filter(([sql]) =>
      sql.includes('INSERT INTO appointment_reminders')
    );
    expect(insertCalls).toHaveLength(2);
    expect(insertCalls[0][1]).toEqual(['appt-1', 1]);
    expect(insertCalls[1][1]).toEqual(['appt-1', 1]);
  });

  test('still sends notification when email fails', async () => {
    sendAppointmentReminderEmail.mockRejectedValueOnce(new Error('SMTP down'));
    mockQuery.mockResolvedValue({ rows: [] });

    await sendReminder(SAMPLE_ROW, 24);

    // Email failed — should NOT record email reminder
    const emailInserts = mockQuery.mock.calls.filter(([sql]) =>
      sql.includes("'email'")
    );
    expect(emailInserts).toHaveLength(0);

    // Notification should still be sent
    expect(createNotification).toHaveBeenCalled();

    // Notification reminder should be recorded
    const notifInserts = mockQuery.mock.calls.filter(([sql]) =>
      sql.includes("'notification'")
    );
    expect(notifInserts).toHaveLength(1);
  });

  test('still sends email when notification fails', async () => {
    createNotification.mockRejectedValueOnce(new Error('DB error'));
    mockQuery.mockResolvedValue({ rows: [] });

    await sendReminder(SAMPLE_ROW, 24);

    // Email should have been sent and recorded
    expect(sendAppointmentReminderEmail).toHaveBeenCalled();
    const emailInserts = mockQuery.mock.calls.filter(([sql]) =>
      sql.includes("'email'")
    );
    expect(emailInserts).toHaveLength(1);
  });

  test('skips email for patient without email address', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const rowNoEmail = { ...SAMPLE_ROW, patient_email: null };

    await sendReminder(rowNoEmail, 24);

    expect(sendAppointmentReminderEmail).not.toHaveBeenCalled();
    // Should still create notification
    expect(createNotification).toHaveBeenCalled();
  });

  test('uses correct time description for hours < 24', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    await sendReminder(SAMPLE_ROW, 1);

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('1 hour(s)'),
      })
    );
  });

  test('uses day description for hours >= 24', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    await sendReminder(SAMPLE_ROW, 24);

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('1 day(s)'),
      })
    );
  });
});

// ──────────────────────────────────────────────────────────────
// processReminders
// ──────────────────────────────────────────────────────────────
describe('processReminders', () => {
  test('processes all configured hour windows', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    await processReminders();

    // Should query for both 24h and 1h windows
    expect(mockQuery).toHaveBeenCalledTimes(2);
    expect(mockQuery.mock.calls[0][1][0]).toBe(24);
    expect(mockQuery.mock.calls[1][1][0]).toBe(1);
  });

  test('continues processing other windows if one fails', async () => {
    mockQuery
      .mockRejectedValueOnce(new Error('DB error'))
      .mockResolvedValueOnce({ rows: [] });

    await processReminders();

    expect(mockQuery).toHaveBeenCalledTimes(2);
  });
});
