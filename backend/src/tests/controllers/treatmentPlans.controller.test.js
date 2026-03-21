const mockQuery = jest.fn()
const mockClientQuery = jest.fn()
const mockClient = {
  query: (...args) => mockClientQuery(...args),
  release: jest.fn(),
}

jest.mock('../../config/database', () => ({
  query: (...args) => mockQuery(...args),
  getClient: jest.fn().mockResolvedValue(mockClient),
}))

jest.mock('../../utils/patientAccess', () => ({
  assertPatientAccess: jest.fn().mockResolvedValue(),
}))

jest.mock('../../utils/auditLog', () => jest.fn().mockResolvedValue())

jest.mock('../../../src/controllers/notifications.controller', () => ({
  createNotification: jest.fn().mockReturnValue(Promise.resolve()),
}))

const { getByPatientId, getById, create, update, remove, addItem, updateItem, removeItem } = require('../../controllers/treatmentPlans.controller')

const DOCTOR_USER = {
  id: 'user-doc-1',
  role: 'doctor',
  doctorId: 'doc-1',
  patientId: null,
}

const ADMIN_USER = {
  id: 'user-admin-1',
  role: 'admin',
  doctorId: null,
  patientId: null,
}

const PLAN_ROW = {
  id: 'plan-1',
  patient_id: 'pat-1',
  doctor_id: 'doc-1',
  doctor_name: 'Dr. Kamal Perera',
  title: 'Diabetes management',
  description: 'Comprehensive plan',
  status: 'active',
  priority: 'high',
  start_date: '2026-03-01',
  end_date: '2026-06-01',
  notes: 'Review monthly',
  item_count: '3',
  completed_item_count: '1',
  created_at: '2026-03-20T00:00:00Z',
  updated_at: '2026-03-20T00:00:00Z',
}

const ITEM_ROW = {
  id: 'item-1',
  plan_id: 'plan-1',
  title: 'Blood glucose monitoring',
  description: 'Check daily',
  is_completed: false,
  due_date: '2026-04-01',
  completed_at: null,
  sort_order: 0,
  created_at: '2026-03-20T00:00:00Z',
}

function makeReq(overrides = {}) {
  return {
    user: DOCTOR_USER,
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
  mockClient.release.mockClear()
})

// ──────────────────────────────────────────────────────────────
// GET BY PATIENT ID
// ──────────────────────────────────────────────────────────────
describe('getByPatientId', () => {
  test('returns treatment plans for patient', async () => {
    mockQuery.mockResolvedValue({ rows: [PLAN_ROW] })

    const req = makeReq({ params: { patientId: 'pat-1' } })
    const res = makeRes()
    await getByPatientId(req, res, jest.fn())

    const body = res.json.mock.calls[0][0]
    expect(body.status).toBe('success')
    expect(body.data).toHaveLength(1)
    expect(body.data[0].title).toBe('Diabetes management')
    expect(body.data[0].itemCount).toBe(3)
    expect(body.data[0].completedItemCount).toBe(1)
  })

  test('maps snake_case to camelCase', async () => {
    mockQuery.mockResolvedValue({ rows: [PLAN_ROW] })

    const req = makeReq({ params: { patientId: 'pat-1' } })
    const res = makeRes()
    await getByPatientId(req, res, jest.fn())

    const plan = res.json.mock.calls[0][0].data[0]
    expect(plan).toHaveProperty('patientId')
    expect(plan).toHaveProperty('doctorId')
    expect(plan).toHaveProperty('doctorName')
    expect(plan).toHaveProperty('startDate')
    expect(plan).toHaveProperty('endDate')
    expect(plan).not.toHaveProperty('patient_id')
    expect(plan).not.toHaveProperty('doctor_name')
  })

  test('calls next on error', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'))

    const next = jest.fn()
    await getByPatientId(makeReq({ params: { patientId: 'pat-1' } }), makeRes(), next)

    expect(next).toHaveBeenCalledWith(expect.any(Error))
  })
})

// ──────────────────────────────────────────────────────────────
// GET BY ID
// ──────────────────────────────────────────────────────────────
describe('getById', () => {
  test('returns plan with items', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [PLAN_ROW] })
      .mockResolvedValueOnce({ rows: [ITEM_ROW] })

    const req = makeReq({ params: { patientId: 'pat-1', id: 'plan-1' } })
    const res = makeRes()
    await getById(req, res, jest.fn())

    const body = res.json.mock.calls[0][0]
    expect(body.data.title).toBe('Diabetes management')
    expect(body.data.items).toHaveLength(1)
    expect(body.data.items[0].title).toBe('Blood glucose monitoring')
    expect(body.data.items[0].isCompleted).toBe(false)
  })

  test('returns 404 when plan not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })

    const next = jest.fn()
    await getById(makeReq({ params: { patientId: 'pat-1', id: 'nope' } }), makeRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
  })
})

