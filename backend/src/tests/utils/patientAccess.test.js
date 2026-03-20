const mockDbQuery = jest.fn();
jest.mock('../../config/database', () => ({
  query: (...args) => mockDbQuery(...args),
}));

const { canAccessPatient, buildPatientAccessFilter, assertPatientAccess } = require('../../utils/patientAccess');

beforeEach(() => {
  mockDbQuery.mockReset();
});

describe('canAccessPatient', () => {
  test('admin can access any patient', async () => {
    const result = await canAccessPatient({ role: 'admin' }, 'pat-123');
    expect(result).toBe(true);
    expect(mockDbQuery).not.toHaveBeenCalled();
  });

  test('patient can access own profile', async () => {
    const result = await canAccessPatient({ role: 'patient', patientId: 'pat-123' }, 'pat-123');
    expect(result).toBe(true);
  });

  test('patient cannot access another patient', async () => {
    const result = await canAccessPatient({ role: 'patient', patientId: 'pat-mine' }, 'pat-other');
    expect(result).toBe(false);
  });

  test('doctor with relationship can access patient', async () => {
    mockDbQuery.mockResolvedValue({ rows: [{ '?column?': '1' }] });
    const result = await canAccessPatient({ role: 'doctor', doctorId: 'doc-1' }, 'pat-123');
    expect(result).toBe(true);
    expect(mockDbQuery).toHaveBeenCalledWith(
      expect.stringContaining('medical_records'),
      ['doc-1', 'pat-123']
    );
  });

  test('doctor without relationship cannot access patient', async () => {
    mockDbQuery.mockResolvedValue({ rows: [] });
    const result = await canAccessPatient({ role: 'doctor', doctorId: 'doc-1' }, 'pat-123');
    expect(result).toBe(false);
  });

  test('nurse in same department can access patient', async () => {
    mockDbQuery.mockResolvedValue({ rows: [{ '?column?': '1' }] });
    const result = await canAccessPatient({ role: 'nurse', id: 'usr-nurse-1' }, 'pat-123');
    expect(result).toBe(true);
  });

  test('nurse in different department cannot access patient', async () => {
    mockDbQuery.mockResolvedValue({ rows: [] });
    const result = await canAccessPatient({ role: 'nurse', id: 'usr-nurse-1' }, 'pat-123');
    expect(result).toBe(false);
  });

  test('other roles cannot access patients', async () => {
    const result = await canAccessPatient({ role: 'pharmacist' }, 'pat-123');
    expect(result).toBe(false);
  });

  test('lab_technician cannot access patients', async () => {
    const result = await canAccessPatient({ role: 'lab_technician' }, 'pat-123');
    expect(result).toBe(false);
  });
});

describe('buildPatientAccessFilter', () => {
  test('admin gets TRUE clause with no params', () => {
    const { clause, params } = buildPatientAccessFilter({ role: 'admin' });
    expect(clause).toBe('TRUE');
    expect(params).toEqual([]);
  });

  test('patient gets own-ID clause', () => {
    const { clause, params } = buildPatientAccessFilter({ role: 'patient', patientId: 'pat-1' });
    expect(clause).toContain('p.id = $1');
    expect(params).toEqual(['pat-1']);
  });

  test('doctor gets subquery with doctorId param', () => {
    const { clause, params } = buildPatientAccessFilter({ role: 'doctor', doctorId: 'doc-1' });
    expect(clause).toContain('medical_records');
    expect(params).toEqual(['doc-1']);
  });

  test('nurse gets department subquery with user id param', () => {
    const { clause, params } = buildPatientAccessFilter({ role: 'nurse', id: 'usr-1' });
    expect(clause).toContain('department');
    expect(params).toEqual(['usr-1']);
  });

  test('unknown role gets FALSE clause', () => {
    const { clause, params } = buildPatientAccessFilter({ role: 'pharmacist' });
    expect(clause).toBe('FALSE');
    expect(params).toEqual([]);
  });
});

describe('assertPatientAccess', () => {
  test('throws 403 when user has no access', async () => {
    // canAccessPatient returns false for pharmacist
    await expect(
      assertPatientAccess({ role: 'pharmacist' }, 'pat-123')
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(mockDbQuery).not.toHaveBeenCalled();
  });

  test('throws 404 when patient not found (admin)', async () => {
    mockDbQuery.mockResolvedValue({ rows: [] });
    await expect(
      assertPatientAccess({ role: 'admin' }, 'pat-nonexistent')
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  test('resolves when admin accesses existing patient', async () => {
    mockDbQuery.mockResolvedValue({ rows: [{ id: 'pat-123' }] });
    await expect(
      assertPatientAccess({ role: 'admin' }, 'pat-123')
    ).resolves.toBeUndefined();
  });

  test('resolves when patient accesses own profile', async () => {
    mockDbQuery.mockResolvedValue({ rows: [{ id: 'pat-123' }] });
    await expect(
      assertPatientAccess({ role: 'patient', patientId: 'pat-123' }, 'pat-123')
    ).resolves.toBeUndefined();
  });
});
