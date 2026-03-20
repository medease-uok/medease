const mockQuery = jest.fn()

jest.mock('../../config/database', () => ({
  query: (...args) => mockQuery(...args),
}))

const { getAll, create, update, remove, reorder } = require('../../controllers/doctorTasks.controller')

function makeReq(overrides = {}) {
  return {
    doctorId: 'doc-1',
    params: {},
    body: {},
    ip: '127.0.0.1',
    ...overrides,
  }
}

function makeRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() }
}

const TASK_ROW = {
  id: 'task-uuid-1',
  title: 'Review patient chart',
  is_completed: false,
  priority: 0,
  due_date: '2026-03-25',
  created_at: '2026-03-20T00:00:00Z',
  updated_at: '2026-03-20T00:00:00Z',
}

beforeEach(() => {
  mockQuery.mockReset()
})

// ──────────────────────────────────────────────────────────────
// GET ALL
// ──────────────────────────────────────────────────────────────
describe('getAll', () => {
  test('returns task list for doctor', async () => {
    mockQuery.mockResolvedValue({ rows: [TASK_ROW] })

    const req = makeReq()
    const res = makeRes()
    await getAll(req, res, jest.fn())

    const body = res.json.mock.calls[0][0]
    expect(body.status).toBe('success')
    expect(body.data).toHaveLength(1)
    expect(body.data[0].title).toBe('Review patient chart')
    expect(body.data[0].isCompleted).toBe(false)
  })

  test('formats rows correctly (snake_case → camelCase)', async () => {
    mockQuery.mockResolvedValue({ rows: [TASK_ROW] })

    const req = makeReq()
    const res = makeRes()
    await getAll(req, res, jest.fn())

    const task = res.json.mock.calls[0][0].data[0]
    expect(task).toHaveProperty('isCompleted')
    expect(task).toHaveProperty('dueDate')
    expect(task).toHaveProperty('createdAt')
    expect(task).not.toHaveProperty('is_completed')
    expect(task).not.toHaveProperty('due_date')
  })

  test('passes doctorId to query', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    const req = makeReq({ doctorId: 'doc-99' })
    const res = makeRes()
    await getAll(req, res, jest.fn())

    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ['doc-99'])
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
  test('creates a task and returns 201', async () => {
    mockQuery.mockResolvedValue({ rows: [TASK_ROW] })

    const req = makeReq({ body: { title: 'Review patient chart', dueDate: '2026-03-25' } })
    const res = makeRes()
    const next = jest.fn()

    await create(req, res, next)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json.mock.calls[0][0].data.title).toBe('Review patient chart')
  })

  test('creates task without dueDate (null)', async () => {
    mockQuery.mockResolvedValue({ rows: [{ ...TASK_ROW, due_date: null }] })

    const req = makeReq({ body: { title: 'Quick task' } })
    const res = makeRes()
    await create(req, res, jest.fn())

    const insertCall = mockQuery.mock.calls[0][1]
    expect(insertCall[2]).toBeNull()
  })

  test('trims title whitespace', async () => {
    mockQuery.mockResolvedValue({ rows: [TASK_ROW] })

    const req = makeReq({ body: { title: '  Review patient  ' } })
    const res = makeRes()
    await create(req, res, jest.fn())

    const insertCall = mockQuery.mock.calls[0][1]
    expect(insertCall[1]).toBe('Review patient')
  })

  test('calls next on database error', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'))

    const next = jest.fn()
    await create(makeReq({ body: { title: 'test' } }), makeRes(), next)

    expect(next).toHaveBeenCalledWith(expect.any(Error))
  })
})

// ──────────────────────────────────────────────────────────────
// UPDATE
// ──────────────────────────────────────────────────────────────
describe('update', () => {
  const TASK_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

  test('updates title successfully', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: TASK_UUID }] }) // ownership check
      .mockResolvedValueOnce({ rows: [{ ...TASK_ROW, id: TASK_UUID, title: 'Updated title' }] })

    const req = makeReq({ params: { id: TASK_UUID }, body: { title: 'Updated title' } })
    const res = makeRes()
    const next = jest.fn()

    await update(req, res, next)

    expect(res.json.mock.calls[0][0].data.title).toBe('Updated title')
  })

  test('marks task as completed', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: TASK_UUID }] })
      .mockResolvedValueOnce({ rows: [{ ...TASK_ROW, id: TASK_UUID, is_completed: true }] })

    const req = makeReq({ params: { id: TASK_UUID }, body: { isCompleted: true } })
    const res = makeRes()
    await update(req, res, jest.fn())

    expect(res.json.mock.calls[0][0].data.isCompleted).toBe(true)
  })

  test('returns 400 when no updatable fields provided', async () => {
    const req = makeReq({ params: { id: TASK_UUID }, body: {} })
    const res = makeRes()
    const next = jest.fn()

    await update(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('returns 404 when task not found or not owned by doctor', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })

    const req = makeReq({ params: { id: TASK_UUID }, body: { title: 'New title' } })
    const res = makeRes()
    const next = jest.fn()

    await update(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
  })
})

// ──────────────────────────────────────────────────────────────
// REMOVE
// ──────────────────────────────────────────────────────────────
describe('remove', () => {
  const TASK_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

  test('deletes task and returns id', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: TASK_UUID }] })

    const req = makeReq({ params: { id: TASK_UUID } })
    const res = makeRes()
    const next = jest.fn()

    await remove(req, res, next)

    expect(res.json.mock.calls[0][0].data.id).toBe(TASK_UUID)
  })

  test('returns 404 when task not found or not owned', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    const req = makeReq({ params: { id: TASK_UUID } })
    const res = makeRes()
    const next = jest.fn()

    await remove(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
  })
})

// ──────────────────────────────────────────────────────────────
// REORDER
// ──────────────────────────────────────────────────────────────
describe('reorder', () => {
  const UUID1 = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  const UUID2 = 'b1ffcd00-0d1c-5fg9-cc7e-7cc0ce491b22'

  test('reorders tasks and returns updated list', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: UUID1 }, { id: UUID2 }] }) // ownership
      .mockResolvedValueOnce(undefined)                                 // bulk UPDATE
      .mockResolvedValueOnce({ rows: [TASK_ROW, { ...TASK_ROW, id: UUID2 }] }) // final list

    const req = makeReq({ body: { orderedIds: [UUID1, UUID2] } })
    const res = makeRes()
    const next = jest.fn()

    await reorder(req, res, next)

    expect(res.json.mock.calls[0][0].status).toBe('success')
    expect(res.json.mock.calls[0][0].data).toHaveLength(2)
  })

  test('returns 404 when some tasks do not belong to doctor', async () => {
    // Only 1 row returned but 2 IDs sent → mismatch
    mockQuery.mockResolvedValueOnce({ rows: [{ id: UUID1 }] })

    const req = makeReq({ body: { orderedIds: [UUID1, UUID2] } })
    const res = makeRes()
    const next = jest.fn()

    await reorder(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))
  })
})
