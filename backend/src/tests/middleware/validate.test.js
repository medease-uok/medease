const { body } = require('express-validator');
const validate = require('../../middleware/validate');

function runValidate(validations, reqBody) {
  return new Promise((resolve) => {
    const req = { body: reqBody, headers: {}, params: {}, query: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    const middleware = validate(validations);
    middleware(req, res, (...args) => {
      next(...args);
      resolve({ passed: true, req, res });
    });

    setTimeout(() => {
      if (res.json.mock.calls.length > 0) {
        resolve({
          passed: false,
          body: res.json.mock.calls[0][0],
          statusCode: res.status.mock.calls[0][0],
        });
      }
    }, 100);
  });
}

describe('validate middleware', () => {
  const nameValidation = [
    body('name').notEmpty().withMessage('Name is required'),
  ];

  const emailValidation = [
    body('email').isEmail().withMessage('Invalid email'),
    body('age').isInt({ min: 0 }).withMessage('Age must be non-negative integer'),
  ];

  test('calls next() when validation passes', async () => {
    const result = await runValidate(nameValidation, { name: 'John' });
    expect(result.passed).toBe(true);
  });

  test('returns 400 when validation fails', async () => {
    const result = await runValidate(nameValidation, { name: '' });
    expect(result.passed).toBe(false);
    expect(result.statusCode).toBe(400);
  });

  test('returns error status and message on failure', async () => {
    const result = await runValidate(nameValidation, {});
    expect(result.body.status).toBe('error');
    expect(result.body.statusCode).toBe(400);
    expect(result.body.message).toBe('Validation failed');
  });

  test('returns field-level errors array', async () => {
    const result = await runValidate(nameValidation, {});
    expect(result.body.errors).toBeInstanceOf(Array);
    expect(result.body.errors[0]).toHaveProperty('field', 'name');
    expect(result.body.errors[0]).toHaveProperty('message');
  });

  test('handles multiple validation rules — stops at first failing rule', async () => {
    // The validate middleware breaks after the first failing validation chain,
    // so only errors from the first failed rule are returned.
    const result = await runValidate(emailValidation, { email: 'bad', age: -1 });
    expect(result.passed).toBe(false);
    const fields = result.body.errors.map((e) => e.field);
    expect(fields).toContain('email');
  });

  test('accepts valid data with multiple rules', async () => {
    const result = await runValidate(emailValidation, { email: 'test@example.com', age: 25 });
    expect(result.passed).toBe(true);
  });

  test('trims whitespace when trim() is applied', async () => {
    const trimValidation = [
      body('name').trim().notEmpty().withMessage('Name required'),
    ];
    const result = await runValidate(trimValidation, { name: '   ' });
    expect(result.passed).toBe(false);
  });
});
