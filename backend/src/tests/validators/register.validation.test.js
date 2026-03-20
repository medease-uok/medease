const { PATIENT_BODY, DOCTOR_BODY, NURSE_BODY, PHARMACIST_BODY, LAB_TECH_BODY } = require('../fixtures/register.fixtures');
const { registerValidation } = require('../../validators/auth.validators');
const validate = require('../../middleware/validate');

function runValidation(body) {
  return new Promise((resolve) => {
    const req = { body, headers: {}, params: {}, query: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    const middleware = validate(registerValidation);
    middleware(req, res, () => {
      resolve({ passed: true, req, res });
    });

    setTimeout(() => {
      if (res.json.mock.calls.length > 0) {
        resolve({
          passed: false,
          errors: res.json.mock.calls[0][0].errors,
          res,
        });
      }
    }, 100);
  });
}

describe('Registration validation rules', () => {
  describe('required fields', () => {
    test('rejects empty body', async () => {
      const result = await runValidation({});
      expect(result.passed).toBe(false);
    });

    test('rejects missing firstName', async () => {
      const body = { ...PATIENT_BODY };
      delete body.firstName;
      const result = await runValidation(body);
      expect(result.passed).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'firstName' }),
        ])
      );
    });

    test('rejects missing lastName', async () => {
      const body = { ...PATIENT_BODY };
      delete body.lastName;
      const result = await runValidation(body);
      expect(result.passed).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'lastName' }),
        ])
      );
    });

    test('rejects missing email', async () => {
      const body = { ...PATIENT_BODY };
      delete body.email;
      const result = await runValidation(body);
      expect(result.passed).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
        ])
      );
    });

    test('rejects missing role', async () => {
      const body = { ...PATIENT_BODY };
      delete body.role;
      const result = await runValidation(body);
      expect(result.passed).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'role' }),
        ])
      );
    });

    test('rejects missing password', async () => {
      const body = { ...PATIENT_BODY };
      delete body.password;
      const result = await runValidation(body);
      expect(result.passed).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'password' }),
        ])
      );
    });

    test('rejects missing confirmPassword', async () => {
      const body = { ...PATIENT_BODY };
      delete body.confirmPassword;
      const result = await runValidation(body);
      expect(result.passed).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'confirmPassword' }),
        ])
      );
    });
  });

  describe('email validation', () => {
    test('rejects invalid email format', async () => {
      const body = { ...PATIENT_BODY, email: 'not-an-email' };
      const result = await runValidation(body);
      expect(result.passed).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
        ])
      );
    });

    test('accepts valid email', async () => {
      const result = await runValidation(PATIENT_BODY);
      expect(result.passed).toBe(true);
    });
  });

  describe('password validation', () => {
    test('rejects password shorter than 8 characters', async () => {
      const body = { ...PATIENT_BODY, password: 'Ab1@xyz', confirmPassword: 'Ab1@xyz' };
      const result = await runValidation(body);
      expect(result.passed).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'password' }),
        ])
      );
    });

    test('rejects password without uppercase letter', async () => {
      const body = { ...PATIENT_BODY, password: 'str0ng@pass', confirmPassword: 'str0ng@pass' };
      const result = await runValidation(body);
      expect(result.passed).toBe(false);
    });

    test('rejects password without lowercase letter', async () => {
      const body = { ...PATIENT_BODY, password: 'STR0NG@PASS', confirmPassword: 'STR0NG@PASS' };
      const result = await runValidation(body);
      expect(result.passed).toBe(false);
    });

    test('rejects password without number', async () => {
      const body = { ...PATIENT_BODY, password: 'Strong@Pass', confirmPassword: 'Strong@Pass' };
      const result = await runValidation(body);
      expect(result.passed).toBe(false);
    });

    test('rejects password without special character', async () => {
      const body = { ...PATIENT_BODY, password: 'Str0ngPass1', confirmPassword: 'Str0ngPass1' };
      const result = await runValidation(body);
      expect(result.passed).toBe(false);
    });

    test('rejects mismatched confirmPassword', async () => {
      const body = { ...PATIENT_BODY, confirmPassword: 'DifferentPass1@' };
      const result = await runValidation(body);
      expect(result.passed).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'confirmPassword' }),
        ])
      );
    });
  });

  describe('role validation', () => {
    test('rejects invalid role', async () => {
      const body = { ...PATIENT_BODY, role: 'superadmin' };
      const result = await runValidation(body);
      expect(result.passed).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'role' }),
        ])
      );
    });

    test.each(['patient', 'doctor', 'nurse', 'lab_technician', 'pharmacist'])(
      'accepts valid role: %s',
      async (role) => {
        let body;
        switch (role) {
          case 'patient': body = PATIENT_BODY; break;
          case 'doctor': body = DOCTOR_BODY; break;
          case 'nurse': body = NURSE_BODY; break;
          case 'pharmacist': body = PHARMACIST_BODY; break;
          case 'lab_technician': body = LAB_TECH_BODY; break;
        }
        const result = await runValidation(body);
        expect(result.passed).toBe(true);
      }
    );
  });

  describe('phone validation', () => {
    test('accepts valid phone number', async () => {
      const result = await runValidation({ ...PATIENT_BODY, phone: '712345678' });
      expect(result.passed).toBe(true);
    });

    test('rejects phone not starting with 7-9', async () => {
      const body = { ...PATIENT_BODY, phone: '612345678' };
      const result = await runValidation(body);
      expect(result.passed).toBe(false);
    });

    test('allows empty phone (optional)', async () => {
      const body = { ...PATIENT_BODY };
      delete body.phone;
      const result = await runValidation(body);
      expect(result.passed).toBe(true);
    });
  });

  describe('patient-specific validation', () => {
    test('requires dateOfBirth for patients', async () => {
      const body = { ...PATIENT_BODY };
      delete body.dateOfBirth;
      const result = await runValidation(body);
      expect(result.passed).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'dateOfBirth' }),
        ])
      );
    });

    test('requires gender for patients', async () => {
      const body = { ...PATIENT_BODY };
      delete body.gender;
      const result = await runValidation(body);
      expect(result.passed).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'gender' }),
        ])
      );
    });

    test('rejects future dateOfBirth', async () => {
      const body = { ...PATIENT_BODY, dateOfBirth: '2030-01-01' };
      const result = await runValidation(body);
      expect(result.passed).toBe(false);
    });

    test('rejects invalid dateOfBirth format', async () => {
      const body = { ...PATIENT_BODY, dateOfBirth: 'not-a-date' };
      const result = await runValidation(body);
      expect(result.passed).toBe(false);
    });

    test('rejects invalid blood type', async () => {
      const body = { ...PATIENT_BODY, bloodType: 'X+' };
      const result = await runValidation(body);
      expect(result.passed).toBe(false);
    });

    test.each(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])(
      'accepts valid blood type: %s',
      async (bloodType) => {
        const result = await runValidation({ ...PATIENT_BODY, bloodType });
        expect(result.passed).toBe(true);
      }
    );

    test('does not require dateOfBirth for non-patient roles', async () => {
      const result = await runValidation(DOCTOR_BODY);
      expect(result.passed).toBe(true);
    });
  });

  describe('doctor-specific validation', () => {
    test('requires specialization for doctors', async () => {
      const body = { ...DOCTOR_BODY };
      delete body.specialization;
      const result = await runValidation(body);
      expect(result.passed).toBe(false);
    });

    test('requires licenseNumber for doctors', async () => {
      const body = { ...DOCTOR_BODY };
      delete body.licenseNumber;
      const result = await runValidation(body);
      expect(result.passed).toBe(false);
    });

    test('requires department for doctors', async () => {
      const body = { ...DOCTOR_BODY };
      delete body.department;
      const result = await runValidation(body);
      expect(result.passed).toBe(false);
    });
  });

  describe('nurse-specific validation', () => {
    test('requires licenseNumber for nurses', async () => {
      const body = { ...NURSE_BODY };
      delete body.licenseNumber;
      const result = await runValidation(body);
      expect(result.passed).toBe(false);
    });

    test('requires department for nurses', async () => {
      const body = { ...NURSE_BODY };
      delete body.department;
      const result = await runValidation(body);
      expect(result.passed).toBe(false);
    });
  });

  describe('pharmacist-specific validation', () => {
    test('requires licenseNumber for pharmacists', async () => {
      const body = { ...PHARMACIST_BODY };
      delete body.licenseNumber;
      const result = await runValidation(body);
      expect(result.passed).toBe(false);
    });
  });

  describe('lab_technician-specific validation', () => {
    test('requires department for lab technicians', async () => {
      const body = { ...LAB_TECH_BODY };
      delete body.department;
      const result = await runValidation(body);
      expect(result.passed).toBe(false);
    });
  });
});
