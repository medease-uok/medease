const errorHandler = require('../../middleware/errorHandler');
const AppError = require('../../utils/AppError');

function runHandler(err, env) {
  const originalEnv = process.env.NODE_ENV;
  if (env) process.env.NODE_ENV = env;

  return new Promise((resolve) => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const req = {};
    const next = jest.fn();

    const origConsoleError = console.error;
    console.error = jest.fn();

    errorHandler(err, req, res, next);

    console.error = origConsoleError;
    process.env.NODE_ENV = originalEnv;

    resolve({ res, statusCode: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] });
  });
}

describe('errorHandler middleware', () => {
  test('returns statusCode from AppError', async () => {
    const err = new AppError('Not found', 404);
    const { statusCode, body } = await runHandler(err);
    expect(statusCode).toBe(404);
    expect(body.status).toBe('error');
    expect(body.statusCode).toBe(404);
    expect(body.message).toBe('Not found');
  });

  test('defaults to 500 for errors without statusCode', async () => {
    const err = new Error('Something went wrong');
    const { statusCode, body } = await runHandler(err);
    expect(statusCode).toBe(500);
    expect(body.statusCode).toBe(500);
  });

  test('includes stack in development environment', async () => {
    const err = new AppError('Dev error', 400);
    const { body } = await runHandler(err, 'development');
    expect(body.stack).toBeDefined();
  });

  test('omits stack in production environment', async () => {
    const err = new AppError('Prod error', 400);
    const { body } = await runHandler(err, 'production');
    expect(body.stack).toBeUndefined();
  });

  test('handles 403 Forbidden errors', async () => {
    const err = new AppError('Access denied', 403);
    const { statusCode, body } = await runHandler(err);
    expect(statusCode).toBe(403);
    expect(body.message).toBe('Access denied');
  });

  test('handles 401 Unauthorized errors', async () => {
    const err = new AppError('Unauthorized', 401);
    const { statusCode } = await runHandler(err);
    expect(statusCode).toBe(401);
  });

  test('handles 409 Conflict errors', async () => {
    const err = new AppError('Already exists', 409);
    const { statusCode } = await runHandler(err);
    expect(statusCode).toBe(409);
  });

  test('returns consistent JSON structure', async () => {
    const err = new AppError('Test error', 422);
    const { body } = await runHandler(err);
    expect(body).toHaveProperty('status', 'error');
    expect(body).toHaveProperty('statusCode');
    expect(body).toHaveProperty('message');
  });
});
