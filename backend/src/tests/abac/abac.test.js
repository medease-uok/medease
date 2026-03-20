const { ADMIN, DOCTOR, NURSE, PATIENT, PHARMACIST, LAB_TECH, APPOINTMENT, MEDICAL_RECORD, PRESCRIPTION, LAB_REPORT } = require('../fixtures/rbac.fixtures');

const mockRedisGet = jest.fn();
const mockRedisSet = jest.fn();
const mockRedisDel = jest.fn();

jest.mock('../../config/redis', () => ({
  get: (...args) => mockRedisGet(...args),
  set: (...args) => mockRedisSet(...args),
  del: (...args) => mockRedisDel(...args),
}));

const mockDbQuery = jest.fn();
jest.mock('../../config/database', () => ({
  query: (...args) => mockDbQuery(...args),
}));

const { evaluateAccess, evaluateCondition, buildAccessFilter, loadPolicies, invalidatePolicyCache } = require('../../utils/abac');

const POLICIES = [
  {
    id: 'p1', name: 'appointment_admin_nurse_view', resource_type: 'appointment', effect: 'allow', priority: 10,
    conditions: { 'subject.role': { in: ['admin', 'nurse'] } },
  },
  {
    id: 'p2', name: 'appointment_patient_own', resource_type: 'appointment', effect: 'allow', priority: 5,
    conditions: {
      all: [
        { 'subject.role': { equals: 'patient' } },
        { 'resource.patient_user_id': { equals_ref: 'subject.id' } },
      ],
    },
  },
  {
    id: 'p3', name: 'appointment_doctor_own', resource_type: 'appointment', effect: 'allow', priority: 5,
    conditions: {
      all: [
        { 'subject.role': { equals: 'doctor' } },
        { 'resource.doctor_user_id': { equals_ref: 'subject.id' } },
      ],
    },
  },
  {
    id: 'p4', name: 'prescription_admin_view', resource_type: 'prescription', effect: 'allow', priority: 10,
    conditions: { 'subject.role': { equals: 'admin' } },
  },
  {
    id: 'p5', name: 'prescription_pharmacist_view', resource_type: 'prescription', effect: 'allow', priority: 10,
    conditions: { 'subject.role': { equals: 'pharmacist' } },
  },
  {
    id: 'p6', name: 'prescription_patient_own', resource_type: 'prescription', effect: 'allow', priority: 5,
    conditions: {
      all: [
        { 'subject.role': { equals: 'patient' } },
        { 'resource.patient_user_id': { equals_ref: 'subject.id' } },
      ],
    },
  },
  {
    id: 'p7', name: 'prescription_doctor_own', resource_type: 'prescription', effect: 'allow', priority: 5,
    conditions: {
      all: [
        { 'subject.role': { equals: 'doctor' } },
        { 'resource.patient_user_id': { equals_ref: 'subject.id' } },
      ],
    },
  },
  {
    id: 'p8', name: 'lab_report_admin_doctor_view', resource_type: 'lab_report', effect: 'allow', priority: 10,
    conditions: { 'subject.role': { in: ['admin', 'doctor'] } },
  },
  {
    id: 'p9', name: 'lab_report_patient_own', resource_type: 'lab_report', effect: 'allow', priority: 5,
    conditions: {
      all: [
        { 'subject.role': { equals: 'patient' } },
        { 'resource.patient_user_id': { equals_ref: 'subject.id' } },
      ],
    },
  },
  {
    id: 'p10', name: 'lab_report_tech_own', resource_type: 'lab_report', effect: 'allow', priority: 5,
    conditions: {
      all: [
        { 'subject.role': { equals: 'lab_technician' } },
        { 'resource.technician_id': { equals_ref: 'subject.id' } },
      ],
    },
  },
  {
    id: 'p11', name: 'medical_record_admin_nurse', resource_type: 'medical_record', effect: 'allow', priority: 10,
    conditions: { 'subject.role': { in: ['admin', 'nurse'] } },
  },
  {
    id: 'p12', name: 'medical_record_patient_own', resource_type: 'medical_record', effect: 'allow', priority: 5,
    conditions: {
      all: [
        { 'subject.role': { equals: 'patient' } },
        { 'resource.patient_user_id': { equals_ref: 'subject.id' } },
      ],
    },
  },
  {
    id: 'p13', name: 'medical_record_doctor_own', resource_type: 'medical_record', effect: 'allow', priority: 5,
    conditions: {
      all: [
        { 'subject.role': { equals: 'doctor' } },
        { 'resource.doctor_id': { equals_ref: 'subject.doctorId' } },
      ],
    },
  },
];

