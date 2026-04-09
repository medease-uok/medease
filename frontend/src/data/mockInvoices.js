/**
 * Dummy invoice data for frontend development.
 * Uses real patient IDs and doctor IDs from the seed data.
 * Remove this file once the backend /api/invoices endpoint is live.
 */

const now = new Date();
const daysAgo = (d) => new Date(now.getTime() - d * 86400000).toISOString();
const daysFromNow = (d) => new Date(now.getTime() + d * 86400000).toISOString();

const MOCK_INVOICES = [
  // ─── Sarah Fernando ───
  {
    id: 'inv-001',
    invoiceNumber: 'INV-2026-0001',
    patientId: 'ce000000-0000-0000-0000-000000000001',
    patientName: 'Sarah Fernando',
    doctorName: 'Dr. Kamal Perera',
    status: 'paid',
    paymentMethod: 'credit_card',
    issueDate: daysAgo(30),
    dueDate: daysAgo(16),
    paidDate: daysAgo(18),
    subtotal: 4700,
    tax: 0,
    discount: 0,
    total: 4700,
    amountPaid: 4700,
    notes: 'Routine cardiac checkup with labs.',
    items: [
      { id: 'li-001', type: 'consultation', description: 'Cardiology consultation', quantity: 1, unitPrice: 3500, total: 3500 },
      { id: 'li-002', type: 'lab_test', description: 'Complete Blood Count (CBC)', quantity: 1, unitPrice: 1200, total: 1200 },
    ],
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV-2026-0002',
    patientId: 'ce000000-0000-0000-0000-000000000001',
    patientName: 'Sarah Fernando',
    doctorName: 'Dr. Kamal Perera',
    status: 'paid',
    paymentMethod: 'insurance',
    issueDate: daysAgo(28),
    dueDate: daysAgo(14),
    paidDate: daysAgo(15),
    subtotal: 2650,
    tax: 0,
    discount: 200,
    total: 2450,
    amountPaid: 2450,
    notes: 'Lipid panel and prescription.',
    items: [
      { id: 'li-003', type: 'lab_test', description: 'Lipid Panel', quantity: 1, unitPrice: 1800, total: 1800 },
      { id: 'li-004', type: 'prescription', description: 'Amlodipine 5mg — 3 months', quantity: 1, unitPrice: 850, total: 850 },
    ],
  },
  {
    id: 'inv-003',
    invoiceNumber: 'INV-2026-0003',
    patientId: 'ce000000-0000-0000-0000-000000000001',
    patientName: 'Sarah Fernando',
    doctorName: 'Dr. Sithara Silva',
    status: 'pending',
    paymentMethod: null,
    issueDate: daysAgo(2),
    dueDate: daysFromNow(12),
    paidDate: null,
    subtotal: 4000,
    tax: 0,
    discount: 0,
    total: 4000,
    amountPaid: 0,
    notes: 'Neurology follow-up consultation.',
    items: [
      { id: 'li-005', type: 'consultation', description: 'Neurology consultation', quantity: 1, unitPrice: 4000, total: 4000 },
    ],
  },

  // ─── Dinesh Rajapaksa ───
  {
    id: 'inv-004',
    invoiceNumber: 'INV-2026-0004',
    patientId: 'ce000000-0000-0000-0000-000000000002',
    patientName: 'Dinesh Rajapaksa',
    doctorName: 'Dr. Sithara Silva',
    status: 'paid',
    paymentMethod: 'mobile_payment',
    issueDate: daysAgo(25),
    dueDate: daysAgo(11),
    paidDate: daysAgo(12),
    subtotal: 16850,
    tax: 0,
    discount: 350,
    total: 16500,
    amountPaid: 16500,
    notes: 'Neurology consultation with MRI scan.',
    items: [
      { id: 'li-006', type: 'consultation', description: 'Neurology consultation', quantity: 1, unitPrice: 4000, total: 4000 },
      { id: 'li-007', type: 'imaging', description: 'MRI Brain Scan', quantity: 1, unitPrice: 12500, total: 12500 },
      { id: 'li-008', type: 'prescription', description: 'Paracetamol 500mg', quantity: 1, unitPrice: 350, total: 350 },
    ],
  },
  {
    id: 'inv-005',
    invoiceNumber: 'INV-2026-0005',
    patientId: 'ce000000-0000-0000-0000-000000000002',
    patientName: 'Dinesh Rajapaksa',
    doctorName: 'Dr. Kamal Perera',
    status: 'sent',
    paymentMethod: null,
    issueDate: daysAgo(1),
    dueDate: daysFromNow(13),
    paidDate: null,
    subtotal: 3500,
    tax: 0,
    discount: 0,
    total: 3500,
    amountPaid: 0,
    notes: 'Cardiology follow-up.',
    items: [
      { id: 'li-009', type: 'consultation', description: 'Cardiology follow-up', quantity: 1, unitPrice: 3500, total: 3500 },
    ],
  },

  // ─── Kavindi Weerasinghe ───
  {
    id: 'inv-006',
    invoiceNumber: 'INV-2026-0006',
    patientId: 'ce000000-0000-0000-0000-000000000003',
    patientName: 'Kavindi Weerasinghe',
    doctorName: 'Dr. Ruwan Fernando',
    status: 'paid',
    paymentMethod: 'bank_transfer',
    issueDate: daysAgo(20),
    dueDate: daysAgo(6),
    paidDate: daysAgo(8),
    subtotal: 6120,
    tax: 0,
    discount: 0,
    total: 6120,
    amountPaid: 6120,
    notes: 'Orthopedic consultation with X-ray and medication.',
    items: [
      { id: 'li-010', type: 'consultation', description: 'Orthopedic consultation', quantity: 1, unitPrice: 3500, total: 3500 },
      { id: 'li-011', type: 'imaging', description: 'X-Ray Left Knee (AP/Lateral)', quantity: 1, unitPrice: 2200, total: 2200 },
      { id: 'li-012', type: 'prescription', description: 'Ibuprofen 400mg — 2 weeks', quantity: 1, unitPrice: 420, total: 420 },
    ],
  },
  {
    id: 'inv-007',
    invoiceNumber: 'INV-2026-0007',
    patientId: 'ce000000-0000-0000-0000-000000000003',
    patientName: 'Kavindi Weerasinghe',
    doctorName: 'Dr. Ruwan Fernando',
    status: 'partially_paid',
    paymentMethod: 'insurance',
    issueDate: daysAgo(10),
    dueDate: daysFromNow(4),
    paidDate: null,
    subtotal: 15000,
    tax: 0,
    discount: 0,
    total: 15000,
    amountPaid: 10000,
    notes: 'Insurance partially covered knee surgery.',
    items: [
      { id: 'li-013', type: 'procedure', description: 'Knee surgery consultation', quantity: 1, unitPrice: 5000, total: 5000 },
      { id: 'li-014', type: 'procedure', description: 'Physical therapy (4 sessions)', quantity: 4, unitPrice: 2500, total: 10000 },
    ],
  },

  // ─── Nuwan Jayasuriya ───
  {
    id: 'inv-008',
    invoiceNumber: 'INV-2026-0008',
    patientId: 'ce000000-0000-0000-0000-000000000004',
    patientName: 'Nuwan Jayasuriya',
    doctorName: 'Dr. Kamal Perera',
    status: 'paid',
    paymentMethod: 'cash',
    issueDate: daysAgo(15),
    dueDate: daysAgo(1),
    paidDate: daysAgo(3),
    subtotal: 5650,
    tax: 0,
    discount: 0,
    total: 5650,
    amountPaid: 5650,
    notes: 'Cardiac checkup with ECG.',
    items: [
      { id: 'li-015', type: 'consultation', description: 'Cardiology consultation', quantity: 1, unitPrice: 3500, total: 3500 },
      { id: 'li-016', type: 'lab_test', description: 'ECG (12-Lead)', quantity: 1, unitPrice: 1500, total: 1500 },
      { id: 'li-017', type: 'prescription', description: 'Warfarin 5mg — ongoing', quantity: 1, unitPrice: 650, total: 650 },
    ],
  },
  {
    id: 'inv-009',
    invoiceNumber: 'INV-2026-0009',
    patientId: 'ce000000-0000-0000-0000-000000000004',
    patientName: 'Nuwan Jayasuriya',
    doctorName: 'Dr. Sithara Silva',
    status: 'overdue',
    paymentMethod: null,
    issueDate: daysAgo(20),
    dueDate: daysAgo(6),
    paidDate: null,
    subtotal: 10900,
    tax: 0,
    discount: 0,
    total: 10900,
    amountPaid: 0,
    notes: 'Neurology assessment and nerve conduction study.',
    items: [
      { id: 'li-018', type: 'consultation', description: 'Neurology consultation', quantity: 1, unitPrice: 4000, total: 4000 },
      { id: 'li-019', type: 'procedure', description: 'Nerve Conduction Study', quantity: 1, unitPrice: 8500, total: 8500 },
      { id: 'li-020', type: 'prescription', description: 'Gabapentin 300mg — 6 months', quantity: 1, unitPrice: -1600, total: -1600 },
    ],
  },

  // ─── Arjuna Ranatunga ───
  {
    id: 'inv-010',
    invoiceNumber: 'INV-2026-0010',
    patientId: 'ce000000-0000-0000-0000-000000000019',
    patientName: 'Arjuna Ranatunga',
    doctorName: 'Dr. Kamal Perera',
    status: 'paid',
    paymentMethod: 'insurance',
    issueDate: daysAgo(19),
    dueDate: daysAgo(5),
    paidDate: daysAgo(6),
    subtotal: 11500,
    tax: 0,
    discount: 1000,
    total: 10500,
    amountPaid: 10500,
    notes: 'Cardiac monitoring and stress test.',
    items: [
      { id: 'li-021', type: 'consultation', description: 'Cardiology monitoring', quantity: 1, unitPrice: 5000, total: 5000 },
      { id: 'li-022', type: 'procedure', description: 'Cardiac Stress Test', quantity: 1, unitPrice: 6500, total: 6500 },
    ],
  },
  {
    id: 'inv-011',
    invoiceNumber: 'INV-2026-0011',
    patientId: 'ce000000-0000-0000-0000-000000000019',
    patientName: 'Arjuna Ranatunga',
    doctorName: 'Dr. Malsha Kulathunga',
    status: 'paid',
    paymentMethod: 'debit_card',
    issueDate: daysAgo(8),
    dueDate: daysFromNow(6),
    paidDate: daysAgo(2),
    subtotal: 6700,
    tax: 0,
    discount: 0,
    total: 6700,
    amountPaid: 6700,
    notes: 'Endocrinology consult with labs and medication.',
    items: [
      { id: 'li-023', type: 'consultation', description: 'Endocrinology consultation', quantity: 1, unitPrice: 4500, total: 4500 },
      { id: 'li-024', type: 'lab_test', description: 'HbA1c Test', quantity: 1, unitPrice: 1100, total: 1100 },
      { id: 'li-025', type: 'lab_test', description: 'Renal Function Panel', quantity: 1, unitPrice: 1400, total: 1400 },
      { id: 'li-026', type: 'prescription', description: 'Insulin Glargine + Metformin', quantity: 1, unitPrice: -300, total: -300 },
    ],
  },
  {
    id: 'inv-012',
    invoiceNumber: 'INV-2026-0012',
    patientId: 'ce000000-0000-0000-0000-000000000019',
    patientName: 'Arjuna Ranatunga',
    doctorName: 'Dr. Kamal Perera',
    status: 'void',
    paymentMethod: null,
    issueDate: daysAgo(5),
    dueDate: daysFromNow(9),
    paidDate: null,
    subtotal: 4500,
    tax: 0,
    discount: 0,
    total: 4500,
    amountPaid: 0,
    notes: 'Voided — duplicate invoice.',
    items: [
      { id: 'li-027', type: 'consultation', description: 'Endocrinology follow-up', quantity: 1, unitPrice: 4500, total: 4500 },
    ],
  },

  // ─── Hasini Abeywickrama ───
  {
    id: 'inv-013',
    invoiceNumber: 'INV-2026-0013',
    patientId: 'ce000000-0000-0000-0000-000000000005',
    patientName: 'Hasini Abeywickrama',
    doctorName: 'Dr. Anjali Dissanayake',
    status: 'paid',
    paymentMethod: 'credit_card',
    issueDate: daysAgo(10),
    dueDate: daysFromNow(4),
    paidDate: daysAgo(5),
    subtotal: 4080,
    tax: 0,
    discount: 0,
    total: 4080,
    amountPaid: 4080,
    notes: 'Pediatric consultation and iron studies.',
    items: [
      { id: 'li-028', type: 'consultation', description: 'Pediatric consultation', quantity: 1, unitPrice: 2800, total: 2800 },
      { id: 'li-029', type: 'lab_test', description: 'Serum Ferritin', quantity: 1, unitPrice: 900, total: 900 },
      { id: 'li-030', type: 'prescription', description: 'Ferrous Sulfate 200mg', quantity: 1, unitPrice: 380, total: 380 },
    ],
  },

  // ─── Lahiru Gunasekara ───
  {
    id: 'inv-014',
    invoiceNumber: 'INV-2026-0014',
    patientId: 'ce000000-0000-0000-0000-000000000006',
    patientName: 'Lahiru Gunasekara',
    doctorName: 'Dr. Ruwan Fernando',
    status: 'draft',
    paymentMethod: null,
    issueDate: daysAgo(1),
    dueDate: daysFromNow(13),
    paidDate: null,
    subtotal: 9200,
    tax: 0,
    discount: 0,
    total: 9200,
    amountPaid: 0,
    notes: 'Sports injury assessment — draft, pending doctor review.',
    items: [
      { id: 'li-031', type: 'consultation', description: 'Orthopedic consultation', quantity: 1, unitPrice: 3500, total: 3500 },
      { id: 'li-032', type: 'imaging', description: 'MRI Left Knee', quantity: 1, unitPrice: 5700, total: 5700 },
    ],
  },

  // ─── Chaminda Bandara ───
  {
    id: 'inv-015',
    invoiceNumber: 'INV-2026-0015',
    patientId: 'ce000000-0000-0000-0000-000000000011',
    patientName: 'Chaminda Bandara',
    doctorName: 'Dr. Kamal Perera',
    status: 'cancelled',
    paymentMethod: null,
    issueDate: daysAgo(8),
    dueDate: daysFromNow(6),
    paidDate: null,
    subtotal: 3500,
    tax: 0,
    discount: 0,
    total: 3500,
    amountPaid: 0,
    notes: 'Cancelled — patient rescheduled.',
    items: [
      { id: 'li-033', type: 'consultation', description: 'Cardiology consultation', quantity: 1, unitPrice: 3500, total: 3500 },
    ],
  },
];