// ──────────────────────────────────────────────────────────────
// CREATE
// ──────────────────────────────────────────────────────────────
describe('create', () => {
  const PATIENT_ROW = { id: 'pat-1', user_id: 'user-pat-1', first_name: 'Sarah', last_name: 'Fernando' }
  const DOCTOR_ROW = { first_name: 'Kamal', last_name: 'Perera' }

  test('creates plan and returns 201', async () => {
    // patientCheck, docInfo (after transaction)
    mockQuery
      .mockResolvedValueOnce({ rows: [PATIENT_ROW] })
      .mockResolvedValueOnce({ rows: [DOCTOR_ROW] })
    // transaction: BEGIN, INSERT plan, COMMIT
    mockClientQuery
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 'new-plan' }] }) // INSERT
      .mockResolvedValueOnce({}) // COMMIT

    const req = makeReq({
      params: { patientId: 'pat-1' },
      body: { title: 'New plan', priority: 'high' },
    })
    const res = makeRes()
    await create(req, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json.mock.calls[0][0].data.id).toBe('new-plan')
    expect(mockClient.release).toHaveBeenCalled()
  })

  test('creates plan with items in transaction', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [PATIENT_ROW] })
      .mockResolvedValueOnce({ rows: [DOCTOR_ROW] })
    mockClientQuery
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 'new-plan' }] }) // INSERT plan
      .mockResolvedValueOnce({}) // INSERT items
      .mockResolvedValueOnce({}) // COMMIT

    const req = makeReq({
      params: { patientId: 'pat-1' },
      body: {
        title: 'New plan',
        items: [
          { title: 'Step 1', description: 'First step', dueDate: '2026-04-01' },
          { title: 'Step 2' },
        ],
      },
    })
    const res = makeRes()
    await create(req, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(201)
    // Verify items INSERT was called
    const itemsCall = mockClientQuery.mock.calls[2]
    expect(itemsCall[0]).toContain('INSERT INTO treatment_plan_items')
  })

  test('rolls back on transaction failure', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [PATIENT_ROW] })
    mockClientQuery
      .mockResolvedValueOnce({}) // BEGIN
      .mockRejectedValueOnce(new Error('DB error')) // INSERT fails
      .mockResolvedValueOnce({}) // ROLLBACK

    const next = jest.fn()
    await create(makeReq({
      params: { patientId: 'pat-1' },
      body: { title: 'Test' },
    }), makeRes(), next)

    expect(next).toHaveBeenCalledWith(expect.any(Error))
    expect(mockClient.release).toHaveBeenCalled()
  })

  test('returns 403 when user is not a doctor', async () => {
    const req = makeReq({
      user: { ...DOCTOR_USER, doctorId: null, role: 'patient' },
      params: { patientId: 'pat-1' },
      body: { title: 'Test' },
    })
    const next = jest.fn()
    await create(req, makeRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
  })

  test('returns 404 when patient not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })

    const req = makeReq({
      params: { patientId: 'nope' },
      body: { title: 'Test' },
    })
    const next = jest.fn()
    await create(req, makeRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
  })
})

