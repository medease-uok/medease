const mockQuery = jest.fn()
const mockClientQuery = jest.fn()
const mockClientRelease = jest.fn()
const mockGetClient = jest.fn(() => ({ query: mockClientQuery, release: mockClientRelease }))

jest.mock('../../config/database', () => ({
  query: (...args) => mockQuery(...args),
  getClient: () => mockGetClient(),
}))

jest.mock('../../utils/auditLog', () => jest.fn().mockResolvedValue(undefined))
jest.mock('../../utils/refillEligibility', () => ({
  isRefillEligible: jest.fn().mockReturnValue(false),
}))
jest.mock('../../middleware/upload', () => ({
  uploadPrescriptionImageToS3: jest.fn().mockResolvedValue('s3-key/image.jpg'),
  getPresignedImageUrl: jest.fn().mockResolvedValue('https://s3.example.com/presigned'),
}))
jest.mock('../../controllers/notifications.controller', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
}))

const { getAll, create, updateStatus } = require('../../controllers/prescriptions.controller')

function makeReq(overrides = {}) {
  return {
    user: { id: 'usr-doc', role: 'doctor', doctorId: 'doc-1' },
    params: {},
    body: {},
    ip: '127.0.0.1',
    ...overrides,
  }
}

function makeRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() }
}

beforeEach(() => {
  mockQuery.mockReset()
  mockClientQuery.mockReset()
  mockClientRelease.mockReset()
  jest.clearAllMocks()
})

// ──────────────────────────────────────────────────────────────
// GET ALL
// ──────────────────────────────────────────────────────────────
describe('getAll', () => {
  const RX_ROW = {
    id: 'rx-1', patient_id: 'pat-1', doctor_id: 'doc-1',
    medication: 'Amoxicillin', dosage: '500mg', frequency: 'TDS',
    duration: '7 days', status: 'active', type: 'digital', notes: null,
    image_key: null, created_at: '2026-01-01', patient_name: 'John Doe',
    doctor_name: 'Dr. Kamal Perera', pending_refill: false,
  }

  test('pharmacist sees all prescriptions', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [RX_ROW] })
      .mockResolvedValueOnce({ rows: [] }) // prescription items

    const req = makeReq({ user: { id: 'usr-ph', role: 'pharmacist' } })
    const res = makeRes()
    await getAll(req, res, jest.fn())

    const body = res.json.mock.calls[0][0]
    expect(body.status).toBe('success')
    expect(body.data).toHaveLength(1)
  })

  test('patient sees only own prescriptions', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [RX_ROW] })
      .mockResolvedValueOnce({ rows: [] })

    const req = makeReq({ user: { id: 'usr-pat', role: 'patient', patientId: 'pat-1' } })
    const res = makeRes()
    await getAll(req, res, jest.fn())

    const callArgs = mockQuery.mock.calls[0]
    expect(callArgs[0]).toContain('rx.patient_id = $1')
    expect(callArgs[1]).toContain('pat-1')
  })

  test('doctor sees prescriptions via doctorId filter', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })

    const req = makeReq({ user: { id: 'usr-doc', role: 'doctor', doctorId: 'doc-1' } })
    const res = makeRes()
    await getAll(req, res, jest.fn())

    const callArgs = mockQuery.mock.calls[0]
    expect(callArgs[0]).toContain('doctor_id')
  })

  test('calls next on database error', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'))

    const req = makeReq()
    const res = makeRes()
    const next = jest.fn()
    await getAll(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(Error))
  })
})

