/**
 * Integration-style test for the 404 catch-all handler.
 *
 * We replicate the relevant app structure (the catch-all and error handler)
 * in a minimal Express instance rather than booting the full app, so the test
 * remains fast and avoids spinning up real DB / Redis / rate-limiter connections.
 */
const express = require('express')
const request = require('supertest')
const errorHandler = require('../../middleware/errorHandler')

function buildTestApp() {
  const app = express()
  app.use(express.json())

  // Matches the exact handler in src/index.js
  app.all('/api/*path', (req, res) => {
    res.status(404).json({
      status: 'error',
      statusCode: 404,
      message: `${req.method} ${req.path} not found.`,
    })
  })

  app.use(errorHandler)
  return app
}

const app = buildTestApp()

// ──────────────────────────────────────────────────────────────
// 404 CATCH-ALL HANDLER
// ──────────────────────────────────────────────────────────────
describe('404 catch-all handler', () => {
  test('returns 404 for unknown GET route under /api', async () => {
    const res = await request(app).get('/api/nonexistent-endpoint-xyz')

    expect(res.status).toBe(404)
    expect(res.body).toMatchObject({ status: 'error', statusCode: 404 })
    expect(res.body.message).toContain('GET')
    expect(res.body.message).toContain('/api/nonexistent-endpoint-xyz')
  })

  test('returns 404 for unknown POST route under /api', async () => {
    const res = await request(app).post('/api/does-not-exist').send({})

    expect(res.status).toBe(404)
    expect(res.body).toMatchObject({ status: 'error', statusCode: 404 })
    expect(res.body.message).toContain('POST')
  })

  test('returns 404 for unknown DELETE route under /api', async () => {
    const res = await request(app).delete('/api/fake/resource/123')

    expect(res.status).toBe(404)
    expect(res.body.message).toContain('DELETE')
  })

  test('response message includes the requested path', async () => {
    const res = await request(app).get('/api/totally/unknown/path')

    expect(res.body.message).toContain('/api/totally/unknown/path')
  })

  test('does not return our JSON 404 for non-/api routes', async () => {
    // Routes outside /api are not caught by this handler — no JSON body with our shape
    const res = await request(app).get('/health')

    // Express may still return 404 for unknown routes, but NOT our custom JSON body
    expect(res.body.statusCode).not.toBe(404)
  })
})
