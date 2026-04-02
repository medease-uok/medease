const mockQuery = jest.fn()
const mockClientQuery = jest.fn()
const mockClientRelease = jest.fn()
const mockGetClient = jest.fn(() => ({ query: mockClientQuery, release: mockClientRelease }))

jest.mock('../../config/database', () => ({
  query: (...args) => mockQuery(...args),
  getClient: () => mockGetClient(),
}))

jest.mock('../../utils/auditLog', () => jest.fn().mockResolvedValue(undefined))
jest.mock('../../utils/abac', () => ({
  buildAccessFilter: jest.fn().mockResolvedValue({ clause: 'TRUE', params: [] }),
}))
jest.mock('../../controllers/notifications.controller', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('../../utils/emailService', () => ({
  sendAppointmentConfirmationEmail: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('../../controllers/waitlist.controller', () => ({
  notifyWaitlistOnCancellation: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('../../config', () => ({
  cancellationPolicy: {
    patientMinHoursBefore: 24,
    doctorMinHoursBefore: 2,
    adminBypassPolicy: true,
    nurseBypassPolicy: true,
  },
}))

const { sendAppointmentConfirmationEmail } = require('../../utils/emailService')
const { getAll, getById, create, updateStatus, cancelAppointment, reschedule, markNoShow, massReschedule } = require('../../controllers/appointments.controller')

function makeReq(overrides = {}) {
  return {
    user: { id: 'usr-doc', role: 'doctor', doctorId: 'doc-1', patientId: null },
    params: {},
    body: {},
    query: {},
    ip: '127.0.0.1',
    ...overrides,
  }
}

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  }
}

beforeEach(() => {
  mockQuery.mockReset()
  mockClientQuery.mockReset()
  mockClientRelease.mockReset()
  mockGetClient.mockReset()
  mockGetClient.mockImplementation(() => ({ query: mockClientQuery, release: mockClientRelease }))
  sendAppointmentConfirmationEmail.mockClear()
})

// ──────────────────────────────────────────────────────────────
// GET ALL
// ──────────────────────────────────────────────────────────────
describe('getAll', () => {
  test('returns appointment list from query', async () => {
    const rows = [
      {
        id: 'appt-1', patient_id: 'pat-1', doctor_id: 'doc-1',
        scheduled_at: '2026-03-20T09:00:00Z', status: 'scheduled',
        notes: null, patient_name: 'John Doe', doctor_name: 'Dr. Kamal Perera',
      },
    ]
    mockQuery.mockResolvedValue({ rows })

    const req = makeReq()
    const res = makeRes()
    const next = jest.fn()

    await getAll(req, res, next)

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'success', data: expect.any(Array) })
    )
    expect(res.json.mock.calls[0][0].data).toHaveLength(1)
    expect(res.json.mock.calls[0][0].data[0].id).toBe('appt-1')
  })

  test('returns empty array when no appointments', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    const req = makeReq()
    const res = makeRes()
    const next = jest.fn()

    await getAll(req, res, next)

    expect(res.json.mock.calls[0][0].data).toEqual([])
  })

  test('calls next on database error', async () => {
    mockQuery.mockRejectedValue(new Error('DB down'))

    const req = makeReq()
    const res = makeRes()
    const next = jest.fn()

    await getAll(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(Error))
  })
})

// ──────────────────────────────────────────────────────────────
// GET BY ID
// ──────────────────────────────────────────────────────────────
describe('getById', () => {
  const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

  const APPT_ROW = {
    id: VALID_UUID, patient_id: 'pat-1', doctor_id: 'doc-1',
    scheduled_at: '2026-03-20T09:00:00Z', status: 'scheduled',
    notes: null, patient_name: 'John Doe', doctor_name: 'Dr. Kamal Perera',
    specialization: 'Cardiology', department: 'Cardiology',
    created_at: '2026-01-01', updated_at: '2026-01-01',
  }

  test('returns appointment details for admin', async () => {
    mockQuery.mockResolvedValue({ rows: [APPT_ROW] })

    const req = makeReq({ user: { id: 'usr-admin', role: 'admin' }, params: { id: VALID_UUID } })
    const res = makeRes()
    const next = jest.fn()

    await getById(req, res, next)

    expect(res.json.mock.calls[0][0].status).toBe('success')
    expect(res.json.mock.calls[0][0].data.id).toBe(VALID_UUID)
  })

  test('returns 400 for invalid UUID format', async () => {
    const req = makeReq({ params: { id: 'not-a-uuid' } })
    const res = makeRes()
    const next = jest.fn()

    await getById(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('returns 404 when appointment not found', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    const req = makeReq({ params: { id: VALID_UUID } })
    const res = makeRes()
    const next = jest.fn()

    await getById(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
  })

  test('returns 403 when patient tries to view another patient\'s appointment', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ ...APPT_ROW, patient_id: 'pat-other' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'pat-mine' }] })

    const req = makeReq({
      user: { id: 'usr-pat', role: 'patient' },
      params: { id: VALID_UUID },
    })
    const res = makeRes()
    const next = jest.fn()

    await getById(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
  })

  test('returns 403 when doctor tries to view another doctor\'s appointment', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ ...APPT_ROW, doctor_id: 'doc-other' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'doc-mine' }] })

    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor' },
      params: { id: VALID_UUID },
    })
    const res = makeRes()
    const next = jest.fn()

    await getById(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
  })
})

