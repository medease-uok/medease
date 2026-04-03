const mockQuery = jest.fn()
const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
}
const mockGetClient = jest.fn()

// UUID constants for test data
const PATIENT_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const PATIENT_NONEXISTENT_UUID = 'a1aabb99-9c0b-4ef8-bb6d-6bb9bd380a99'
const USER_LAB_UUID = 'b1ffcc99-9c0b-4ef8-bb6d-6bb9bd380a22'
const USER_PAT_UUID = 'c2ffdd99-9c0b-4ef8-bb6d-6bb9bd380a33'
const DOCTOR_UUID = 'd3aaee99-9c0b-4ef8-bb6d-6bb9bd380a44'
const REPORT_UUID = 'e4bbff99-9c0b-4ef8-bb6d-6bb9bd380a55'
const REQUEST_UUID = 'f5ccaa99-9c0b-4ef8-bb6d-6bb9bd380a66'

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
jest.mock('../../middleware/upload', () => ({
  uploadLabReportToS3: jest.fn().mockResolvedValue(`lab-reports/${PATIENT_UUID}/file.pdf`),
  getPresignedImageUrl: jest.fn().mockResolvedValue('https://s3.example.com/presigned'),
  deleteFromS3: jest.fn().mockResolvedValue(undefined),
}))

const { getAll, create, update } = require('../../controllers/labReports.controller')

function makeReq(overrides = {}) {
  return {
    user: { id: USER_LAB_UUID, role: 'lab_technician', patientId: null },
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
  mockClient.query.mockReset()
  mockClient.release.mockReset()
  mockGetClient.mockReset().mockResolvedValue(mockClient)
  jest.clearAllMocks()
})

