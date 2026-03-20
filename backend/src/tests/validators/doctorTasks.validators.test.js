const validate = require('../../middleware/validate')
const {
  createTaskValidation,
  updateTaskValidation,
  taskIdValidation,
  reorderValidation,
} = require('../../validators/doctorTasks.validators')

const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

function runValidation(validations, body = {}, params = {}) {
  return new Promise((resolve) => {
    const req = { body, params, query: {}, headers: {} }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    const middleware = validate(validations)
    middleware(req, res, () => resolve({ passed: true, req, res }))

    setTimeout(() => {
      if (res.json.mock.calls.length > 0) {
        resolve({ passed: false, body: res.json.mock.calls[0][0] })
      }
    }, 100)
  })
}

describe('createTaskValidation', () => {
  test('passes with title only', async () => {
    const result = await runValidation(createTaskValidation, { title: 'Do something' })
    expect(result.passed).toBe(true)
  })

  test('passes with title and dueDate', async () => {
    const result = await runValidation(createTaskValidation, { title: 'Task', dueDate: '2026-12-31' })
    expect(result.passed).toBe(true)
  })

  test('fails when title is missing', async () => {
    const result = await runValidation(createTaskValidation, {})
    expect(result.passed).toBe(false)
    expect(result.body.errors[0].field).toBe('title')
  })

  test('fails when title is empty string', async () => {
    const result = await runValidation(createTaskValidation, { title: '' })
    expect(result.passed).toBe(false)
  })

  test('fails when title exceeds 255 characters', async () => {
    const result = await runValidation(createTaskValidation, { title: 'a'.repeat(256) })
    expect(result.passed).toBe(false)
  })

  test('fails for invalid dueDate format', async () => {
    const result = await runValidation(createTaskValidation, { title: 'Task', dueDate: 'not-a-date' })
    expect(result.passed).toBe(false)
  })

  test('passes when dueDate is null (nullable)', async () => {
    const result = await runValidation(createTaskValidation, { title: 'Task', dueDate: null })
    expect(result.passed).toBe(true)
  })
})

describe('updateTaskValidation', () => {
  test('passes with valid id and title update', async () => {
    const result = await runValidation(updateTaskValidation, { title: 'New title' }, { id: VALID_UUID })
    expect(result.passed).toBe(true)
  })

  test('passes with isCompleted update', async () => {
    const result = await runValidation(updateTaskValidation, { isCompleted: true }, { id: VALID_UUID })
    expect(result.passed).toBe(true)
  })

  test('passes with priority update', async () => {
    const result = await runValidation(updateTaskValidation, { priority: 5 }, { id: VALID_UUID })
    expect(result.passed).toBe(true)
  })

  test('fails for invalid task UUID', async () => {
    const result = await runValidation(updateTaskValidation, { title: 'test' }, { id: 'not-a-uuid' })
    expect(result.passed).toBe(false)
  })

  test('fails when isCompleted is not boolean', async () => {
    const result = await runValidation(updateTaskValidation, { isCompleted: 'yes' }, { id: VALID_UUID })
    expect(result.passed).toBe(false)
  })

  test('fails when priority is negative', async () => {
    const result = await runValidation(updateTaskValidation, { priority: -1 }, { id: VALID_UUID })
    expect(result.passed).toBe(false)
  })

  test('fails when priority exceeds 9999', async () => {
    const result = await runValidation(updateTaskValidation, { priority: 10000 }, { id: VALID_UUID })
    expect(result.passed).toBe(false)
  })

  test('passes priority at boundary (0 and 9999)', async () => {
    const r1 = await runValidation(updateTaskValidation, { priority: 0 }, { id: VALID_UUID })
    const r2 = await runValidation(updateTaskValidation, { priority: 9999 }, { id: VALID_UUID })
    expect(r1.passed).toBe(true)
    expect(r2.passed).toBe(true)
  })
})

describe('taskIdValidation', () => {
  test('passes for valid UUID param', async () => {
    const result = await runValidation(taskIdValidation, {}, { id: VALID_UUID })
    expect(result.passed).toBe(true)
  })

  test('fails for invalid UUID param', async () => {
    const result = await runValidation(taskIdValidation, {}, { id: 'abc-123' })
    expect(result.passed).toBe(false)
  })
})

describe('reorderValidation', () => {
  test('passes with array of valid UUIDs', async () => {
    const result = await runValidation(reorderValidation, { orderedIds: [VALID_UUID] })
    expect(result.passed).toBe(true)
  })

  test('fails when orderedIds is empty', async () => {
    const result = await runValidation(reorderValidation, { orderedIds: [] })
    expect(result.passed).toBe(false)
  })

  test('fails when orderedIds is not an array', async () => {
    const result = await runValidation(reorderValidation, { orderedIds: VALID_UUID })
    expect(result.passed).toBe(false)
  })

  test('fails when an ID in the array is not a valid UUID', async () => {
    const result = await runValidation(reorderValidation, { orderedIds: ['not-a-uuid'] })
    expect(result.passed).toBe(false)
  })

  test('passes with multiple valid UUIDs', async () => {
    const id2 = 'b1234567-e89b-12d3-a456-426614174000'
    const result = await runValidation(reorderValidation, { orderedIds: [VALID_UUID, id2] })
    expect(result.passed).toBe(true)
  })
})