// ──────────────────────────────────────────────────────────────
// CREATE
// ──────────────────────────────────────────────────────────────
describe('create', () => {
  // 2026-03-23T02:30:00Z = Monday 08:00 Asia/Colombo (UTC+5:30), on a valid 20-min slot boundary
  const VALID_SCHEDULED_AT = '2026-03-23T02:30:00Z'

  const SCHEDULE_ROW = { start_time: '08:00:00', end_time: '17:00:00', is_active: true }
  const DOCTOR_ROW = { id: 'doc-1', user_id: 'usr-doc', first_name: 'Kamal', last_name: 'Perera', specialization: 'Cardiology' }
  const PATIENT_ROW = { id: 'pat-1', user_id: 'usr-pat', first_name: 'John', last_name: 'Doe', email: 'john@example.com' }

  beforeEach(() => {
    mockClientQuery.mockReset()
    mockClientRelease.mockReset()
  })

  test('creates appointment for doctor creating on behalf of patient', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [DOCTOR_ROW] })  // doctorCheck
      .mockResolvedValueOnce({ rows: [PATIENT_ROW] }) // patientCheck
    mockClientQuery
      .mockResolvedValueOnce(undefined)                              // BEGIN
      .mockResolvedValueOnce({ rows: [SCHEDULE_ROW] })              // schedule
      .mockResolvedValueOnce({ rows: [{ id: 'appt-new' }] })        // INSERT
      .mockResolvedValueOnce(undefined)                              // COMMIT

    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: 'doc-1' },
      body: { doctorId: 'doc-1', patientId: 'pat-1', scheduledAt: VALID_SCHEDULED_AT },
    })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json.mock.calls[0][0].data.id).toBe('appt-new')

    // Verify confirmation email sent with correct arguments
    expect(sendAppointmentConfirmationEmail).toHaveBeenCalledWith(
      'john@example.com',
      expect.objectContaining({
        patientName: 'John Doe',
        doctorName: 'Dr. Kamal Perera',
        specialization: 'Cardiology',
        scheduledAt: VALID_SCHEDULED_AT,
        appointmentId: 'appt-new',
      })
    )
  })

  test('skips confirmation email when patient has no email', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [DOCTOR_ROW] })
      .mockResolvedValueOnce({ rows: [{ ...PATIENT_ROW, email: null }] })
    mockClientQuery
      .mockResolvedValueOnce(undefined)                              // BEGIN
      .mockResolvedValueOnce({ rows: [SCHEDULE_ROW] })              // schedule
      .mockResolvedValueOnce({ rows: [{ id: 'appt-no-email' }] })   // INSERT
      .mockResolvedValueOnce(undefined)                              // COMMIT

    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: 'doc-1' },
      body: { doctorId: 'doc-1', patientId: 'pat-1', scheduledAt: VALID_SCHEDULED_AT },
    })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(sendAppointmentConfirmationEmail).not.toHaveBeenCalled()
  })

  test('returns 400 when doctor is not available on this day', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [DOCTOR_ROW] })
      .mockResolvedValueOnce({ rows: [PATIENT_ROW] })
    mockClientQuery
      .mockResolvedValueOnce(undefined)          // BEGIN
      .mockResolvedValueOnce({ rows: [] })        // no schedule
      .mockResolvedValueOnce(undefined)           // ROLLBACK

    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: 'doc-1' },
      body: { doctorId: 'doc-1', patientId: 'pat-1', scheduledAt: VALID_SCHEDULED_AT },
    })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('returns 400 when appointment time is outside schedule hours', async () => {
    // 18:00 is outside 08:00-17:00
    mockQuery
      .mockResolvedValueOnce({ rows: [DOCTOR_ROW] })
      .mockResolvedValueOnce({ rows: [PATIENT_ROW] })
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [SCHEDULE_ROW] })
      .mockResolvedValueOnce(undefined) // ROLLBACK

    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: 'doc-1' },
      body: { doctorId: 'doc-1', patientId: 'pat-1', scheduledAt: '2026-03-23T18:00:00Z' },
    })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('returns 400 when appointment time is not on slot boundary', async () => {
    // 08:05 is not a 20-minute boundary
    mockQuery
      .mockResolvedValueOnce({ rows: [DOCTOR_ROW] })
      .mockResolvedValueOnce({ rows: [PATIENT_ROW] })
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [SCHEDULE_ROW] })
      .mockResolvedValueOnce(undefined) // ROLLBACK

    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: 'doc-1' },
      body: { doctorId: 'doc-1', patientId: 'pat-1', scheduledAt: '2026-03-23T08:05:00Z' },
    })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('returns 404 when doctor not found', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })         // doctorCheck empty
      .mockResolvedValueOnce({ rows: [PATIENT_ROW] })

    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: 'doc-1' },
      body: { doctorId: 'doc-notexist', patientId: 'pat-1', scheduledAt: VALID_SCHEDULED_AT },
    })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
  })

  test('returns 404 for patient role without patientId on req.user', async () => {
    const req = makeReq({
      user: { id: 'usr-pat', role: 'patient', patientId: null },
      body: { doctorId: 'doc-1', scheduledAt: VALID_SCHEDULED_AT },
    })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
  })

  test('returns 400 for missing required fields', async () => {
    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: 'doc-1' },
      body: { doctorId: 'doc-1' }, // missing patientId and scheduledAt
    })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('returns 404 when patient not found in database', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [DOCTOR_ROW] }) // doctorCheck succeeds
      .mockResolvedValueOnce({ rows: [] })             // patientCheck empty

    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: 'doc-1' },
      body: { doctorId: 'doc-1', patientId: 'pat-nonexistent', scheduledAt: VALID_SCHEDULED_AT },
    })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
  })

  test('returns error and issues ROLLBACK when INSERT fails (overlapping slot)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [DOCTOR_ROW] })
      .mockResolvedValueOnce({ rows: [PATIENT_ROW] })
    mockClientQuery
      .mockResolvedValueOnce(undefined)               // BEGIN
      .mockResolvedValueOnce({ rows: [SCHEDULE_ROW] }) // schedule check
      .mockRejectedValueOnce(new Error('duplicate key value violates unique constraint')) // INSERT fails
      .mockResolvedValueOnce(undefined)               // ROLLBACK

    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: 'doc-1' },
      body: { doctorId: 'doc-1', patientId: 'pat-1', scheduledAt: VALID_SCHEDULED_AT },
    })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(Error))
    // ROLLBACK must have been issued (4th client.query call)
    const clientCalls = mockClientQuery.mock.calls.map((c) => c[0])
    expect(clientCalls).toContain('ROLLBACK')
  })

  test('releases client even when unexpected DB error occurs', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [DOCTOR_ROW] })
      .mockResolvedValueOnce({ rows: [PATIENT_ROW] })
    mockClientQuery
      .mockResolvedValueOnce(undefined)               // BEGIN
      .mockRejectedValueOnce(new Error('connection reset')) // schedule query fails
      .mockResolvedValueOnce(undefined)               // ROLLBACK

    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: 'doc-1' },
      body: { doctorId: 'doc-1', patientId: 'pat-1', scheduledAt: VALID_SCHEDULED_AT },
    })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(Error))
    expect(mockClientRelease).toHaveBeenCalled()
  })
})

// ──────────────────────────────────────────────────────────────
// UPDATE STATUS
// ──────────────────────────────────────────────────────────────
describe('updateStatus', () => {
  const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

  const APPT_DB = {
    id: VALID_UUID,
    patient_id: 'pat-1', doctor_id: 'doc-1',
    status: 'scheduled',
    patient_user_id: 'usr-pat', doctor_user_id: 'usr-doc',
  }

  test('doctor can mark appointment as completed', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [APPT_DB] })                           // existing
      .mockResolvedValueOnce({ rows: [{ id: 'rec-1' }] })                    // recordCheck (medical_records)
      .mockResolvedValueOnce({ rows: [{ id: VALID_UUID, status: 'completed' }] }) // UPDATE
      .mockResolvedValueOnce({ rows: [{ user_id: 'usr-pat', first_name: 'John' }] }) // patient info
      .mockResolvedValueOnce({ rows: [{ user_id: 'usr-doc', first_name: 'Kamal', last_name: 'Perera' }] }) // doctor info

    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor' },
      params: { id: VALID_UUID },
      body: { status: 'completed' },
    })
    const res = makeRes()
    const next = jest.fn()

    await updateStatus(req, res, next)

    expect(res.json.mock.calls[0][0].data.status).toBe('completed')
  })

  test('patient can only cancel their own appointment', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [APPT_DB] })
      .mockResolvedValueOnce({ rows: [{ id: VALID_UUID, status: 'cancelled' }] })
      .mockResolvedValueOnce({ rows: [{ user_id: 'usr-pat', first_name: 'John' }] })
      .mockResolvedValueOnce({ rows: [{ user_id: 'usr-doc', first_name: 'Kamal', last_name: 'Perera' }] })

    const req = makeReq({
      user: { id: 'usr-pat', role: 'patient' },
      params: { id: VALID_UUID },
      body: { status: 'cancelled' },
    })
    const res = makeRes()
    const next = jest.fn()

    await updateStatus(req, res, next)

    expect(res.json.mock.calls[0][0].data.status).toBe('cancelled')
  })

  test('patient cannot mark appointment as completed', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [APPT_DB] })

    const req = makeReq({
      user: { id: 'usr-pat', role: 'patient' },
      params: { id: VALID_UUID },
      body: { status: 'completed' },
    })
    const res = makeRes()
    const next = jest.fn()

    await updateStatus(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
  })

  test('returns 400 for invalid status value', async () => {
    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor' },
      params: { id: VALID_UUID },
      body: { status: 'rescheduled' },
    })
    const res = makeRes()
    const next = jest.fn()

    await updateStatus(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('returns 404 when appointment not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })

    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor' },
      params: { id: VALID_UUID },
      body: { status: 'completed' },
    })
    const res = makeRes()
    const next = jest.fn()

    await updateStatus(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
  })

  test('returns 403 when unrelated user tries to update', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [APPT_DB] })

    const req = makeReq({
      user: { id: 'usr-unrelated', role: 'nurse' },
      params: { id: VALID_UUID },
      body: { status: 'cancelled' },
    })
    const res = makeRes()
    const next = jest.fn()

    await updateStatus(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
  })
})

