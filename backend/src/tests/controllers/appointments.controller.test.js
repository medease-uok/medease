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

const { sendAppointmentConfirmationEmail } = require('../../utils/emailService')
const { getAll, getById, create, updateStatus, reschedule } = require('../../controllers/appointments.controller')

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
  // 2030-03-25T02:30:00Z = Monday 08:00 Asia/Colombo — existing slot (future date)
  const CURRENT_SLOT = '2030-03-25T02:30:00Z'
  // 2030-03-25T02:50:00Z = Monday 08:20 Asia/Colombo — next valid slot
  const NEW_SLOT = '2030-03-25T02:50:00Z'
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

  test('should allow nurse to reschedule any appointment without ownership check', async () => {
    mockSuccessfulTransaction()

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
