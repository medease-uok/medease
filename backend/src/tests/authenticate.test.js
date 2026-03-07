const jwt = require('jsonwebtoken');
const { JWT_SECRET, makeToken, ADMIN, DOCTOR, PATIENT } = require('./fixtures/rbac.fixtures');

jest.mock('../config', () => ({
  jwtSecret: 'test-secret',
}));

const authenticate = require('../middleware/authenticate');

function runMiddleware(req) {
  return new Promise((resolve) => {
    const res = {};
    authenticate(req, res, (err) => {
      resolve({ err, req });
    });
  });
}

describe('authenticate middleware', () => {
  test('passes with a valid Bearer token', async () => {
    const token = makeToken(ADMIN);
    const { err, req } = await runMiddleware({
      headers: { authorization: `Bearer ${token}` },
    });
    expect(err).toBeUndefined();
    expect(req.user.id).toBe(ADMIN.id);
    expect(req.user.email).toBe(ADMIN.email);
    expect(req.user.role).toBe(ADMIN.role);
  });

  test('rejects request with no Authorization header', async () => {
    const { err } = await runMiddleware({ headers: {} });
    expect(err.statusCode).toBe(401);
    expect(err.message).toMatch(/authentication required/i);
  });

  test('rejects request with non-Bearer scheme', async () => {
    const { err } = await runMiddleware({
      headers: { authorization: 'Basic abc123' },
    });
    expect(err.statusCode).toBe(401);
  });

  test('rejects expired token', async () => {
    const token = jwt.sign(PATIENT, JWT_SECRET, { expiresIn: '-1s' });
    const { err } = await runMiddleware({
      headers: { authorization: `Bearer ${token}` },
    });
    expect(err.statusCode).toBe(401);
    expect(err.message).toMatch(/invalid or expired/i);
  });

  test('rejects token signed with wrong secret', async () => {
    const token = jwt.sign(DOCTOR, 'wrong-secret', { expiresIn: '1h' });
    const { err } = await runMiddleware({
      headers: { authorization: `Bearer ${token}` },
    });
    expect(err.statusCode).toBe(401);
  });

  test('rejects malformed token', async () => {
    const { err } = await runMiddleware({
      headers: { authorization: 'Bearer not.a.valid.jwt' },
    });
    expect(err.statusCode).toBe(401);
  });
});
