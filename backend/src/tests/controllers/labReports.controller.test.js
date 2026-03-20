const mockQuery = jest.fn()

jest.mock('../../config/database', () => ({
  query: (...args) => mockQuery(...args),
}))

jest.mock('../../utils/auditLog', () => jest.fn().mockResolvedValue(undefined))
jest.mock('../../utils/abac', () => ({
  buildAccessFilter: jest.fn().mockResolvedValue({ clause: 'TRUE', params: [] }),
}))
jest.mock('../../controllers/notifications.controller', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
}))

const { getAll, create, update } = require('../../controllers/labReports.controller')

function makeReq(overrides = {}) {
  return {
    user: { id: 'usr-lab', role: 'lab_technician', patientId: null },
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
  jest.clearAllMocks()
})

// ──────────────────────────────────────────────────────────────
// GET ALL
// ──────────────────────────────────────────────────────────────
describe('getAll', () => {
  const REPORT_ROW = {
    id: 'lr-1', patient_id: 'pat-1', technician_id: 'usr-lab',
    test_name: 'Blood CBC', result: 'Normal', notes: null,
    report_date: '2026-03-20', patient_name: 'John Doe', technician_name: 'Nimal W',
  }

  test('returns lab report list', async () => {
    mockQuery.mockResolvedValue({ rows: [REPORT_ROW] })

    const req = makeReq()
    const res = makeRes()
    await getAll(req, res, jest.fn())

    const body = res.json.mock.calls[0][0]
    expect(body.status).toBe('success')
    expect(body.data).toHaveLength(1)
    expect(body.data[0].testName).toBe('Blood CBC')
  })

  test('returns empty array when no reports', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    const req = makeReq()
    const res = makeRes()
    await getAll(req, res, jest.fn())

    expect(res.json.mock.calls[0][0].data).toEqual([])
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
  const PATIENT_ROW = { id: 'pat-1', user_id: 'usr-pat', first_name: 'John', last_name: 'Doe' }

  test('creates a lab report successfully', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [PATIENT_ROW] })                  // patientCheck
      .mockResolvedValueOnce({ rows: [{ id: 'lr-new' }] })             // INSERT
      .mockResolvedValue({ rows: [] })                                  // notify doctors query

    const req = makeReq({
      body: { patientId: 'pat-1', testName: 'Blood CBC', result: 'Normal', notes: null },
    })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json.mock.calls[0][0].data.id).toBe('lr-new')
  })

  test('returns 400 when patientId is missing', async () => {
    const req = makeReq({ body: { testName: 'Blood CBC' } })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('returns 400 when testName is missing', async () => {
    const req = makeReq({ body: { patientId: 'pat-1' } })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('returns 404 when patient not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })

    const req = makeReq({ body: { patientId: 'pat-nonexistent', testName: 'Blood CBC' } })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
  })

  test('technician ID comes from req.user.id', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [PATIENT_ROW] })
      .mockResolvedValueOnce({ rows: [{ id: 'lr-new' }] })
      .mockResolvedValue({ rows: [] })

    const req = makeReq({
      user: { id: 'usr-lab-99', role: 'lab_technician' },
      body: { patientId: 'pat-1', testName: 'Lipid Panel', result: 'High cholesterol' },
    })
    const res = makeRes()
    await create(req, res, jest.fn())

    const insertCall = mockQuery.mock.calls[1]
    expect(insertCall[1]).toContain('usr-lab-99')
  })
})

// ──────────────────────────────────────────────────────────────
// UPDATE
// ──────────────────────────────────────────────────────────────
describe('update', () => {
  const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

  test('updates lab report result', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: VALID_UUID, patient_id: 'pat-1', test_name: 'Blood CBC' }] })
      .mockResolvedValue({ rows: [{ user_id: 'usr-pat' }] })

    const req = makeReq({
      params: { id: VALID_UUID },
      body: { result: 'Elevated WBC', notes: 'Follow up needed' },
    })
    const res = makeRes()
    const next = jest.fn()

    await update(req, res, next)

    expect(res.json.mock.calls[0][0].data.id).toBe(VALID_UUID)
  })

  test('updates notes only', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: VALID_UUID, patient_id: 'pat-1', test_name: 'Blood CBC' }] })
      .mockResolvedValue({ rows: [] })

    const req = makeReq({
      params: { id: VALID_UUID },
      body: { notes: 'Additional note' },
    })
    const res = makeRes()
    const next = jest.fn()

    await update(req, res, next)

    expect(res.json.mock.calls[0][0].status).toBe('success')
  })

  test('returns 404 when report not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })

    const req = makeReq({
      params: { id: VALID_UUID },
      body: { result: 'Normal' },
    })
    const res = makeRes()
    const next = jest.fn()

    await update(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
  })
})