beforeEach(() => {
  mockRedisGet.mockReset();
  mockRedisSet.mockReset();
  mockRedisDel.mockReset();
  mockDbQuery.mockReset();
  mockRedisGet.mockResolvedValue(JSON.stringify(POLICIES));
});

describe('evaluateCondition', () => {
  const context = {
    subject: { id: 'user-1', role: 'doctor', doctorId: 'doc-1' },
    resource: { patient_user_id: 'user-2', doctor_id: 'doc-1' },
  };

  test('equals operator matches', () => {
    expect(evaluateCondition({ 'subject.role': { equals: 'doctor' } }, context)).toBe(true);
  });

  test('equals operator rejects mismatch', () => {
    expect(evaluateCondition({ 'subject.role': { equals: 'admin' } }, context)).toBe(false);
  });

  test('not_equals operator works', () => {
    expect(evaluateCondition({ 'subject.role': { not_equals: 'patient' } }, context)).toBe(true);
    expect(evaluateCondition({ 'subject.role': { not_equals: 'doctor' } }, context)).toBe(false);
  });

  test('in operator matches array membership', () => {
    expect(evaluateCondition({ 'subject.role': { in: ['admin', 'doctor'] } }, context)).toBe(true);
    expect(evaluateCondition({ 'subject.role': { in: ['admin', 'nurse'] } }, context)).toBe(false);
  });

  test('not_in operator works', () => {
    expect(evaluateCondition({ 'subject.role': { not_in: ['patient', 'nurse'] } }, context)).toBe(true);
    expect(evaluateCondition({ 'subject.role': { not_in: ['doctor', 'nurse'] } }, context)).toBe(false);
  });

  test('equals_ref compares two attribute paths', () => {
    expect(evaluateCondition(
      { 'resource.doctor_id': { equals_ref: 'subject.doctorId' } },
      context
    )).toBe(true);
    expect(evaluateCondition(
      { 'resource.patient_user_id': { equals_ref: 'subject.id' } },
      context
    )).toBe(false);
  });

  test('equals_ref returns false when ref is null', () => {
    expect(evaluateCondition(
      { 'resource.doctor_id': { equals_ref: 'subject.patientId' } },
      context
    )).toBe(false);
  });

  test('exists operator checks for attribute presence', () => {
    expect(evaluateCondition({ 'subject.doctorId': { exists: true } }, context)).toBe(true);
    expect(evaluateCondition({ 'subject.patientId': { exists: true } }, context)).toBe(false);
    expect(evaluateCondition({ 'subject.patientId': { exists: false } }, context)).toBe(true);
  });

  test('any (OR) matches if at least one child matches', () => {
    expect(evaluateCondition({
      any: [
        { 'subject.role': { equals: 'admin' } },
        { 'subject.role': { equals: 'doctor' } },
      ],
    }, context)).toBe(true);
  });

  test('any (OR) fails if no child matches', () => {
    expect(evaluateCondition({
      any: [
        { 'subject.role': { equals: 'admin' } },
        { 'subject.role': { equals: 'nurse' } },
      ],
    }, context)).toBe(false);
  });

  test('all (AND) matches if every child matches', () => {
    expect(evaluateCondition({
      all: [
        { 'subject.role': { equals: 'doctor' } },
        { 'resource.doctor_id': { equals_ref: 'subject.doctorId' } },
      ],
    }, context)).toBe(true);
  });

  test('all (AND) fails if any child fails', () => {
    expect(evaluateCondition({
      all: [
        { 'subject.role': { equals: 'doctor' } },
        { 'resource.patient_user_id': { equals_ref: 'subject.id' } },
      ],
    }, context)).toBe(false);
  });

  test('empty condition returns false', () => {
    expect(evaluateCondition({}, context)).toBe(false);
  });

  test('unknown operator returns false', () => {
    expect(evaluateCondition({ 'subject.role': { foobar: 'doctor' } }, context)).toBe(false);
  });
});

