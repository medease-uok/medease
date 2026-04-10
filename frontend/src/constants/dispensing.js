// Dispensing Status Constants
export const DISPENSING_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  DISPENSED: 'dispensed',
  ON_HOLD: 'on_hold',
  CANCELLED: 'cancelled',
};

// Priority Levels
export const DISPENSING_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
};

// Medication Units
export const MEDICATION_UNITS = [
  'tablets',
  'capsules',
  'ml',
  'l',
  'drops',
  'patches',
  'inhalers',
  'pens',
  'vials',
  'ampoules',
  'bottles',
  'boxes',
  'packets',
];

// Dosage Frequencies
export const DOSAGE_FREQUENCIES = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every 4 hours',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'As needed',
  'Before meals',
  'After meals',
  'At bedtime',
];

// Duration Options
export const MEDICATION_DURATIONS = [
  '3 days',
  '5 days',
  '7 days',
  '10 days',
  '14 days',
  '21 days',
  '1 month',
  '2 months',
  '3 months',
  '6 months',
  '1 year',
  'Ongoing',
];

// Hold Reasons
export const HOLD_REASONS = [
  { value: 'stock_out', label: 'Out of Stock' },
  { value: 'expired', label: 'Medication Expired' },
  { value: 'recall', label: 'Product Recall' },
  { value: 'verification', label: 'Awaiting Verification' },
  { value: 'patient_unavailable', label: 'Patient Unavailable' },
  { value: 'doctor_request', label: 'Doctor Request' },
  { value: 'other', label: 'Other' },
];

// Dispensing Report Types
export const REPORT_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom',
};

// Export Formats
export const EXPORT_FORMATS = {
  CSV: 'csv',
  PDF: 'pdf',
  EXCEL: 'excel',
};

// Dispensing Statistics Filters
export const STATS_TIME_RANGES = {
  TODAY: 'today',
  THIS_WEEK: 'this_week',
  THIS_MONTH: 'this_month',
  LAST_30_DAYS: 'last_30_days',
  CUSTOM: 'custom',
};

// Max waiting time (in minutes) before a request is considered overdue
export const MAX_WAIT_TIME_MINUTES = 120; // 2 hours

// Expiry warning threshold (in days)
export const EXPIRY_WARNING_DAYS = 30;

// Batch number validation rules
export const BATCH_NUMBER_RULES = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 20,
  PATTERN: /^[A-Z0-9\-]+$/,
};

// Pagination
export const ITEMS_PER_PAGE = 10;

// Sort Options
export const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'priority', label: 'By Priority' },
  { value: 'patient', label: 'By Patient Name' },
];

// Status Colors for UI
export const STATUS_COLOR_MAP = {
  pending: '#EAB308',
  in_progress: '#3B82F6',
  dispensed: '#22C55E',
  on_hold: '#F97316',
  cancelled: '#EF4444',
};

// Priority Colors for UI
export const PRIORITY_COLOR_MAP = {
  low: '#3B82F6',
  normal: '#6B7280',
  high: '#DC2626',
  urgent: '#DC2626',
};
