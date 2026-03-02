export const appointmentStatuses = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'];

const now = new Date();
const day = (offset) => new Date(now.getTime() + offset * 24 * 60 * 60 * 1000).toISOString();

export const appointments = [
  { id: 'ap-001', patientId: 'pt000000-0000-0000-0000-000000000001', patientName: 'Sarah Fernando', doctorId: 'dc000000-0000-0000-0000-000000000001', doctorName: 'Dr. Kamal Perera', scheduledAt: day(-30), status: 'completed', notes: 'Routine cardiac checkup. ECG normal.' },
  { id: 'ap-002', patientId: 'pt000000-0000-0000-0000-000000000002', patientName: 'Dinesh Rajapaksa', doctorId: 'dc000000-0000-0000-0000-000000000002', doctorName: 'Dr. Sithara Silva', scheduledAt: day(-25), status: 'completed', notes: 'Follow-up for recurring headaches. MRI ordered.' },
  { id: 'ap-003', patientId: 'pt000000-0000-0000-0000-000000000003', patientName: 'Kavindi Weerasinghe', doctorId: 'dc000000-0000-0000-0000-000000000003', doctorName: 'Dr. Ruwan Fernando', scheduledAt: day(-20), status: 'completed', notes: 'Knee pain evaluation. X-ray taken.' },
  { id: 'ap-004', patientId: 'pt000000-0000-0000-0000-000000000004', patientName: 'Nuwan Jayasuriya', doctorId: 'dc000000-0000-0000-0000-000000000001', doctorName: 'Dr. Kamal Perera', scheduledAt: day(-15), status: 'completed', notes: 'Blood pressure monitoring. Medication adjusted.' },
  { id: 'ap-005', patientId: 'pt000000-0000-0000-0000-000000000001', patientName: 'Sarah Fernando', doctorId: 'dc000000-0000-0000-0000-000000000002', doctorName: 'Dr. Sithara Silva', scheduledAt: day(-10), status: 'completed', notes: 'Neurological assessment. All clear.' },
  { id: 'ap-006', patientId: 'pt000000-0000-0000-0000-000000000005', patientName: 'Hasini Abeywickrama', doctorId: 'dc000000-0000-0000-0000-000000000001', doctorName: 'Dr. Kamal Perera', scheduledAt: day(2), status: 'confirmed', notes: 'First cardiac consultation.' },
  { id: 'ap-007', patientId: 'pt000000-0000-0000-0000-000000000006', patientName: 'Lahiru Gunasekara', doctorId: 'dc000000-0000-0000-0000-000000000003', doctorName: 'Dr. Ruwan Fernando', scheduledAt: day(3), status: 'confirmed', notes: 'Sports injury follow-up.' },
  { id: 'ap-008', patientId: 'pt000000-0000-0000-0000-000000000002', patientName: 'Dinesh Rajapaksa', doctorId: 'dc000000-0000-0000-0000-000000000002', doctorName: 'Dr. Sithara Silva', scheduledAt: day(5), status: 'scheduled', notes: 'MRI results review.' },
  { id: 'ap-009', patientId: 'pt000000-0000-0000-0000-000000000003', patientName: 'Kavindi Weerasinghe', doctorId: 'dc000000-0000-0000-0000-000000000004', doctorName: 'Dr. Anjali Dissanayake', scheduledAt: day(7), status: 'scheduled', notes: 'Pediatric referral for daughter.' },
  { id: 'ap-010', patientId: 'pt000000-0000-0000-0000-000000000001', patientName: 'Sarah Fernando', doctorId: 'dc000000-0000-0000-0000-000000000001', doctorName: 'Dr. Kamal Perera', scheduledAt: day(14), status: 'scheduled', notes: 'Quarterly cardiac review.' },
  { id: 'ap-011', patientId: 'pt000000-0000-0000-0000-000000000004', patientName: 'Nuwan Jayasuriya', doctorId: 'dc000000-0000-0000-0000-000000000002', doctorName: 'Dr. Sithara Silva', scheduledAt: day(0), status: 'in_progress', notes: 'Neurology consultation in progress.' },
  { id: 'ap-012', patientId: 'pt000000-0000-0000-0000-000000000005', patientName: 'Hasini Abeywickrama', doctorId: 'dc000000-0000-0000-0000-000000000004', doctorName: 'Dr. Anjali Dissanayake', scheduledAt: day(-5), status: 'cancelled', notes: 'Patient requested cancellation.' },
];
