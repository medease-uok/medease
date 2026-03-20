const AppError = require('../../utils/AppError');

describe('AppError', () => {
  test('creates error with correct message and statusCode', () => {
    const err = new AppError('Not found', 404);
    expect(err.message).toBe('Not found');
    expect(err.statusCode).toBe(404);
  });

  test('sets isOperational to true', () => {
    const err = new AppError('Bad request', 400);
    expect(err.isOperational).toBe(true);
  });

  test('is an instance of Error', () => {
    const err = new AppError('Unauthorized', 401);
    expect(err).toBeInstanceOf(Error);
  });

  test('is an instance of AppError', () => {
    const err = new AppError('Forbidden', 403);
    expect(err).toBeInstanceOf(AppError);
  });

  test('captures stack trace', () => {
    const err = new AppError('Server error', 500);
    expect(err.stack).toBeDefined();
    expect(err.stack).toContain('AppError');
  });

  test('distinguishes from native Error (isOperational)', () => {
    const appErr = new AppError('App error', 400);
    const nativeErr = new Error('Native error');
    expect(appErr.isOperational).toBe(true);
    expect(nativeErr.isOperational).toBeUndefined();
  });

  test.each([
    [400, 'Bad Request'],
    [401, 'Unauthorized'],
    [403, 'Forbidden'],
    [404, 'Not Found'],
    [409, 'Conflict'],
    [422, 'Unprocessable Entity'],
    [429, 'Too Many Requests'],
    [500, 'Internal Server Error'],
  ])('handles statusCode %d', (code, msg) => {
    const err = new AppError(msg, code);
    expect(err.statusCode).toBe(code);
    expect(err.message).toBe(msg);
  });
});