// ──────────────────────────────────────────────────────────────
// CREATE — DIGITAL
// ──────────────────────────────────────────────────────────────
describe('create (digital)', () => {
  const PATIENT_ROW = { id: 'pat-1', user_id: 'usr-pat', first_name: 'John', last_name: 'Doe' }
  const DOCTOR_ROW = { first_name: 'Kamal', last_name: 'Perera' }

  beforeEach(() => {
    mockClientQuery.mockReset()
  })

  test('creates a digital prescription with items', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [PATIENT_ROW] }) // patientCheck
      .mockResolvedValueOnce({ rows: [DOCTOR_ROW] })  // doctorInfo
      .mockResolvedValue({ rows: [] })                 // pharmacist notification query

    mockClientQuery
      .mockResolvedValueOnce(undefined)                                            // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 'rx-new' }] })                        // INSERT prescription
      .mockResolvedValueOnce(undefined)                                            // INSERT items
      .mockResolvedValueOnce(undefined)                                            // COMMIT

    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: 'doc-1' },
      body: {
        patientId: 'pat-1',
        type: 'digital',
        items: [{ medication: 'Amoxicillin', dosage: '500mg', frequency: 'TDS', duration: '7 days' }],
      },
    })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json.mock.calls[0][0].data.id).toBe('rx-new')
  })

  test('returns 400 when items array is empty', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [PATIENT_ROW] })
      .mockResolvedValueOnce({ rows: [DOCTOR_ROW] })

    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: 'doc-1' },
      body: { patientId: 'pat-1', type: 'digital', items: [] },
    })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('returns 400 when item is missing medication', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [PATIENT_ROW] })
      .mockResolvedValueOnce({ rows: [DOCTOR_ROW] })

    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: 'doc-1' },
      body: {
        patientId: 'pat-1',
        type: 'digital',
        items: [{ dosage: '500mg', frequency: 'TDS' }], // missing medication
      },
    })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('returns 400 when patientId is missing', async () => {
    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: 'doc-1' },
      body: { type: 'digital', items: [{ medication: 'X', dosage: '1', frequency: 'OD' }] },
    })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('returns 403 when user is not a doctor', async () => {
    const req = makeReq({
      user: { id: 'usr-ph', role: 'pharmacist', doctorId: null },
      body: { patientId: 'pat-1', items: [{ medication: 'X', dosage: '1', frequency: 'OD' }] },
    })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
  })

  test('returns 404 when patient not found', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // patientCheck empty
      .mockResolvedValueOnce({ rows: [DOCTOR_ROW] })

    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor', doctorId: 'doc-1' },
      body: {
        patientId: 'pat-nonexistent',
        type: 'digital',
        items: [{ medication: 'Amoxicillin', dosage: '500mg', frequency: 'TDS' }],
      },
    })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
  })
})

// ──────────────────────────────────────────────────────────────
// UPDATE STATUS
// ──────────────────────────────────────────────────────────────
describe('updateStatus', () => {
  const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  const RX_DB = {
    id: VALID_UUID,
    patient_id: 'pat-1',
    doctor_id: 'doc-1',
    medication: 'Amoxicillin',
    doctor_user_id: 'usr-doc',
  }

  test('pharmacist can dispense prescription', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [RX_DB] })
      .mockResolvedValueOnce({ rows: [{ id: VALID_UUID, status: 'dispensed' }] })
      .mockResolvedValueOnce({ rows: [{ user_id: 'usr-pat' }] })

    const req = makeReq({
      user: { id: 'usr-ph', role: 'pharmacist' },
      params: { id: VALID_UUID },
      body: { status: 'dispensed' },
    })
    const res = makeRes()
    const next = jest.fn()

    await updateStatus(req, res, next)

    expect(res.json.mock.calls[0][0].data.status).toBe('dispensed')
  })

  test('prescribing doctor can cancel prescription', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [RX_DB] })
      .mockResolvedValueOnce({ rows: [{ id: VALID_UUID, status: 'cancelled' }] })
      .mockResolvedValueOnce({ rows: [{ user_id: 'usr-pat' }] })

    const req = makeReq({
      user: { id: 'usr-doc', role: 'doctor' },
      params: { id: VALID_UUID },
      body: { status: 'cancelled' },
    })
    const res = makeRes()
    const next = jest.fn()

    await updateStatus(req, res, next)

    expect(res.json.mock.calls[0][0].data.status).toBe('cancelled')
  })

  test('returns 400 for invalid status', async () => {
    const req = makeReq({
      user: { id: 'usr-ph', role: 'pharmacist' },
      params: { id: VALID_UUID },
      body: { status: 'pending' },
    })
    const res = makeRes()
    const next = jest.fn()

    await updateStatus(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('returns 404 when prescription not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })

    const req = makeReq({
      user: { id: 'usr-ph', role: 'pharmacist' },
      params: { id: VALID_UUID },
      body: { status: 'dispensed' },
    })
    const res = makeRes()
    const next = jest.fn()

    await updateStatus(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
  })

  test('returns 403 when unrelated user tries to update', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [RX_DB] })

    const req = makeReq({
      user: { id: 'usr-nurse', role: 'nurse' },
      params: { id: VALID_UUID },
      body: { status: 'dispensed' },
    })
    const res = makeRes()
    const next = jest.fn()

    await updateStatus(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
  })
})
