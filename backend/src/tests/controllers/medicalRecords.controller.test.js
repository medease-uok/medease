const mockQuery = jest.fn()

jest.mock('../../config/database', () => ({
  query: (...args) => mockQuery(...args),
}))

jest.mock('../../utils/abac', () => ({
  buildAccessFilter: jest.fn().mockResolvedValue({ clause: '1=1', params: [] }),
}))

jest.mock('../../utils/auditLog', () => jest.fn().mockResolvedValue())

jest.mock('../../../src/controllers/notifications.controller', () => ({
  createNotification: jest.fn(),
}))

const { getAll, create } = require('../../controllers/medicalRecords.controller')

const DOCTOR_USER = {
  id: 'user-doc-1',
  role: 'doctor',
  doctorId: 'doc-1',
  patientId: null,
}

const RECORD_ROW = {
  id: 'rec-1',
  patient_id: 'pat-1',
  doctor_id: 'doc-1',
  patient_name: 'Sarah Fernando',
  doctor_name: 'Dr. Kamal Perera',
  diagnosis: 'Hypertension',
  icd_code: 'I10',
  icd_description: 'Essential (primary) hypertension',
  treatment: 'Amlodipine 5mg',
  notes: 'BP elevated',
  created_at: '2026-03-20T00:00:00Z',
}

function makeReq(overrides = {}) {
  return {
    user: DOCTOR_USER,
    body: {},
    params: {},
    ip: '127.0.0.1',
    ...overrides,
  }
}

function makeRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() }
}

beforeEach(() => {
  mockQuery.mockReset()
})

// ──────────────────────────────────────────────────────────────
// GET ALL
// ──────────────────────────────────────────────────────────────
describe('getAll', () => {
  test('returns records with ICD code and description', async () => {
    mockQuery.mockResolvedValue({ rows: [RECORD_ROW] })

    const req = makeReq()
    const res = makeRes()
    await getAll(req, res, jest.fn())

    const body = res.json.mock.calls[0][0]
    expect(body.status).toBe('success')
    expect(body.data).toHaveLength(1)
    expect(body.data[0].icdCode).toBe('I10')
    expect(body.data[0].icdDescription).toBe('Essential (primary) hypertension')
  })

  test('maps null ICD fields correctly', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ ...RECORD_ROW, icd_code: null, icd_description: null }],
    })

    const req = makeReq()
    const res = makeRes()
    await getAll(req, res, jest.fn())

    const record = res.json.mock.calls[0][0].data[0]
    expect(record.icdCode).toBeNull()
    expect(record.icdDescription).toBeNull()
  })

  test('maps snake_case to camelCase', async () => {
    mockQuery.mockResolvedValue({ rows: [RECORD_ROW] })

    const req = makeReq()
    const res = makeRes()
    await getAll(req, res, jest.fn())

    const record = res.json.mock.calls[0][0].data[0]
    expect(record).toHaveProperty('patientId')
    expect(record).toHaveProperty('doctorId')
    expect(record).toHaveProperty('patientName')
    expect(record).toHaveProperty('createdAt')
    expect(record).not.toHaveProperty('patient_id')
    expect(record).not.toHaveProperty('created_at')
  })

  test('calls next on database error', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'))

    const next = jest.fn()
    await getAll(makeReq(), makeRes(), next)

    expect(next).toHaveBeenCalledWith(expect.any(Error))
  })
})