// ──────────────────────────────────────────────────────────────
// RESCHEDULE
// ──────────────────────────────────────────────────────────────
describe('reschedule', () => {
  const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  // 2026-06-15T02:30:00Z = Monday 08:00 Asia/Colombo — existing slot (within 1 year)
  const CURRENT_SLOT = '2026-06-15T02:30:00Z'
  // 2026-06-15T02:50:00Z = Monday 08:20 Asia/Colombo — next valid slot
  const NEW_SLOT = '2026-06-15T02:50:00Z'
  const SCHEDULE_ROW = { start_time: '08:00:00', end_time: '17:00:00', is_active: true }

  const APPT_ROW = {
    id: VALID_UUID,
    patient_id: 'pat-1',
    doctor_id: 'doc-1',
    status: 'scheduled',
    scheduled_at: CURRENT_SLOT,
    patient_user_id: 'usr-pat',
    patient_first_name: 'John',
    patient_last_name: 'Doe',
    doctor_user_id: 'usr-doc',
    doctor_department: 'Cardiology',
    doctor_first_name: 'Kamal',
    doctor_last_name: 'Perera',
  }

  beforeEach(() => {
    mockClientQuery.mockReset()
    mockClientRelease.mockReset()
  })

  function mockSuccessfulTransaction(newSlot = NEW_SLOT) {
    mockClientQuery
      .mockResolvedValueOnce(undefined)                                        // BEGIN
      .mockResolvedValueOnce({ rows: [APPT_ROW] })                             // FOR UPDATE
      .mockResolvedValueOnce({ rows: [SCHEDULE_ROW] })                         // schedule
      .mockResolvedValueOnce({ rows: [] })                                      // no conflict
      .mockResolvedValueOnce({ rows: [{ scheduled_at: new Date(newSlot) }] })  // UPDATE RETURNING
      .mockResolvedValueOnce(undefined)                                         // COMMIT
  }

  test('should reschedule appointment and return DB-committed scheduledAt', async () => {
    mockSuccessfulTransaction()

    const req = makeReq({
      user: { id: 'usr-pat', role: 'patient', patientId: 'pat-1' },
      params: { id: VALID_UUID },
      body: { scheduledAt: NEW_SLOT },
    })
    const res = makeRes()
    const next = jest.fn()

    await reschedule(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({
          id: VALID_UUID,
          scheduledAt: new Date(NEW_SLOT).toISOString(),
        }),
      })
    )
  })

  test('should return 400 when new scheduledAt is the same as current', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined)            // BEGIN
      .mockResolvedValueOnce({ rows: [APPT_ROW] }) // FOR UPDATE
      .mockResolvedValueOnce(undefined)             // ROLLBACK

    const req = makeReq({
      user: { id: 'usr-pat', role: 'patient', patientId: 'pat-1' },
      params: { id: VALID_UUID },
      body: { scheduledAt: CURRENT_SLOT },
    })
    const res = makeRes()
    const next = jest.fn()

    await reschedule(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('should return 409 when new slot is already booked by another appointment', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [APPT_ROW] })
      .mockResolvedValueOnce({ rows: [SCHEDULE_ROW] })
      .mockResolvedValueOnce({ rows: [{ id: 'other-appt' }] }) // conflict
      .mockResolvedValueOnce(undefined)                         // ROLLBACK

    const req = makeReq({
      user: { id: 'usr-pat', role: 'patient', patientId: 'pat-1' },
      params: { id: VALID_UUID },
      body: { scheduledAt: NEW_SLOT },
    })
    const res = makeRes()
    const next = jest.fn()

    await reschedule(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 409 }))
  })

  test('should return 404 when appointment does not exist', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined)   // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // FOR UPDATE returns nothing
      .mockResolvedValueOnce(undefined)    // ROLLBACK

    const req = makeReq({
      user: { id: 'usr-pat', role: 'patient', patientId: 'pat-1' },
      params: { id: VALID_UUID },
      body: { scheduledAt: NEW_SLOT },
    })
    const res = makeRes()
    const next = jest.fn()

    await reschedule(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
  })

  test('should return 403 when patient tries to reschedule another patient\'s appointment', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ ...APPT_ROW, patient_id: 'pat-other' }] })
      .mockResolvedValueOnce(undefined) // ROLLBACK

    const req = makeReq({
      user: { id: 'usr-pat', role: 'patient', patientId: 'pat-mine' },
      params: { id: VALID_UUID },
      body: { scheduledAt: NEW_SLOT },
    })
    const res = makeRes()
    const next = jest.fn()

    await reschedule(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
  })

  test('should return 403 when doctor tries to reschedule another doctor\'s appointment', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ ...APPT_ROW, doctor_id: 'doc-other' }] })
      .mockResolvedValueOnce(undefined) // ROLLBACK

    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: 'doc-mine' },
      params: { id: VALID_UUID },
      body: { scheduledAt: NEW_SLOT },
    })
    const res = makeRes()
    const next = jest.fn()

    await reschedule(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
  })

  test('should allow nurse in same department to reschedule appointment', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined)                                        // BEGIN
      .mockResolvedValueOnce({ rows: [APPT_ROW] })                             // FOR UPDATE
      .mockResolvedValueOnce({ rows: [{ department: 'Cardiology' }] })         // nurse department
      .mockResolvedValueOnce({ rows: [SCHEDULE_ROW] })                         // schedule
      .mockResolvedValueOnce({ rows: [] })                                      // no conflict
      .mockResolvedValueOnce({ rows: [{ scheduled_at: new Date(NEW_SLOT) }] })  // UPDATE RETURNING
      .mockResolvedValueOnce(undefined)                                         // COMMIT

    const req = makeReq({
      user: { id: 'usr-nurse', role: 'nurse' },
      params: { id: VALID_UUID },
      body: { scheduledAt: NEW_SLOT },
    })
    const res = makeRes()
    const next = jest.fn()

    await reschedule(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.json.mock.calls[0][0].status).toBe('success')
  })

  test('should return 403 when nurse tries to reschedule appointment for doctor in different department', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined)                                // BEGIN
      .mockResolvedValueOnce({ rows: [APPT_ROW] })                     // FOR UPDATE (doctor in Cardiology)
      .mockResolvedValueOnce({ rows: [{ department: 'Pediatrics' }] }) // nurse in different dept
      .mockResolvedValueOnce(undefined)                                 // ROLLBACK

    const req = makeReq({
      user: { id: 'usr-nurse', role: 'nurse' },
      params: { id: VALID_UUID },
      body: { scheduledAt: NEW_SLOT },
    })
    const res = makeRes()
    const next = jest.fn()

    await reschedule(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 403,
      message: 'You can only reschedule appointments for doctors in your department.'
    }))
  })

  test('should return 404 when nurse profile not found', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined)            // BEGIN
      .mockResolvedValueOnce({ rows: [APPT_ROW] }) // FOR UPDATE
      .mockResolvedValueOnce({ rows: [] })         // nurse not found
      .mockResolvedValueOnce(undefined)             // ROLLBACK

    const req = makeReq({
      user: { id: 'usr-nurse', role: 'nurse' },
      params: { id: VALID_UUID },
      body: { scheduledAt: NEW_SLOT },
    })
    const res = makeRes()
    const next = jest.fn()

    await reschedule(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 404,
      message: 'Nurse profile not found.'
    }))
  })

  test('should return 400 when appointment status is not scheduled', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ ...APPT_ROW, status: 'completed' }] })
      .mockResolvedValueOnce(undefined) // ROLLBACK

    const req = makeReq({
      user: { id: 'usr-pat', role: 'patient', patientId: 'pat-1' },
      params: { id: VALID_UUID },
      body: { scheduledAt: NEW_SLOT },
    })
    const res = makeRes()
    const next = jest.fn()

    await reschedule(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('should return 400 when new slot is outside doctor schedule hours', async () => {
    // 2030-03-25T12:00:00Z = Monday 17:30 Asia/Colombo — after 17:00 schedule end
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [APPT_ROW] })
      .mockResolvedValueOnce({ rows: [SCHEDULE_ROW] })
      .mockResolvedValueOnce(undefined) // ROLLBACK

    const req = makeReq({
      user: { id: 'usr-pat', role: 'patient', patientId: 'pat-1' },
      params: { id: VALID_UUID },
      body: { scheduledAt: '2030-03-25T12:00:00Z' },
    })
    const res = makeRes()
    const next = jest.fn()

    await reschedule(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('should return 400 for invalid UUID appointment id', async () => {
    const req = makeReq({
      user: { id: 'usr-pat', role: 'patient', patientId: 'pat-1' },
      params: { id: 'not-a-uuid' },
      body: { scheduledAt: NEW_SLOT },
    })
    const res = makeRes()
    const next = jest.fn()

    await reschedule(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('should return 400 when scheduledAt is missing', async () => {
    const req = makeReq({
      user: { id: 'usr-pat', role: 'patient', patientId: 'pat-1' },
      params: { id: VALID_UUID },
      body: {},
    })
    const res = makeRes()
    const next = jest.fn()

    await reschedule(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('should issue ROLLBACK and release client on unexpected DB error', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined)                    // BEGIN
      .mockRejectedValueOnce(new Error('connection lost')) // FOR UPDATE fails
      .mockResolvedValueOnce(undefined)                    // ROLLBACK

    const req = makeReq({
      user: { id: 'usr-pat', role: 'patient', patientId: 'pat-1' },
      params: { id: VALID_UUID },
      body: { scheduledAt: NEW_SLOT },
    })
    const res = makeRes()
    const next = jest.fn()

    await reschedule(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(Error))
    expect(mockClientRelease).toHaveBeenCalled()
    const calls = mockClientQuery.mock.calls.map((c) => c[0])
    expect(calls).toContain('ROLLBACK')
  })
})

describe('cancelAppointment', () => {
  const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  const APPT_ROW = {
    id: VALID_UUID,
    patient_id: 'pat-1',
    doctor_id: 'doc-1',
    status: 'scheduled',
    scheduled_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
    patient_user_id: 'usr-pat',
    patient_first_name: 'John',
    doctor_user_id: 'usr-doc',
    doctor_first_name: 'Jane',
    doctor_last_name: 'Smith',
  }

  it('should cancel appointment successfully', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [APPT_ROW] })
      .mockResolvedValueOnce({ rows: [{ id: VALID_UUID, status: 'cancelled' }] })
      .mockResolvedValueOnce(undefined)

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-pat', role: 'patient', patientId: 'pat-1' } })
    const res = makeRes()
    const next = jest.fn()

    await cancelAppointment(req, res, next)

    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: { id: VALID_UUID, status: 'cancelled' } })
    expect(mockClientRelease).toHaveBeenCalled()
    const calls = mockClientQuery.mock.calls.map((c) => c[0])
    expect(calls).toContain('BEGIN')
    expect(calls).toContain('COMMIT')
  })

  it('should return 404 when appointment not found', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce(undefined)

    const req = makeReq({ params: { id: VALID_UUID } })
    const res = makeRes()
    const next = jest.fn()

    await cancelAppointment(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
    expect(mockClientRelease).toHaveBeenCalled()
    const calls = mockClientQuery.mock.calls.map((c) => c[0])
    expect(calls).toContain('ROLLBACK')
  })

  it('should return 403 when patient tries to cancel another patient\'s appointment', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ ...APPT_ROW, patient_id: 'pat-2' }] })
      .mockResolvedValueOnce(undefined)

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-pat', role: 'patient', patientId: 'pat-1' } })
    const res = makeRes()
    const next = jest.fn()

    await cancelAppointment(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
    const calls = mockClientQuery.mock.calls.map((c) => c[0])
    expect(calls).toContain('ROLLBACK')
  })

  it('should return 403 when doctor tries to cancel another doctor\'s appointment', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ ...APPT_ROW, doctor_id: 'doc-2' }] })
      .mockResolvedValueOnce(undefined)

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-doc', role: 'doctor', doctorId: 'doc-1' } })
    const res = makeRes()
    const next = jest.fn()

    await cancelAppointment(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
  })

  it('should return 403 when patient has no patientId', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [APPT_ROW] })
      .mockResolvedValueOnce(undefined)

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-pat', role: 'patient', patientId: undefined } })
    const res = makeRes()
    const next = jest.fn()

    await cancelAppointment(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403, message: 'Patient profile not found for this user.' }))
  })

  it('should return 403 when doctor has no doctorId', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [APPT_ROW] })
      .mockResolvedValueOnce(undefined)

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-doc', role: 'doctor', doctorId: undefined } })
    const res = makeRes()
    const next = jest.fn()

    await cancelAppointment(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403, message: 'Doctor profile not found for this user.' }))
  })

  it('should return 400 when appointment is already cancelled', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ ...APPT_ROW, status: 'cancelled' }] })
      .mockResolvedValueOnce(undefined)

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-pat', role: 'patient', patientId: 'pat-1' } })
    const res = makeRes()
    const next = jest.fn()

    await cancelAppointment(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400, message: 'Appointment is already cancelled.' }))
  })

  it('should return 400 when trying to cancel completed appointment', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ ...APPT_ROW, status: 'completed' }] })
      .mockResolvedValueOnce(undefined)

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-pat', role: 'patient', patientId: 'pat-1' } })
    const res = makeRes()
    const next = jest.fn()

    await cancelAppointment(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400, message: 'Cannot cancel a completed appointment.' }))
  })

  it('should return 400 when trying to cancel in-progress appointment', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ ...APPT_ROW, status: 'in_progress' }] })
      .mockResolvedValueOnce(undefined)

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-pat', role: 'patient', patientId: 'pat-1' } })
    const res = makeRes()
    const next = jest.fn()

    await cancelAppointment(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400, message: 'Cannot cancel an appointment that is currently in progress.' }))
  })

  it('should allow nurse to cancel any appointment', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [APPT_ROW] })
      .mockResolvedValueOnce({ rows: [{ id: VALID_UUID, status: 'cancelled' }] })
      .mockResolvedValueOnce(undefined)

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-nurse', role: 'nurse' } })
    const res = makeRes()
    const next = jest.fn()

    await cancelAppointment(req, res, next)

    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: { id: VALID_UUID, status: 'cancelled' } })
  })

  it('should allow admin to cancel any appointment', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [APPT_ROW] })
      .mockResolvedValueOnce({ rows: [{ id: VALID_UUID, status: 'cancelled' }] })
      .mockResolvedValueOnce(undefined)

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-admin', role: 'admin' } })
    const res = makeRes()
    const next = jest.fn()

    await cancelAppointment(req, res, next)

    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: { id: VALID_UUID, status: 'cancelled' } })
  })

  it('should return 400 for invalid UUID format', async () => {
    const req = makeReq({ params: { id: 'invalid-uuid' } })
    const res = makeRes()
    const next = jest.fn()

    await cancelAppointment(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400, message: 'Invalid appointment ID format.' }))
  })

  it('should issue ROLLBACK and release client on unexpected DB error', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [APPT_ROW] })
      .mockRejectedValueOnce(new Error('Database error'))
      .mockResolvedValueOnce(undefined)

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-pat', role: 'patient', patientId: 'pat-1' } })
    const res = makeRes()
    const next = jest.fn()

    await cancelAppointment(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(Error))
    expect(mockClientRelease).toHaveBeenCalled()
    const calls = mockClientQuery.mock.calls.map((c) => c[0])
    expect(calls).toContain('ROLLBACK')
  })

  it('should return 400 when patient tries to cancel within 24 hours', async () => {
    const soonAppointment = new Date(Date.now() + 23 * 60 * 60 * 1000)
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ ...APPT_ROW, scheduled_at: soonAppointment }] })
      .mockResolvedValueOnce(undefined)

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-pat', role: 'patient', patientId: 'pat-1' } })
    const res = makeRes()
    const next = jest.fn()

    await cancelAppointment(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 400,
      message: expect.stringContaining('24 hours')
    }))
    const calls = mockClientQuery.mock.calls.map((c) => c[0])
    expect(calls).toContain('ROLLBACK')
  })

  it('should allow patient to cancel appointment more than 24 hours before', async () => {
    const futureAppointment = new Date(Date.now() + 48 * 60 * 60 * 1000)
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ ...APPT_ROW, scheduled_at: futureAppointment }] })
      .mockResolvedValueOnce({ rows: [{ id: VALID_UUID, status: 'cancelled' }] })
      .mockResolvedValueOnce(undefined)

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-pat', role: 'patient', patientId: 'pat-1' } })
    const res = makeRes()
    const next = jest.fn()

    await cancelAppointment(req, res, next)

    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: { id: VALID_UUID, status: 'cancelled' } })
  })

  it('should return 400 when doctor tries to cancel within 2 hours', async () => {
    const soonAppointment = new Date(Date.now() + 1.5 * 60 * 60 * 1000)
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ ...APPT_ROW, scheduled_at: soonAppointment }] })
      .mockResolvedValueOnce(undefined)

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-doc', role: 'doctor', doctorId: 'doc-1' } })
    const res = makeRes()
    const next = jest.fn()

    await cancelAppointment(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 400,
      message: expect.stringContaining('2 hours')
    }))
    const calls = mockClientQuery.mock.calls.map((c) => c[0])
    expect(calls).toContain('ROLLBACK')
  })

  it('should allow doctor to cancel appointment more than 2 hours before', async () => {
    const futureAppointment = new Date(Date.now() + 3 * 60 * 60 * 1000)
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ ...APPT_ROW, scheduled_at: futureAppointment }] })
      .mockResolvedValueOnce({ rows: [{ id: VALID_UUID, status: 'cancelled' }] })
      .mockResolvedValueOnce(undefined)

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-doc', role: 'doctor', doctorId: 'doc-1' } })
    const res = makeRes()
    const next = jest.fn()

    await cancelAppointment(req, res, next)

    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: { id: VALID_UUID, status: 'cancelled' } })
  })

  it('should allow nurse to cancel appointment regardless of time (bypass policy)', async () => {
    const soonAppointment = new Date(Date.now() + 0.5 * 60 * 60 * 1000)
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ ...APPT_ROW, scheduled_at: soonAppointment }] })
      .mockResolvedValueOnce({ rows: [{ id: VALID_UUID, status: 'cancelled' }] })
      .mockResolvedValueOnce(undefined)

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-nurse', role: 'nurse' } })
    const res = makeRes()
    const next = jest.fn()

    await cancelAppointment(req, res, next)

    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: { id: VALID_UUID, status: 'cancelled' } })
  })

  it('should allow admin to cancel appointment regardless of time (bypass policy)', async () => {
    const soonAppointment = new Date(Date.now() + 0.5 * 60 * 60 * 1000)
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ ...APPT_ROW, scheduled_at: soonAppointment }] })
      .mockResolvedValueOnce({ rows: [{ id: VALID_UUID, status: 'cancelled' }] })
      .mockResolvedValueOnce(undefined)

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-admin', role: 'admin' } })
    const res = makeRes()
    const next = jest.fn()

    await cancelAppointment(req, res, next)

    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: { id: VALID_UUID, status: 'cancelled' } })
  })

  it('should return 400 when trying to cancel appointment that has already passed', async () => {
    const pastAppointment = new Date(Date.now() - 2 * 60 * 60 * 1000)
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ ...APPT_ROW, scheduled_at: pastAppointment }] })
      .mockResolvedValueOnce(undefined)

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-pat', role: 'patient', patientId: 'pat-1' } })
    const res = makeRes()
    const next = jest.fn()

    await cancelAppointment(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 400,
      message: 'Cannot cancel an appointment that has already passed.'
    }))
    const calls = mockClientQuery.mock.calls.map((c) => c[0])
    expect(calls).toContain('ROLLBACK')
  })

  it('should allow patient to cancel exactly 24 hours before (boundary - inclusive)', async () => {
    const exactlyBoundary = new Date(Date.now() + 24 * 60 * 60 * 1000)
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ ...APPT_ROW, scheduled_at: exactlyBoundary }] })
      .mockResolvedValueOnce({ rows: [{ id: VALID_UUID, status: 'cancelled' }] })
      .mockResolvedValueOnce(undefined)

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-pat', role: 'patient', patientId: 'pat-1' } })
    const res = makeRes()
    const next = jest.fn()

    await cancelAppointment(req, res, next)

    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: { id: VALID_UUID, status: 'cancelled' } })
  })

  it('should allow patient to cancel just over 24 hours before (boundary)', async () => {
    const justOverBoundary = new Date(Date.now() + 24.1 * 60 * 60 * 1000)
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ ...APPT_ROW, scheduled_at: justOverBoundary }] })
      .mockResolvedValueOnce({ rows: [{ id: VALID_UUID, status: 'cancelled' }] })
      .mockResolvedValueOnce(undefined)

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-pat', role: 'patient', patientId: 'pat-1' } })
    const res = makeRes()
    const next = jest.fn()

    await cancelAppointment(req, res, next)

    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: { id: VALID_UUID, status: 'cancelled' } })
  })

  it('should allow doctor to cancel exactly 2 hours before (boundary - inclusive)', async () => {
    const exactlyBoundary = new Date(Date.now() + 2 * 60 * 60 * 1000)
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ ...APPT_ROW, scheduled_at: exactlyBoundary }] })
      .mockResolvedValueOnce({ rows: [{ id: VALID_UUID, status: 'cancelled' }] })
      .mockResolvedValueOnce(undefined)

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-doc', role: 'doctor', doctorId: 'doc-1' } })
    const res = makeRes()
    const next = jest.fn()

    await cancelAppointment(req, res, next)

    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: { id: VALID_UUID, status: 'cancelled' } })
  })

  it('should allow doctor to cancel just over 2 hours before (boundary)', async () => {
    const justOverBoundary = new Date(Date.now() + 2.1 * 60 * 60 * 1000)
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ ...APPT_ROW, scheduled_at: justOverBoundary }] })
      .mockResolvedValueOnce({ rows: [{ id: VALID_UUID, status: 'cancelled' }] })
      .mockResolvedValueOnce(undefined)

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-doc', role: 'doctor', doctorId: 'doc-1' } })
    const res = makeRes()
    const next = jest.fn()

    await cancelAppointment(req, res, next)

    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: { id: VALID_UUID, status: 'cancelled' } })
  })
})