// ──────────────────────────────────────────────────────────────
// UPDATE
// ──────────────────────────────────────────────────────────────
describe('update', () => {
  test('updates plan fields for owning doctor', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ doctor_id: 'doc-1' }] }) // ownership check
      .mockResolvedValueOnce({ rows: [{ id: 'plan-1' }] }) // UPDATE

    const req = makeReq({
      params: { patientId: 'pat-1', id: 'plan-1' },
      body: { title: 'Updated', status: 'completed' },
    })
    const res = makeRes()
    await update(req, res, jest.fn())

    expect(res.json.mock.calls[0][0].data.id).toBe('plan-1')
  })

  test('admin can update any plan without ownership check', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'plan-1' }] }) // UPDATE (no ownership query)

    const req = makeReq({
      user: ADMIN_USER,
      params: { patientId: 'pat-1', id: 'plan-1' },
      body: { title: 'Admin update' },
    })
    const res = makeRes()
    await update(req, res, jest.fn())

    expect(res.json.mock.calls[0][0].data.id).toBe('plan-1')
  })

  test('returns 403 when doctor does not own the plan', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ doctor_id: 'doc-other' }] })

    const next = jest.fn()
    await update(makeReq({
      params: { patientId: 'pat-1', id: 'plan-1' },
      body: { title: 'Updated' },
    }), makeRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
  })

  test('returns 400 when no fields provided', async () => {
    const req = makeReq({ params: { patientId: 'pat-1', id: 'plan-1' }, body: {} })
    const next = jest.fn()
    await update(req, makeRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('returns 404 when plan not found', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    const req = makeReq({
      params: { patientId: 'pat-1', id: 'nope' },
      body: { title: 'Updated' },
    })
    const next = jest.fn()
    await update(req, makeRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
  })
})

// ──────────────────────────────────────────────────────────────
// REMOVE
// ──────────────────────────────────────────────────────────────
describe('remove', () => {
  test('deletes plan for owning doctor', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ doctor_id: 'doc-1' }] }) // ownership check
      .mockResolvedValueOnce({ rows: [{ id: 'plan-1', title: 'Test' }] }) // DELETE

    const req = makeReq({ params: { patientId: 'pat-1', id: 'plan-1' } })
    const res = makeRes()
    await remove(req, res, jest.fn())

    expect(res.json.mock.calls[0][0].message).toBe('Treatment plan removed.')
  })

  test('returns 403 when doctor does not own the plan', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ doctor_id: 'doc-other' }] })

    const next = jest.fn()
    await remove(makeReq({ params: { patientId: 'pat-1', id: 'plan-1' } }), makeRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
  })

  test('returns 404 when plan not found', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    const next = jest.fn()
    await remove(makeReq({ params: { patientId: 'pat-1', id: 'nope' } }), makeRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
  })
})

// ──────────────────────────────────────────────────────────────
// ADD ITEM
// ──────────────────────────────────────────────────────────────
describe('addItem', () => {
  test('adds item to plan with atomic sort order', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'plan-1' }] }) // plan check
      .mockResolvedValueOnce({ rows: [ITEM_ROW] }) // atomic INSERT

    const req = makeReq({
      params: { patientId: 'pat-1', id: 'plan-1' },
      body: { title: 'Blood glucose monitoring' },
    })
    const res = makeRes()
    await addItem(req, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json.mock.calls[0][0].data.title).toBe('Blood glucose monitoring')
    // Verify the INSERT uses subquery for sort_order
    const insertCall = mockQuery.mock.calls[1][0]
    expect(insertCall).toContain('COALESCE(MAX(sort_order)')
  })

  test('returns 404 when plan not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })

    const next = jest.fn()
    await addItem(makeReq({
      params: { patientId: 'pat-1', id: 'nope' },
      body: { title: 'Test' },
    }), makeRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
  })
})

// ──────────────────────────────────────────────────────────────
// UPDATE ITEM
// ──────────────────────────────────────────────────────────────
describe('updateItem', () => {
  test('toggles item completion', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ ...ITEM_ROW, is_completed: true, completed_at: '2026-03-20T00:00:00Z' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'plan-1' }] })

    const req = makeReq({
      params: { patientId: 'pat-1', id: 'plan-1', itemId: 'item-1' },
      body: { isCompleted: true },
    })
    const res = makeRes()
    await updateItem(req, res, jest.fn())

    expect(res.json.mock.calls[0][0].data.isCompleted).toBe(true)
  })

  test('returns 400 when no fields provided', async () => {
    const next = jest.fn()
    await updateItem(makeReq({
      params: { patientId: 'pat-1', id: 'plan-1', itemId: 'item-1' },
      body: {},
    }), makeRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('returns 404 when item not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })

    const next = jest.fn()
    await updateItem(makeReq({
      params: { patientId: 'pat-1', id: 'plan-1', itemId: 'nope' },
      body: { isCompleted: true },
    }), makeRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
  })
})

// ──────────────────────────────────────────────────────────────
// REMOVE ITEM
// ──────────────────────────────────────────────────────────────
describe('removeItem', () => {
  test('removes item', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 'item-1' }] })

    const req = makeReq({ params: { patientId: 'pat-1', id: 'plan-1', itemId: 'item-1' } })
    const res = makeRes()
    await removeItem(req, res, jest.fn())

    expect(res.json.mock.calls[0][0].message).toBe('Item removed.')
  })

  test('returns 404 when item not found', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    const next = jest.fn()
    await removeItem(makeReq({
      params: { patientId: 'pat-1', id: 'plan-1', itemId: 'nope' },
    }), makeRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
  })
})