/**
 * Get mock invoices, optionally filtered by patientId.
 * @param {Object} [filters]
 * @param {string} [filters.patientId]
 * @param {string} [filters.status]
 * @param {string} [filters.search]
 * @returns {Array}
 */
export const getMockInvoices = (filters = {}) => {
  let data = [...MOCK_INVOICES];

  if (filters.patientId) {
    data = data.filter((inv) => inv.patientId === filters.patientId);
  }
  if (filters.status && filters.status !== 'all') {
    data = data.filter((inv) => inv.status === filters.status);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    data = data.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.patientName.toLowerCase().includes(q) ||
        inv.doctorName.toLowerCase().includes(q) ||
        (inv.notes || '').toLowerCase().includes(q)
    );
  }

  return data.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
};

/**
 * Get a single mock invoice by ID.
 */
export const getMockInvoiceById = (id) => MOCK_INVOICES.find((inv) => inv.id === id) || null;

/**
 * Compute summary stats from mock data.
 */
export const getMockBillingSummary = () => {
  const invoices = MOCK_INVOICES.filter((inv) => inv.status !== 'void' && inv.status !== 'cancelled');
  const totalBilled = invoices.reduce((s, inv) => s + inv.total, 0);
  const totalCollected = invoices.reduce((s, inv) => s + inv.amountPaid, 0);
  const totalOutstanding = totalBilled - totalCollected;
  const overdueCount = MOCK_INVOICES.filter((inv) => inv.status === 'overdue').length;
  const draftCount = MOCK_INVOICES.filter((inv) => inv.status === 'draft').length;

  return { totalBilled, totalCollected, totalOutstanding, overdueCount, draftCount, invoiceCount: MOCK_INVOICES.length };
};