// ──────────────────────────────────────────────────────────────
// MARK NO-SHOW
// ──────────────────────────────────────────────────────────────
describe('markNoShow', () => {
  const VALID_UUID = '12345678-1234-1234-1234-123456789012'
  const PAST_DATE = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago

  test('marks scheduled appointment as no-show and increments count', async () => {
    const apptRow = {
      id: VALID_UUID,
      patient_id: 'pat-1',
      doctor_id: 'doc-1',
      status: 'scheduled',
      scheduled_at: PAST_DATE,
      patient_user_id: 'usr-pat',
      no_show_count: 0,
      no_show_flagged: false,
      no_show_flag_date: null,
      patient_first_name: 'John',
      patient_last_name: 'Doe',
      doctor_user_id: 'usr-doc',
      doctor_department: 'Cardiology',
      doctor_first_name: 'Kamal',
      doctor_last_name: 'Perera',
    }

    mockClientQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [apptRow] }) // SELECT appointment
      .mockResolvedValueOnce(undefined) // UPDATE appointment
      .mockResolvedValueOnce({ rows: [{ no_show_count: 1, no_show_flagged: false, no_show_flag_date: null }] }) // UPDATE patient RETURNING
      .mockResolvedValueOnce(undefined) // INSERT audit_logs
      .mockResolvedValueOnce(undefined) // COMMIT

    mockQuery.mockResolvedValueOnce({ rows: [] }) // Admin query (no admin)

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-doc', role: 'doctor' } })
    const res = makeRes()
    const next = jest.fn()

    await markNoShow(req, res, next)

    expect(mockClientQuery).toHaveBeenCalledWith('BEGIN')
    expect(mockClientQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE appointments SET status'),
      ['no_show', VALID_UUID]
    )
    expect(mockClientQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE patients'),
      [3, 'pat-1']
    )
    expect(mockClientQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_logs'),
      expect.any(Array)
    )
    expect(mockClientQuery).toHaveBeenCalledWith('COMMIT')
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: {
        id: VALID_UUID,
        status: 'no_show',
        patient: { noShowCount: 1, flagged: false },
      },
    })
    expect(mockClientRelease).toHaveBeenCalled()
  })

  test('flags patient when no-show count reaches 3', async () => {
    const apptRow = {
      id: VALID_UUID,
      patient_id: 'pat-1',
      doctor_id: 'doc-1',
      status: 'scheduled',
      scheduled_at: PAST_DATE,
      patient_user_id: 'usr-pat',
      no_show_count: 2, // This will be the 3rd no-show
      no_show_flagged: false,
      no_show_flag_date: null,
      patient_first_name: 'John',
      patient_last_name: 'Doe',
      doctor_user_id: 'usr-doc',
      doctor_department: 'Cardiology',
      doctor_first_name: 'Kamal',
      doctor_last_name: 'Perera',
    }

    const flagDate = new Date()

    mockClientQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [apptRow] }) // SELECT appointment
      .mockResolvedValueOnce(undefined) // UPDATE appointment
      .mockResolvedValueOnce({ rows: [{ no_show_count: 3, no_show_flagged: true, no_show_flag_date: flagDate }] }) // UPDATE patient RETURNING
      .mockResolvedValueOnce(undefined) // INSERT audit_logs
      .mockResolvedValueOnce(undefined) // COMMIT

    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'admin-1' }] }) // Admin query

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-doc', role: 'doctor' } })
    const res = makeRes()
    const next = jest.fn()

    await markNoShow(req, res, next)

    expect(mockClientQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE patients'),
      [3, 'pat-1']
    )
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: {
        id: VALID_UUID,
        status: 'no_show',
        patient: { noShowCount: 3, flagged: true },
      },
    })
  })

  test('returns 403 when patient tries to mark no-show', async () => {
    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-pat', role: 'patient', patientId: 'pat-1' } })
    const res = makeRes()
    const next = jest.fn()

    await markNoShow(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Patients cannot mark appointments as no-show.', statusCode: 403 }))
  })

  test('returns 400 for invalid UUID format', async () => {
    const req = makeReq({ params: { id: 'not-a-uuid' }, user: { id: 'usr-doc', role: 'doctor' } })
    const res = makeRes()
    const next = jest.fn()

    await markNoShow(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid appointment ID format.', statusCode: 400 }))
  })

  test('returns 404 when appointment not found', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT - not found

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-doc', role: 'doctor' } })
    const res = makeRes()
    const next = jest.fn()

    await markNoShow(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Appointment not found.', statusCode: 404 }))
    expect(mockClientRelease).toHaveBeenCalled()
  })

  test('returns 400 when appointment already marked as no-show', async () => {
    const apptRow = {
      id: VALID_UUID,
      status: 'no_show',
      scheduled_at: PAST_DATE,
    }

    mockClientQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [apptRow] }) // SELECT

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-doc', role: 'doctor' } })
    const res = makeRes()
    const next = jest.fn()

    await markNoShow(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Appointment is already marked as no-show.', statusCode: 400 }))
  })

  test('returns 400 when appointment is cancelled', async () => {
    const apptRow = {
      id: VALID_UUID,
      status: 'cancelled',
      scheduled_at: PAST_DATE,
    }

    mockClientQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [apptRow] }) // SELECT

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-doc', role: 'doctor' } })
    const res = makeRes()
    const next = jest.fn()

    await markNoShow(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Cannot mark a cancelled appointment as no-show.', statusCode: 400 }))
  })

  test('returns 400 when appointment is completed', async () => {
    const apptRow = {
      id: VALID_UUID,
      status: 'completed',
      scheduled_at: PAST_DATE,
    }

    mockClientQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [apptRow] }) // SELECT

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-doc', role: 'doctor' } })
    const res = makeRes()
    const next = jest.fn()

    await markNoShow(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Cannot mark a completed appointment as no-show.', statusCode: 400 }))
  })

  test('returns 400 when appointment is in the future', async () => {
    const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    const apptRow = {
      id: VALID_UUID,
      status: 'scheduled',
      scheduled_at: futureDate,
    }

    mockClientQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [apptRow] }) // SELECT

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-doc', role: 'doctor' } })
    const res = makeRes()
    const next = jest.fn()

    await markNoShow(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Cannot mark a future appointment as no-show. Wait until after the scheduled time.', statusCode: 400 }))
  })

  test('allows nurse to mark no-show for appointment in their department', async () => {
    const apptRow = {
      id: VALID_UUID,
      patient_id: 'pat-1',
      doctor_id: 'doc-1',
      status: 'scheduled',
      scheduled_at: PAST_DATE,
      patient_user_id: 'usr-pat',
      no_show_count: 0,
      no_show_flagged: false,
      no_show_flag_date: null,
      patient_first_name: 'John',
      patient_last_name: 'Doe',
      doctor_user_id: 'usr-doc',
      doctor_department: 'Cardiology',
      doctor_first_name: 'Kamal',
      doctor_last_name: 'Perera',
    }

    mockClientQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [apptRow] }) // SELECT appointment
      .mockResolvedValueOnce({ rows: [{ department: 'Cardiology' }] }) // SELECT nurse department
      .mockResolvedValueOnce(undefined) // UPDATE appointment
      .mockResolvedValueOnce({ rows: [{ no_show_count: 1, no_show_flagged: false, no_show_flag_date: null }] }) // UPDATE patient RETURNING
      .mockResolvedValueOnce(undefined) // INSERT audit_logs
      .mockResolvedValueOnce(undefined) // COMMIT

    mockQuery.mockResolvedValueOnce({ rows: [] }) // Admin query

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-nurse', role: 'nurse' } })
    const res = makeRes()
    const next = jest.fn()

    await markNoShow(req, res, next)

    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: {
        id: VALID_UUID,
        status: 'no_show',
        patient: { noShowCount: 1, flagged: false },
      },
    })
  })

  test('returns 403 when nurse tries to mark no-show for appointment in different department', async () => {
    const apptRow = {
      id: VALID_UUID,
      doctor_department: 'Cardiology',
      status: 'scheduled',
      scheduled_at: PAST_DATE,
    }

    mockClientQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [apptRow] }) // SELECT appointment
      .mockResolvedValueOnce({ rows: [{ department: 'Neurology' }] }) // SELECT nurse department (different)

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-nurse', role: 'nurse' } })
    const res = makeRes()
    const next = jest.fn()

    await markNoShow(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      message: 'You can only mark no-shows for appointments with doctors in your department.',
      statusCode: 403
    }))
    expect(mockClientRelease).toHaveBeenCalled()
  })

  test('returns 404 when nurse profile not found', async () => {
    const apptRow = {
      id: VALID_UUID,
      doctor_department: 'Cardiology',
      status: 'scheduled',
      scheduled_at: PAST_DATE,
    }

    mockClientQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [apptRow] }) // SELECT appointment
      .mockResolvedValueOnce({ rows: [] }) // SELECT nurse department (not found)

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-nurse', role: 'nurse' } })
    const res = makeRes()
    const next = jest.fn()

    await markNoShow(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Nurse profile not found.',
      statusCode: 404
    }))
    expect(mockClientRelease).toHaveBeenCalled()
  })

  test('rolls back transaction on error', async () => {
    const apptRow = {
      id: VALID_UUID,
      patient_id: 'pat-1',
      status: 'scheduled',
      scheduled_at: PAST_DATE,
      patient_user_id: 'usr-pat',
      no_show_count: 0,
      no_show_flagged: false,
      no_show_flag_date: null,
      patient_first_name: 'John',
      patient_last_name: 'Doe',
      doctor_user_id: 'usr-doc',
      doctor_department: 'Cardiology',
      doctor_first_name: 'Kamal',
      doctor_last_name: 'Perera',
    }

    mockClientQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [apptRow] }) // SELECT
      .mockRejectedValueOnce(new Error('Database error')) // UPDATE fails
      .mockResolvedValueOnce(undefined) // ROLLBACK

    const req = makeReq({ params: { id: VALID_UUID }, user: { id: 'usr-doc', role: 'doctor' } })
    const res = makeRes()
    const next = jest.fn()

    await markNoShow(req, res, next)

    expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK')
    expect(mockClientRelease).toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith(expect.any(Error))
  })
})

