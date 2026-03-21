const mockQuery = jest.fn()

jest.mock('../../config/database', () => ({
  query: (...args) => mockQuery(...args),
}))

const { search, getCategories } = require('../../controllers/icd10.controller')

function makeReq(overrides = {}) {
  return {
    query: {},
    ...overrides,
  }
}

function makeRes() {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), set: jest.fn().mockReturnThis() }
  return res
}

beforeEach(() => {
  mockQuery.mockReset()
})

// ──────────────────────────────────────────────────────────────
// SEARCH
// ──────────────────────────────────────────────────────────────
describe('search', () => {
  test('returns results for q search', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ code: 'I10', description: 'Essential hypertension', category: 'Cardiovascular' }],
    })

    const req = makeReq({ query: { q: 'hypertension' } })
    const res = makeRes()
    await search(req, res, jest.fn())

    const body = res.json.mock.calls[0][0]
    expect(body.status).toBe('success')
    expect(body.data).toHaveLength(1)
    expect(body.data[0].code).toBe('I10')
  })

  test('uses separate prefix and search params', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    const req = makeReq({ query: { q: 'E11' } })
    const res = makeRes()
    await search(req, res, jest.fn())

    const queryStr = mockQuery.mock.calls[0][0]
    const params = mockQuery.mock.calls[0][1]

    // $1 = prefix param (E11%), $2 = search param (%E11%), $3 = limit
    expect(params[0]).toBe('E11%')
    expect(params[1]).toBe('%E11%')
    expect(params).toHaveLength(3)

    // ORDER BY should reference $1 for prefix priority
    expect(queryStr).toContain('ILIKE $1')
    // WHERE should reference $2 for search
    expect(queryStr).toContain('ILIKE $2')
  })

  test('category-only search has no prefix ORDER BY', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ code: 'J45.9', description: 'Asthma, unspecified', category: 'Respiratory' }],
    })

    const req = makeReq({ query: { category: 'Respiratory' } })
    const res = makeRes()
    await search(req, res, jest.fn())

    const queryStr = mockQuery.mock.calls[0][0]
    const params = mockQuery.mock.calls[0][1]

    // Should NOT have CASE WHEN in ORDER BY
    expect(queryStr).not.toContain('CASE WHEN')
    // $1 = category, $2 = limit
    expect(params[0]).toBe('Respiratory')
    expect(params).toHaveLength(2)
  })

  test('q + category uses both filters', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    const req = makeReq({ query: { q: 'asthma', category: 'Respiratory' } })
    const res = makeRes()
    await search(req, res, jest.fn())

    const params = mockQuery.mock.calls[0][1]
    // $1 = prefix (asthma%), $2 = search (%asthma%), $3 = category, $4 = limit
    expect(params[0]).toBe('asthma%')
    expect(params[1]).toBe('%asthma%')
    expect(params[2]).toBe('Respiratory')
    expect(params).toHaveLength(4)
  })

  test('no params returns all codes up to limit', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    const req = makeReq({ query: {} })
    const res = makeRes()
    await search(req, res, jest.fn())

    const queryStr = mockQuery.mock.calls[0][0]
    const params = mockQuery.mock.calls[0][1]

    expect(queryStr).not.toContain('WHERE')
    expect(queryStr).not.toContain('CASE WHEN')
    // Only limit param
    expect(params).toHaveLength(1)
    expect(params[0]).toBe(20)
  })

  test('limit is clamped to max 50', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    const req = makeReq({ query: { limit: '100' } })
    const res = makeRes()
    await search(req, res, jest.fn())

    const params = mockQuery.mock.calls[0][1]
    expect(params[params.length - 1]).toBe(50)
  })

  test('limit is clamped to min 1', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    const req = makeReq({ query: { limit: '0' } })
    const res = makeRes()
    const next = jest.fn()
    await search(req, res, next)

    // limit=0 is < 1, so should return 400
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('invalid limit returns 400', async () => {
    const req = makeReq({ query: { q: 'test', limit: 'abc' } })
    const res = makeRes()
    const next = jest.fn()

    await search(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('trims whitespace from q', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    const req = makeReq({ query: { q: '  diabetes  ' } })
    const res = makeRes()
    await search(req, res, jest.fn())

    const params = mockQuery.mock.calls[0][1]
    expect(params[0]).toBe('diabetes%')
    expect(params[1]).toBe('%diabetes%')
  })

  test('empty q is treated as no query', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    const req = makeReq({ query: { q: '   ' } })
    const res = makeRes()
    await search(req, res, jest.fn())

    const queryStr = mockQuery.mock.calls[0][0]
    expect(queryStr).not.toContain('ILIKE')
    expect(queryStr).not.toContain('CASE WHEN')
  })

  test('calls next on database error', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'))

    const next = jest.fn()
    await search(makeReq({ query: { q: 'test' } }), makeRes(), next)

    expect(next).toHaveBeenCalledWith(expect.any(Error))
  })
})

// ──────────────────────────────────────────────────────────────
// GET CATEGORIES
// ──────────────────────────────────────────────────────────────
describe('getCategories', () => {
  test('returns list of category strings', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ category: 'Cardiovascular' }, { category: 'Respiratory' }],
    })

    const req = makeReq()
    const res = makeRes()
    await getCategories(req, res, jest.fn())

    const body = res.json.mock.calls[0][0]
    expect(body.status).toBe('success')
    expect(body.data).toEqual(['Cardiovascular', 'Respiratory'])
  })

  test('sets Cache-Control header', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    const req = makeReq()
    const res = makeRes()
    await getCategories(req, res, jest.fn())

    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=3600')
  })

  test('calls next on database error', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'))

    const next = jest.fn()
    await getCategories(makeReq(), makeRes(), next)

    expect(next).toHaveBeenCalledWith(expect.any(Error))
  })
})
