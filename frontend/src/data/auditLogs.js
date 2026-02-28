let logCounter = 16;

export function addAuditLog({ userId, userName, action, resourceType, resourceId = null, success = true }) {
  auditLogs.push({
    id: `al-${String(logCounter++).padStart(3, '0')}`,
    userId,
    userName,
    action,
    resourceType,
    resourceId,
    ipAddress: '127.0.0.1',
    success,
    createdAt: new Date().toISOString(),
  });
}

export const auditLogs = [
  { id: 'al-001', userId: 'a0000000-0000-0000-0000-000000000001', userName: 'System Admin', action: 'LOGIN', resourceType: 'session', resourceId: null, ipAddress: '192.168.1.10', success: true, createdAt: '2026-02-28T08:00:00' },
  { id: 'al-002', userId: 'd0000000-0000-0000-0000-000000000001', userName: 'Kamal Perera', action: 'LOGIN', resourceType: 'session', resourceId: null, ipAddress: '192.168.1.20', success: true, createdAt: '2026-02-28T08:15:00' },
  { id: 'al-003', userId: 'd0000000-0000-0000-0000-000000000001', userName: 'Kamal Perera', action: 'VIEW', resourceType: 'patient', resourceId: 'pt000000-0000-0000-0000-000000000001', ipAddress: '192.168.1.20', success: true, createdAt: '2026-02-28T08:20:00' },
  { id: 'al-004', userId: 'd0000000-0000-0000-0000-000000000001', userName: 'Kamal Perera', action: 'CREATE', resourceType: 'medical_record', resourceId: null, ipAddress: '192.168.1.20', success: true, createdAt: '2026-02-28T08:30:00' },
  { id: 'al-005', userId: 'd0000000-0000-0000-0000-000000000001', userName: 'Kamal Perera', action: 'CREATE', resourceType: 'prescription', resourceId: null, ipAddress: '192.168.1.20', success: true, createdAt: '2026-02-28T08:35:00' },
  { id: 'al-006', userId: 'd0000000-0000-0000-0000-000000000002', userName: 'Sithara Silva', action: 'LOGIN', resourceType: 'session', resourceId: null, ipAddress: '192.168.1.21', success: true, createdAt: '2026-02-28T09:00:00' },
  { id: 'al-007', userId: 'd0000000-0000-0000-0000-000000000002', userName: 'Sithara Silva', action: 'VIEW', resourceType: 'patient', resourceId: 'pt000000-0000-0000-0000-000000000002', ipAddress: '192.168.1.21', success: true, createdAt: '2026-02-28T09:10:00' },
  { id: 'al-008', userId: 'l0000000-0000-0000-0000-000000000001', userName: 'Nimal Wijesinghe', action: 'LOGIN', resourceType: 'session', resourceId: null, ipAddress: '192.168.1.30', success: true, createdAt: '2026-02-28T09:30:00' },
  { id: 'al-009', userId: 'l0000000-0000-0000-0000-000000000001', userName: 'Nimal Wijesinghe', action: 'CREATE', resourceType: 'lab_report', resourceId: null, ipAddress: '192.168.1.30', success: true, createdAt: '2026-02-28T09:45:00' },
  { id: 'al-010', userId: 'r0000000-0000-0000-0000-000000000001', userName: 'Tharindu Gamage', action: 'LOGIN', resourceType: 'session', resourceId: null, ipAddress: '192.168.1.40', success: true, createdAt: '2026-02-28T10:00:00' },
  { id: 'al-011', userId: 'r0000000-0000-0000-0000-000000000001', userName: 'Tharindu Gamage', action: 'UPDATE', resourceType: 'prescription', resourceId: null, ipAddress: '192.168.1.40', success: true, createdAt: '2026-02-28T10:15:00' },
  { id: 'al-012', userId: 'p0000000-0000-0000-0000-000000000001', userName: 'Sarah Fernando', action: 'LOGIN', resourceType: 'session', resourceId: null, ipAddress: '10.0.0.50', success: true, createdAt: '2026-02-28T11:00:00' },
  { id: 'al-013', userId: 'p0000000-0000-0000-0000-000000000001', userName: 'Sarah Fernando', action: 'VIEW', resourceType: 'appointment', resourceId: null, ipAddress: '10.0.0.50', success: true, createdAt: '2026-02-28T11:05:00' },
  { id: 'al-014', userId: 'p0000000-0000-0000-0000-000000000003', userName: 'Kavindi Weerasinghe', action: 'LOGIN', resourceType: 'session', resourceId: null, ipAddress: '10.0.0.51', success: false, createdAt: '2026-02-28T11:30:00' },
  { id: 'al-015', userId: 'a0000000-0000-0000-0000-000000000001', userName: 'System Admin', action: 'UPDATE', resourceType: 'user', resourceId: 'd0000000-0000-0000-0000-000000000004', ipAddress: '192.168.1.10', success: true, createdAt: '2026-02-28T12:00:00' },
];