describe('evaluateAccess', () => {
  describe('appointments', () => {
    test('admin can view any appointment', async () => {
      expect(await evaluateAccess('appointment', ADMIN, APPOINTMENT)).toBe(true);
    });

    test('nurse can view any appointment', async () => {
      expect(await evaluateAccess('appointment', NURSE, APPOINTMENT)).toBe(true);
    });

    test('doctor can view their own appointment', async () => {
      expect(await evaluateAccess('appointment', DOCTOR, APPOINTMENT)).toBe(true);
    });

    test('doctor cannot view another doctor\'s appointment', async () => {
      const otherAppt = { ...APPOINTMENT, doctor_user_id: 'other-doctor-uuid' };
      expect(await evaluateAccess('appointment', DOCTOR, otherAppt)).toBe(false);
    });

    test('patient can view their own appointment', async () => {
      expect(await evaluateAccess('appointment', PATIENT, APPOINTMENT)).toBe(true);
    });

    test('patient cannot view another patient\'s appointment', async () => {
      const otherAppt = { ...APPOINTMENT, patient_user_id: 'other-patient-uuid' };
      expect(await evaluateAccess('appointment', PATIENT, otherAppt)).toBe(false);
    });

    test('pharmacist cannot view appointments', async () => {
      expect(await evaluateAccess('appointment', PHARMACIST, APPOINTMENT)).toBe(false);
    });

    test('lab technician cannot view appointments', async () => {
      expect(await evaluateAccess('appointment', LAB_TECH, APPOINTMENT)).toBe(false);
    });
  });

  describe('prescriptions', () => {
    test('admin can view any prescription', async () => {
      expect(await evaluateAccess('prescription', ADMIN, PRESCRIPTION)).toBe(true);
    });

    test('pharmacist can view any prescription', async () => {
      expect(await evaluateAccess('prescription', PHARMACIST, PRESCRIPTION)).toBe(true);
    });

    test('patient can view their own prescription', async () => {
      expect(await evaluateAccess('prescription', PATIENT, PRESCRIPTION)).toBe(true);
    });

    test('patient cannot view another patient\'s prescription', async () => {
      const otherRx = { ...PRESCRIPTION, patient_user_id: 'other-uuid' };
      expect(await evaluateAccess('prescription', PATIENT, otherRx)).toBe(false);
    });

    test('nurse cannot view prescriptions', async () => {
      expect(await evaluateAccess('prescription', NURSE, PRESCRIPTION)).toBe(false);
    });
  });

  describe('lab reports', () => {
    test('admin can view any lab report', async () => {
      expect(await evaluateAccess('lab_report', ADMIN, LAB_REPORT)).toBe(true);
    });

    test('doctor can view any lab report', async () => {
      expect(await evaluateAccess('lab_report', DOCTOR, LAB_REPORT)).toBe(true);
    });

    test('patient can view their own lab report', async () => {
      expect(await evaluateAccess('lab_report', PATIENT, LAB_REPORT)).toBe(true);
    });

    test('patient cannot view another patient\'s lab report', async () => {
      const otherLr = { ...LAB_REPORT, patient_user_id: 'other-uuid' };
      expect(await evaluateAccess('lab_report', PATIENT, otherLr)).toBe(false);
    });

    test('lab technician can view their own report', async () => {
      const tech = { ...LAB_TECH, id: 'lab-uuid' };
      const report = { ...LAB_REPORT, technician_id: 'lab-uuid' };
      expect(await evaluateAccess('lab_report', tech, report)).toBe(true);
    });

    test('lab technician cannot view another technician\'s report', async () => {
      expect(await evaluateAccess('lab_report', LAB_TECH, LAB_REPORT)).toBe(false);
    });

    test('pharmacist cannot view lab reports', async () => {
      expect(await evaluateAccess('lab_report', PHARMACIST, LAB_REPORT)).toBe(false);
    });
  });

  describe('medical records', () => {
    test('admin can view any medical record', async () => {
      expect(await evaluateAccess('medical_record', ADMIN, MEDICAL_RECORD)).toBe(true);
    });

    test('nurse can view any medical record', async () => {
      expect(await evaluateAccess('medical_record', NURSE, MEDICAL_RECORD)).toBe(true);
    });

    test('doctor can view their own patient\'s record', async () => {
      expect(await evaluateAccess('medical_record', DOCTOR, MEDICAL_RECORD)).toBe(true);
    });

    test('doctor cannot view another doctor\'s patient record', async () => {
      const otherMr = { ...MEDICAL_RECORD, doctor_id: 'other-doc-profile' };
      expect(await evaluateAccess('medical_record', DOCTOR, otherMr)).toBe(false);
    });

    test('patient can view their own medical record', async () => {
      expect(await evaluateAccess('medical_record', PATIENT, MEDICAL_RECORD)).toBe(true);
    });

    test('patient cannot view another patient\'s record', async () => {
      const otherMr = { ...MEDICAL_RECORD, patient_user_id: 'other-uuid' };
      expect(await evaluateAccess('medical_record', PATIENT, otherMr)).toBe(false);
    });

    test('pharmacist cannot view medical records', async () => {
      expect(await evaluateAccess('medical_record', PHARMACIST, MEDICAL_RECORD)).toBe(false);
    });
  });

  describe('deny policies', () => {
    test('deny policy blocks even if allow policy matches', async () => {
      const policiesWithDeny = [
        ...POLICIES,
        {
          id: 'deny-1', name: 'deny_admin_cancelled', resource_type: 'appointment', effect: 'deny', priority: 20,
          conditions: {
            all: [
              { 'subject.role': { equals: 'admin' } },
              { 'resource.status': { equals: 'cancelled' } },
            ],
          },
        },
      ];
      mockRedisGet.mockResolvedValue(JSON.stringify(policiesWithDeny));
      const cancelledAppt = { ...APPOINTMENT, status: 'cancelled' };
      expect(await evaluateAccess('appointment', ADMIN, cancelledAppt)).toBe(false);
    });
  });

  describe('no policies', () => {
    test('returns true when no policies exist for resource type', async () => {
      expect(await evaluateAccess('nonexistent_resource', ADMIN, {})).toBe(true);
    });
  });
});

