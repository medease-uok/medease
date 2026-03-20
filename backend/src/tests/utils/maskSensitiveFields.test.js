const { maskSensitiveFields } = require('../../utils/maskSensitiveFields');

const SAMPLE_PATIENT = {
  id: 'pat-1',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+94771234567',
  email: 'john.doe@example.com',
  emergencyContact: 'Jane Doe',
  emergencyPhone: '+94779876543',
  emergencyRelationship: 'Spouse',
  address: '123 Main Street, Colombo',
  insurancePolicyNumber: 'SLIC-HI-2024-08932',
  insuranceProvider: 'Sri Lanka Insurance',
  insurancePlanType: 'Premium',
  insuranceExpiryDate: '2025-12-31',
  organDonorCardNo: 'ODC-2024-001',
  licenseNumber: 'MD-12345',
};

describe('maskSensitiveFields', () => {
  describe('admin role — full access', () => {
    test('admin sees all fields unmasked', () => {
      const result = maskSensitiveFields(SAMPLE_PATIENT, 'admin');
      expect(result.phone).toBe('+94771234567');
      expect(result.email).toBe('john.doe@example.com');
      expect(result.emergencyContact).toBe('Jane Doe');
      expect(result.address).toBe('123 Main Street, Colombo');
      expect(result.insurancePolicyNumber).toBe('SLIC-HI-2024-08932');
      expect(result.insuranceProvider).toBe('Sri Lanka Insurance');
      expect(result.licenseNumber).toBe('MD-12345');
    });
  });

  describe('doctor role — partial access', () => {
    test('doctor sees emergency fields unmasked', () => {
      const result = maskSensitiveFields(SAMPLE_PATIENT, 'doctor');
      expect(result.emergencyContact).toBe('Jane Doe');
      expect(result.emergencyPhone).toBe('+94779876543');
      expect(result.emergencyRelationship).toBe('Spouse');
      expect(result.address).toBe('123 Main Street, Colombo');
    });

    test('doctor sees phone unmasked', () => {
      const result = maskSensitiveFields(SAMPLE_PATIENT, 'doctor');
      expect(result.phone).toBe('+94771234567');
    });

    test('doctor sees email unmasked', () => {
      const result = maskSensitiveFields(SAMPLE_PATIENT, 'doctor');
      expect(result.email).toBe('john.doe@example.com');
    });

    test('doctor sees insurance policy number masked', () => {
      const result = maskSensitiveFields(SAMPLE_PATIENT, 'doctor');
      expect(result.insurancePolicyNumber).not.toBe('SLIC-HI-2024-08932');
      expect(result.insurancePolicyNumber).toMatch(/^SL.*32$/);
    });

    test('doctor sees license number masked', () => {
      const result = maskSensitiveFields(SAMPLE_PATIENT, 'doctor');
      expect(result.licenseNumber).not.toBe('MD-12345');
    });
  });

  describe('nurse role — limited access', () => {
    test('nurse sees phone masked', () => {
      const result = maskSensitiveFields(SAMPLE_PATIENT, 'nurse');
      expect(result.phone).toBe('••••••••4567');
    });

    test('nurse sees insurance provider unmasked', () => {
      const result = maskSensitiveFields(SAMPLE_PATIENT, 'nurse');
      expect(result.insuranceProvider).toBe('Sri Lanka Insurance');
      expect(result.insurancePlanType).toBe('Premium');
      expect(result.insuranceExpiryDate).toBe('2025-12-31');
    });

    test('nurse sees emergency fields redacted', () => {
      const result = maskSensitiveFields(SAMPLE_PATIENT, 'nurse');
      expect(result.emergencyRelationship).toBe('[REDACTED]');
      expect(result.address).toBe('[REDACTED]');
    });
  });

  describe('pharmacist role — most fields masked', () => {
    test('pharmacist sees phone and email masked', () => {
      const result = maskSensitiveFields(SAMPLE_PATIENT, 'pharmacist');
      expect(result.phone).toBe('••••••••4567');
      expect(result.email).toBe('jo***@example.com');
    });

    test('pharmacist sees address redacted', () => {
      const result = maskSensitiveFields(SAMPLE_PATIENT, 'pharmacist');
      expect(result.address).toBe('[REDACTED]');
    });

    test('pharmacist sees insurance fields nulled', () => {
      const result = maskSensitiveFields(SAMPLE_PATIENT, 'pharmacist');
      expect(result.insuranceProvider).toBeNull();
      expect(result.insurancePlanType).toBeNull();
      expect(result.insuranceExpiryDate).toBeNull();
    });
  });

  describe('owner access — sees all own data', () => {
    test('owner sees all fields unmasked regardless of role', () => {
      const result = maskSensitiveFields(SAMPLE_PATIENT, 'patient', true);
      expect(result.phone).toBe('+94771234567');
      expect(result.email).toBe('john.doe@example.com');
      expect(result.emergencyContact).toBe('Jane Doe');
      expect(result.address).toBe('123 Main Street, Colombo');
      expect(result.insurancePolicyNumber).toBe('SLIC-HI-2024-08932');
      expect(result.insuranceProvider).toBe('Sri Lanka Insurance');
      expect(result.licenseNumber).toBe('MD-12345');
    });
  });

  describe('array handling', () => {
    test('masks each item in an array', () => {
      const patients = [SAMPLE_PATIENT, { ...SAMPLE_PATIENT, id: 'pat-2', phone: '+94770000000' }];
      const result = maskSensitiveFields(patients, 'nurse');
      expect(result).toHaveLength(2);
      expect(result[0].phone).toBe('••••••••4567');
      expect(result[1].phone).toBe('••••••••0000');
    });
  });

  describe('edge cases', () => {
    test('returns null/undefined as-is', () => {
      expect(maskSensitiveFields(null, 'admin')).toBeNull();
      expect(maskSensitiveFields(undefined, 'admin')).toBeUndefined();
    });

    test('skips fields that are null in data', () => {
      const data = { ...SAMPLE_PATIENT, phone: null };
      const result = maskSensitiveFields(data, 'nurse');
      expect(result.phone).toBeNull();
    });

    test('skips fields that are not present in data', () => {
      const data = { id: 'pat-1', firstName: 'John' };
      const result = maskSensitiveFields(data, 'nurse');
      expect(result.phone).toBeUndefined();
      expect(result.firstName).toBe('John');
    });

    test('does not mutate original object', () => {
      const original = { ...SAMPLE_PATIENT };
      maskSensitiveFields(original, 'nurse');
      expect(original.phone).toBe('+94771234567');
    });

    test('non-sensitive fields are not modified', () => {
      const result = maskSensitiveFields(SAMPLE_PATIENT, 'pharmacist');
      expect(result.id).toBe('pat-1');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
    });
  });
});