// ──────────────────────────────────────────────────────────────
// GET ALL
// ──────────────────────────────────────────────────────────────
describe('getAll', () => {
  const REPORT_ROW = {
    id: REPORT_UUID, patient_id: PATIENT_UUID, technician_id: USER_LAB_UUID,
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
  const PATIENT_ROW = { id: PATIENT_UUID, user_id: USER_PAT_UUID, first_name: 'John', last_name: 'Doe' }

  test('creates a lab report successfully', async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [] })                              // BEGIN
      .mockResolvedValueOnce({ rows: [PATIENT_ROW] })                   // patientCheck
      .mockResolvedValueOnce({ rows: [{ id: 'lr-new' }] })              // INSERT
      .mockResolvedValueOnce({ rows: [] })                              // COMMIT

    const req = makeReq({
      body: { patientId: PATIENT_UUID, testName: 'Blood CBC', result: 'Normal', notes: null },
    })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json.mock.calls[0][0].data.id).toBe('lr-new')
    expect(mockClient.release).toHaveBeenCalled()
  })

  test('returns 400 when patientId is missing', async () => {
    const req = makeReq({ body: { testName: 'Blood CBC' } })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('returns 400 when testName is missing', async () => {
    const req = makeReq({ body: { patientId: PATIENT_UUID } })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('returns 404 when patient not found', async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [] })                              // BEGIN
      .mockResolvedValueOnce({ rows: [] })                              // patientCheck - empty
      .mockResolvedValueOnce({ rows: [] })                              // ROLLBACK

    const req = makeReq({ body: { patientId: PATIENT_NONEXISTENT_UUID, testName: 'Blood CBC' } })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
    expect(mockClient.release).toHaveBeenCalled()
  })

  test('technician ID comes from req.user.id', async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [] })                              // BEGIN
      .mockResolvedValueOnce({ rows: [PATIENT_ROW] })                   // patientCheck
      .mockResolvedValueOnce({ rows: [{ id: 'lr-new' }] })              // INSERT
      .mockResolvedValueOnce({ rows: [] })                              // COMMIT

    const req = makeReq({
      user: { id: USER_LAB_UUID, role: 'lab_technician' },
      body: { patientId: PATIENT_UUID, testName: 'Lipid Panel', result: 'High cholesterol' },
    })
    const res = makeRes()
    await create(req, res, jest.fn())

    const insertCall = mockClient.query.mock.calls[2]  // 0=BEGIN, 1=patientCheck, 2=INSERT
    expect(insertCall[1]).toContain(USER_LAB_UUID)
  })

  test('links lab report to test request when labTestRequestId provided', async () => {
    const REQUEST_ROW = {
      id: 'ltr-1',
      doctor_id: DOCTOR_UUID,
      test_name: 'Blood CBC',
      patient_id: PATIENT_UUID,
      department: 'Cardiology',
      doctor_user_id: 'usr-doc',
      doctor_first_name: 'Kamal',
      doctor_last_name: 'Perera',
    }

    mockClient.query
      .mockResolvedValueOnce({ rows: [] })                              // BEGIN
      .mockResolvedValueOnce({ rows: [PATIENT_ROW] })                   // patientCheck
      .mockResolvedValueOnce({ rows: [REQUEST_ROW] })                   // requestCheck
      .mockResolvedValueOnce({ rows: [{ id: 'lr-new' }] })              // INSERT lab_report
      .mockResolvedValueOnce({ rows: [] })                              // UPDATE lab_test_requests
      .mockResolvedValueOnce({ rows: [] })                              // COMMIT

    mockQuery.mockResolvedValue({ rows: [] })                           // notify nurses query

    const req = makeReq({
      body: {
        patientId: PATIENT_UUID,
        testName: 'Blood CBC',
        result: 'Normal',
        labTestRequestId: 'ltr-1',
      },
    })
    const res = makeRes()
    await create(req, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(201)

    // Verify UPDATE query was called to set status='completed'
    const updateCall = mockClient.query.mock.calls[4]
    expect(updateCall[0]).toContain('UPDATE lab_test_requests')
    expect(updateCall[0]).toContain("status = 'completed'")
    expect(updateCall[1]).toEqual(['lr-new', 'ltr-1'])
  })

  test('returns 404 when lab test request not found', async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [] })                              // BEGIN
      .mockResolvedValueOnce({ rows: [PATIENT_ROW] })                   // patientCheck
      .mockResolvedValueOnce({ rows: [] })                              // requestCheck - empty
      .mockResolvedValueOnce({ rows: [] })                              // ROLLBACK

    const req = makeReq({
      body: {
        patientId: PATIENT_UUID,
        testName: 'Blood CBC',
        labTestRequestId: REQUEST_UUID,
      },
    })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
    expect(mockClient.release).toHaveBeenCalled()
  })

  test('notifies patient, doctor, and nurses when linked to request', async () => {
    const { createNotification } = require('../../controllers/notifications.controller')

    const REQUEST_ROW = {
      id: 'ltr-1',
      doctor_id: DOCTOR_UUID,
      test_name: 'Blood CBC',
      patient_id: PATIENT_UUID,
      department: 'Cardiology',
      doctor_user_id: 'usr-doc',
      doctor_first_name: 'Kamal',
      doctor_last_name: 'Perera',
    }

    mockClient.query
      .mockResolvedValueOnce({ rows: [] })                              // BEGIN
      .mockResolvedValueOnce({ rows: [PATIENT_ROW] })                   // patientCheck
      .mockResolvedValueOnce({ rows: [REQUEST_ROW] })                   // requestCheck
      .mockResolvedValueOnce({ rows: [{ id: 'lr-new' }] })              // INSERT
      .mockResolvedValueOnce({ rows: [] })                              // UPDATE
      .mockResolvedValueOnce({ rows: [] })                              // COMMIT

    mockQuery.mockResolvedValue({ rows: [{ id: 'usr-nurse-1' }, { id: 'usr-nurse-2' }] })

    const req = makeReq({
      body: {
        patientId: PATIENT_UUID,
        testName: 'Blood CBC',
        result: 'Normal',
        labTestRequestId: 'ltr-1',
      },
    })
    const res = makeRes()
    await create(req, res, jest.fn())

    // Should notify patient
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: USER_PAT_UUID,
        type: 'lab_report_ready',
      })
    )

    // Should notify requesting doctor
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: 'usr-doc',
        type: 'lab_report_ready',
        message: expect.stringContaining('John Doe'),
      })
    )

    // Nurses query should check for department
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('department = $1'),
      ['Cardiology']
    )
  })

  test('handles file upload when file provided', async () => {
    const { uploadLabReportToS3 } = require('../../middleware/upload')

    mockClient.query
      .mockResolvedValueOnce({ rows: [] })                              // BEGIN
      .mockResolvedValueOnce({ rows: [PATIENT_ROW] })                   // patientCheck
      .mockResolvedValueOnce({ rows: [{ id: 'lr-new' }] })              // INSERT
      .mockResolvedValueOnce({ rows: [] })                              // COMMIT

    const req = makeReq({
      body: { patientId: PATIENT_UUID, testName: 'Blood CBC', result: 'Normal' },
      file: { buffer: Buffer.from('test'), originalname: 'report.pdf', mimetype: 'application/pdf' },
    })
    const res = makeRes()
    await create(req, res, jest.fn())

    expect(uploadLabReportToS3).toHaveBeenCalledWith(req.file, PATIENT_UUID)

    // Verify INSERT includes file_key and file_name
    const insertCall = mockClient.query.mock.calls[2]
    expect(insertCall[1]).toContain(`lab-reports/${PATIENT_UUID}/file.pdf`)  // file_key
    expect(insertCall[1]).toContain('report.pdf')                              // file_name
  })
})

// ──────────────────────────────────────────────────────────────
// UPDATE
// ──────────────────────────────────────────────────────────────
describe('update', () => {
  const REPORT_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

  test('updates lab report result', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: REPORT_UUID, patient_id: PATIENT_UUID, test_name: 'Blood CBC' }] })
      .mockResolvedValue({ rows: [{ user_id: USER_PAT_UUID }] })

    const req = makeReq({
      params: { id: REPORT_UUID },
      body: { result: 'Elevated WBC', notes: 'Follow up needed' },
    })
    const res = makeRes()
    const next = jest.fn()

    await update(req, res, next)

    expect(res.json.mock.calls[0][0].data.id).toBe(REPORT_UUID)
  })

  test('updates notes only', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: REPORT_UUID, patient_id: PATIENT_UUID, test_name: 'Blood CBC' }] })
      .mockResolvedValue({ rows: [] })

    const req = makeReq({
      params: { id: REPORT_UUID },
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
      params: { id: REPORT_UUID },
      body: { result: 'Normal' },
    })
    const res = makeRes()
    const next = jest.fn()

    await update(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
  })
})