describe('buildAccessFilter', () => {
  test('admin gets TRUE clause for appointments', async () => {
    const columnMap = { patient_user_id: 'a.patient_user_id', doctor_user_id: 'a.doctor_user_id' };
    const result = await buildAccessFilter('appointment', ADMIN, columnMap);
    expect(result.clause).toContain('TRUE');
    expect(result.params).toEqual([]);
  });

  test('patient gets ownership filter for appointments', async () => {
    const columnMap = { patient_user_id: 'a.patient_user_id', doctor_user_id: 'a.doctor_user_id' };
    const result = await buildAccessFilter('appointment', PATIENT, columnMap);
    expect(result.clause).toContain('a.patient_user_id');
    expect(result.params).toContain(PATIENT.id);
  });

  test('doctor gets ownership filter for appointments', async () => {
    const columnMap = { patient_user_id: 'a.patient_user_id', doctor_user_id: 'a.doctor_user_id' };
    const result = await buildAccessFilter('appointment', DOCTOR, columnMap);
    expect(result.clause).toContain('a.doctor_user_id');
    expect(result.params).toContain(DOCTOR.id);
  });

  test('pharmacist gets FALSE clause for appointments (no matching policy)', async () => {
    const columnMap = { patient_user_id: 'a.patient_user_id', doctor_user_id: 'a.doctor_user_id' };
    const result = await buildAccessFilter('appointment', PHARMACIST, columnMap);
    expect(result.clause).toBe('FALSE');
    expect(result.params).toEqual([]);
  });

  test('paramOffset shifts parameter indices', async () => {
    const columnMap = { patient_user_id: 'a.patient_user_id', doctor_user_id: 'a.doctor_user_id' };
    const result = await buildAccessFilter('appointment', PATIENT, columnMap, 3);
    expect(result.clause).toMatch(/\$3/);
  });

  test('returns TRUE when no policies exist for resource type', async () => {
    const result = await buildAccessFilter('nonexistent_resource', ADMIN, {});
    expect(result.clause).toBe('TRUE');
    expect(result.params).toEqual([]);
  });
});

describe('loadPolicies', () => {
  test('returns cached policies from Redis', async () => {
    const policies = await loadPolicies();
    expect(policies).toEqual(POLICIES);
    expect(mockDbQuery).not.toHaveBeenCalled();
  });

  test('queries database when cache is empty', async () => {
    mockRedisGet.mockResolvedValue(null);
    mockDbQuery.mockResolvedValue({ rows: POLICIES });
    const policies = await loadPolicies();
    expect(policies).toEqual(POLICIES);
    expect(mockDbQuery).toHaveBeenCalled();
    expect(mockRedisSet).toHaveBeenCalledWith('abac:policies', expect.any(String), 'EX', 300);
  });

  test('returns empty array on database error', async () => {
    mockRedisGet.mockResolvedValue(null);
    mockDbQuery.mockRejectedValue(new Error('DB down'));
    const policies = await loadPolicies();
    expect(policies).toEqual([]);
  });
});

describe('invalidatePolicyCache', () => {
  test('deletes the policy cache key from Redis', async () => {
    await invalidatePolicyCache();
    expect(mockRedisDel).toHaveBeenCalledWith('abac:policies');
  });
});