describe('massReschedule', () => {
  const DOCTOR_ID = 'd0c12345-6789-1234-5678-901234567890'
  const START_DATE = '2026-06-15T00:00:00Z'
  const END_DATE = '2026-06-16T00:00:00Z'
  const OFFSET_DAYS = 1

  const DOCTOR_ROW = {
    id: DOCTOR_ID,
    user_id: 'usr-doc',
    department: 'Cardiology',
  }

  const APPT1 = {
    id: 'appt-1',
    patient_id: 'pat-1',
    doctor_id: DOCTOR_ID,
    status: 'scheduled',
    scheduled_at: '2026-06-15T02:30:00Z', // Monday 08:00 Asia/Colombo
    patient_user_id: 'usr-pat-1',
    patient_first_name: 'John',
    patient_last_name: 'Doe',
    doctor_user_id: 'usr-doc',
    doctor_first_name: 'Kamal',
    doctor_last_name: 'Perera',
  }

  const APPT2 = {
    id: 'appt-2',
    patient_id: 'pat-2',
    doctor_id: DOCTOR_ID,
    status: 'scheduled',
    scheduled_at: '2026-06-15T02:50:00Z', // Monday 08:20 Asia/Colombo (on slot boundary)
    patient_user_id: 'usr-pat-2',
    patient_first_name: 'Jane',
    patient_last_name: 'Smith',
    doctor_user_id: 'usr-doc',
    doctor_first_name: 'Kamal',
    doctor_last_name: 'Perera',
  }

  const SCHEDULE_ROW = { start_time: '08:00:00', end_time: '17:00:00', is_active: true }

  beforeEach(() => {
    mockClientQuery.mockReset()
    mockClientRelease.mockReset()
    mockQuery.mockReset()
  })

  test('successfully reschedules multiple appointments with offset', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [DOCTOR_ROW] }) // SELECT doctor
      .mockResolvedValueOnce({ rows: [{ day_of_week: 1, ...SCHEDULE_ROW }, { day_of_week: 2, ...SCHEDULE_ROW }] }) // SELECT all schedules (batch) - day 1 = Monday, day 2 = Tuesday
      .mockResolvedValueOnce({ rows: [APPT1, APPT2] }) // SELECT appointments
      .mockResolvedValueOnce({ rows: [] }) // batch conflict check
      .mockResolvedValueOnce(undefined) // bulk UPDATE with UNNEST
      .mockResolvedValueOnce(undefined) // COMMIT

    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: DOCTOR_ID },
      body: {
        doctorId: DOCTOR_ID,
        dateRange: { start: START_DATE, end: END_DATE },
        offsetDays: OFFSET_DAYS,
      },
    })
    const res = makeRes()
    const next = jest.fn()

    await massReschedule(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(mockClientQuery).toHaveBeenCalledWith('COMMIT')
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: {
        rescheduledCount: 2,
        appointments: expect.arrayContaining([
          expect.objectContaining({ id: 'appt-1' }),
          expect.objectContaining({ id: 'appt-2' }),
        ]),
      },
    })
    expect(mockClientRelease).toHaveBeenCalled()
  })

  test('returns 400 when doctorId is missing', async () => {
    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: DOCTOR_ID },
      body: {
        dateRange: { start: START_DATE, end: END_DATE },
        offsetDays: OFFSET_DAYS,
      },
    })
    const res = makeRes()
    const next = jest.fn()

    await massReschedule(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 400,
      message: 'Valid doctorId is required.',
    }))
  })

  test('returns 400 when dateRange is missing', async () => {
    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: DOCTOR_ID },
      body: {
        doctorId: DOCTOR_ID,
        offsetDays: OFFSET_DAYS,
      },
    })
    const res = makeRes()
    const next = jest.fn()

    await massReschedule(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 400,
      message: 'dateRange with start and end is required.',
    }))
  })

  test('returns 400 when offsetDays is zero', async () => {
    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: DOCTOR_ID },
      body: {
        doctorId: DOCTOR_ID,
        dateRange: { start: START_DATE, end: END_DATE },
        offsetDays: 0,
      },
    })
    const res = makeRes()
    const next = jest.fn()

    await massReschedule(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 400,
      message: 'offsetDays must be non-zero.',
    }))
  })

  test('returns 403 when patient tries to mass reschedule', async () => {
    const req = makeReq({
      user: { id: 'usr-pat', role: 'patient', patientId: 'pat-1' },
      body: {
        doctorId: DOCTOR_ID,
        dateRange: { start: START_DATE, end: END_DATE },
        offsetDays: OFFSET_DAYS,
      },
    })
    const res = makeRes()
    const next = jest.fn()

    await massReschedule(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 403,
      message: 'Patients cannot perform mass rescheduling.',
    }))
  })

  test('returns 404 when doctor not found', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT doctor - not found
      .mockResolvedValueOnce(undefined) // ROLLBACK

    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: DOCTOR_ID },
      body: {
        doctorId: DOCTOR_ID,
        dateRange: { start: START_DATE, end: END_DATE },
        offsetDays: OFFSET_DAYS,
      },
    })
    const res = makeRes()
    const next = jest.fn()

    await massReschedule(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 404,
      message: 'Doctor not found.',
    }))
    expect(mockClientRelease).toHaveBeenCalled()
  })

  test('returns 403 when doctor tries to reschedule another doctor\'s appointments', async () => {
    const otherDoctorId = 'a1b2c3d4-5678-90ab-cdef-123456789012'

    mockClientQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ ...DOCTOR_ROW, id: otherDoctorId }] }) // Different doctor
      .mockResolvedValueOnce(undefined) // ROLLBACK

    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: DOCTOR_ID },
      body: {
        doctorId: otherDoctorId,
        dateRange: { start: START_DATE, end: END_DATE },
        offsetDays: OFFSET_DAYS,
      },
    })
    const res = makeRes()
    const next = jest.fn()

    await massReschedule(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 403,
      message: 'You can only mass reschedule your own appointments.',
    }))
  })

  test('allows nurse to mass reschedule for doctor in same department', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [DOCTOR_ROW] }) // SELECT doctor
      .mockResolvedValueOnce({ rows: [{ department: 'Cardiology' }] }) // SELECT nurse department - same
      .mockResolvedValueOnce({ rows: [{ day_of_week: 1, ...SCHEDULE_ROW }, { day_of_week: 2, ...SCHEDULE_ROW }] }) // SELECT all schedules
      .mockResolvedValueOnce({ rows: [APPT1] }) // SELECT appointments
      .mockResolvedValueOnce({ rows: [] }) // batch conflict check
      .mockResolvedValueOnce(undefined) // bulk UPDATE
      .mockResolvedValueOnce(undefined) // COMMIT

    const req = makeReq({
      user: { id: 'usr-nurse', role: 'nurse' },
      body: {
        doctorId: DOCTOR_ID,
        dateRange: { start: START_DATE, end: END_DATE },
        offsetDays: OFFSET_DAYS,
      },
    })
    const res = makeRes()
    const next = jest.fn()

    await massReschedule(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(mockClientQuery).toHaveBeenCalledWith('COMMIT')
  })

  test('returns 403 when nurse tries to reschedule for doctor in different department', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [DOCTOR_ROW] }) // SELECT doctor (Cardiology)
      .mockResolvedValueOnce({ rows: [{ department: 'Neurology' }] }) // SELECT nurse department - different
      .mockResolvedValueOnce(undefined) // ROLLBACK

    const req = makeReq({
      user: { id: 'usr-nurse', role: 'nurse' },
      body: {
        doctorId: DOCTOR_ID,
        dateRange: { start: START_DATE, end: END_DATE },
        offsetDays: OFFSET_DAYS,
      },
    })
    const res = makeRes()
    const next = jest.fn()

    await massReschedule(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 403,
      message: 'You can only mass reschedule appointments for doctors in your department.',
    }))
  })

  test('returns 404 when no appointments found in date range', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [DOCTOR_ROW] }) // SELECT doctor
      .mockResolvedValueOnce({ rows: [{ day_of_week: 1, ...SCHEDULE_ROW }] }) // SELECT all schedules
      .mockResolvedValueOnce({ rows: [] }) // SELECT appointments - none found
      .mockResolvedValueOnce(undefined) // ROLLBACK

    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: DOCTOR_ID },
      body: {
        doctorId: DOCTOR_ID,
        dateRange: { start: START_DATE, end: END_DATE },
        offsetDays: OFFSET_DAYS,
      },
    })
    const res = makeRes()
    const next = jest.fn()

    await massReschedule(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 404,
      message: 'No scheduled appointments found in the specified date range.',
    }))
  })

  test('returns 409 when multiple appointments would be rescheduled to same time', async () => {
    // Two appointments with same scheduled time
    const appt1SameTime = { ...APPT1, scheduled_at: '2026-06-15T02:30:00Z' }
    const appt2SameTime = { ...APPT2, scheduled_at: '2026-06-15T02:30:00Z' }

    mockClientQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [DOCTOR_ROW] }) // SELECT doctor
      .mockResolvedValueOnce({ rows: [{ day_of_week: 1, ...SCHEDULE_ROW }, { day_of_week: 2, ...SCHEDULE_ROW }] }) // SELECT all schedules
      .mockResolvedValueOnce({ rows: [appt1SameTime, appt2SameTime] }) // SELECT appointments
      .mockResolvedValueOnce(undefined) // ROLLBACK

    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: DOCTOR_ID },
      body: {
        doctorId: DOCTOR_ID,
        dateRange: { start: START_DATE, end: END_DATE },
        offsetDays: OFFSET_DAYS,
      },
    })
    const res = makeRes()
    const next = jest.fn()

    await massReschedule(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 409,
      message: expect.stringContaining('Multiple appointments would be rescheduled to the same time'),
    }))
  })

  test('returns 400 when offsetDays is a float', async () => {
    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: DOCTOR_ID },
      body: {
        doctorId: DOCTOR_ID,
        dateRange: { start: START_DATE, end: END_DATE },
        offsetDays: 1.5,
      },
    })
    const res = makeRes()
    const next = jest.fn()

    await massReschedule(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 400,
      message: 'offsetDays is required and must be an integer.',
    }))
  })

  test('returns 400 when date range is too small', async () => {
    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: DOCTOR_ID },
      body: {
        doctorId: DOCTOR_ID,
        dateRange: {
          start: '2026-06-15T00:00:00Z',
          end: '2026-06-15T12:00:00Z', // Same day, less than 1 day span
        },
        offsetDays: 1,
      },
    })
    const res = makeRes()
    const next = jest.fn()

    await massReschedule(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 400,
      message: expect.stringContaining('must span at least'),
    }))
  })

  test('returns 400 when batch size exceeds limit', async () => {
    // Create 101 appointments (exceeds MAX_BATCH_SIZE of 100)
    const manyAppointments = Array.from({ length: 101 }, (_, i) => ({
      ...APPT1,
      id: `appt-${i}`,
      scheduled_at: '2026-06-15T02:30:00Z',
    }))

    mockClientQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [DOCTOR_ROW] }) // SELECT doctor
      .mockResolvedValueOnce({ rows: [{ day_of_week: 1, ...SCHEDULE_ROW }] }) // SELECT all schedules
      .mockResolvedValueOnce({ rows: manyAppointments }) // SELECT appointments
      .mockResolvedValueOnce(undefined) // ROLLBACK

    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: DOCTOR_ID },
      body: {
        doctorId: DOCTOR_ID,
        dateRange: { start: START_DATE, end: END_DATE },
        offsetDays: OFFSET_DAYS,
      },
    })
    const res = makeRes()
    const next = jest.fn()

    await massReschedule(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 400,
      message: expect.stringContaining('Cannot reschedule more than 100 appointments'),
    }))
  })

  test('rolls back transaction on error', async () => {
    mockClientQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [DOCTOR_ROW] }) // SELECT doctor
      .mockRejectedValueOnce(new Error('Database error')) // SELECT schedules fails
      .mockResolvedValueOnce(undefined) // ROLLBACK

    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: DOCTOR_ID },
      body: {
        doctorId: DOCTOR_ID,
        dateRange: { start: START_DATE, end: END_DATE },
        offsetDays: OFFSET_DAYS,
      },
    })
    const res = makeRes()
    const next = jest.fn()

    await massReschedule(req, res, next)

    expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK')
    expect(mockClientRelease).toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith(expect.any(Error))
  })
})