// ──────────────────────────────────────────────────────────────
// CREATE
// ──────────────────────────────────────────────────────────────
describe('create', () => {
  const PATIENT_ROW = { id: 'pat-1', user_id: 'user-pat-1', first_name: 'Sarah', last_name: 'Fernando' }
  const DOCTOR_ROW = { first_name: 'Kamal', last_name: 'Perera' }

  function setupCreateMocks(insertResult = { rows: [{ id: 'new-rec-1' }] }) {
    mockQuery
      .mockResolvedValueOnce({ rows: [PATIENT_ROW] })  // patient check
      .mockResolvedValueOnce({ rows: [DOCTOR_ROW] })    // doctor info
      .mockResolvedValueOnce(insertResult)               // INSERT
  }

  test('creates record with valid ICD code', async () => {
    setupCreateMocks()

    const req = makeReq({
      body: { patientId: 'pat-1', diagnosis: 'Type 2 DM', icdCode: 'E11.9' },
    })
    const res = makeRes()
    await create(req, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json.mock.calls[0][0].data.id).toBe('new-rec-1')

    // Verify icdCode passed as $7
    const insertParams = mockQuery.mock.calls[2][1]
    expect(insertParams[6]).toBe('E11.9')
  })

  test('creates record without ICD code (null)', async () => {
    setupCreateMocks()

    const req = makeReq({
      body: { patientId: 'pat-1', diagnosis: 'General checkup' },
    })
    const res = makeRes()
    await create(req, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(201)
    const insertParams = mockQuery.mock.calls[2][1]
    expect(insertParams[6]).toBeNull()
  })

  test('trims ICD code whitespace', async () => {
    setupCreateMocks()

    const req = makeReq({
      body: { patientId: 'pat-1', diagnosis: 'Asthma', icdCode: '  J45.9  ' },
    })
    const res = makeRes()
    await create(req, res, jest.fn())

    const insertParams = mockQuery.mock.calls[2][1]
    expect(insertParams[6]).toBe('J45.9')
  })

  test('empty ICD code string treated as null', async () => {
    setupCreateMocks()

    const req = makeReq({
      body: { patientId: 'pat-1', diagnosis: 'Checkup', icdCode: '   ' },
    })
    const res = makeRes()
    await create(req, res, jest.fn())

    const insertParams = mockQuery.mock.calls[2][1]
    expect(insertParams[6]).toBeNull()
  })

  test('returns 400 for invalid ICD code (FK violation)', async () => {
    const fkError = new Error('insert or update on table "medical_records" violates foreign key constraint')
    fkError.code = '23503'
    fkError.constraint = 'medical_records_icd_code_fkey'

    mockQuery
      .mockResolvedValueOnce({ rows: [PATIENT_ROW] })
      .mockResolvedValueOnce({ rows: [DOCTOR_ROW] })
      .mockRejectedValueOnce(fkError)

    const req = makeReq({
      body: { patientId: 'pat-1', diagnosis: 'Test', icdCode: 'INVALID' },
    })
    const res = makeRes()
    const next = jest.fn()
    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 400,
      message: 'Invalid ICD-10 code.',
    }))
  })

  test('non-ICD FK violation is re-thrown', async () => {
    const fkError = new Error('violates foreign key constraint')
    fkError.code = '23503'
    fkError.constraint = 'medical_records_patient_id_fkey'

    mockQuery
      .mockResolvedValueOnce({ rows: [PATIENT_ROW] })
      .mockResolvedValueOnce({ rows: [DOCTOR_ROW] })
      .mockRejectedValueOnce(fkError)

    const req = makeReq({
      body: { patientId: 'pat-1', diagnosis: 'Test', icdCode: 'I10' },
    })
    const res = makeRes()
    const next = jest.fn()
    await create(req, res, next)

    // Should be passed to next as a generic error, not the ICD-specific 400
    const passedErr = next.mock.calls[0][0]
    expect(passedErr.code).toBe('23503')
    expect(passedErr).not.toHaveProperty('statusCode')
  })

  test('returns 400 when patientId missing', async () => {
    const req = makeReq({ body: { diagnosis: 'Test' } })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('returns 400 when diagnosis missing', async () => {
    const req = makeReq({ body: { patientId: 'pat-1' } })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('returns 403 when user is not a doctor', async () => {
    const req = makeReq({
      user: { ...DOCTOR_USER, doctorId: null, role: 'patient' },
      body: { patientId: 'pat-1', diagnosis: 'Test' },
    })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
  })

  test('returns 404 when patient not found', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })  // patient not found
      .mockResolvedValueOnce({ rows: [DOCTOR_ROW] })

    const req = makeReq({
      body: { patientId: 'nonexistent', diagnosis: 'Test' },
    })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
  })

  test('calls next on generic database error', async () => {
    mockQuery.mockRejectedValue(new Error('Connection lost'))

    const req = makeReq({
      body: { patientId: 'pat-1', diagnosis: 'Test' },
    })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(Error))
  })
})
