import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Send,
  HelpCircle,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  Wallet,
} from 'lucide-react';

// ─── Invoice statuses ───
export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  PARTIALLY_PAID: 'partially_paid',
  OVERDUE: 'overdue',
  VOID: 'void',
  CANCELLED: 'cancelled',
};

export const INVOICE_STATUS_CONFIG = {
  [INVOICE_STATUS.DRAFT]: {
    label: 'Draft',
    icon: Clock,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
  },
  [INVOICE_STATUS.SENT]: {
    label: 'Sent',
    icon: Send,
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
  },
  [INVOICE_STATUS.PAID]: {
    label: 'Paid',
    icon: CheckCircle,
    badgeClass: 'bg-green-100 text-green-700 border-green-200',
    dotClass: 'bg-green-500',
  },
  [INVOICE_STATUS.PARTIALLY_PAID]: {
    label: 'Partially Paid',
    icon: AlertCircle,
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  [INVOICE_STATUS.OVERDUE]: {
    label: 'Overdue',
    icon: AlertCircle,
    badgeClass: 'bg-red-100 text-red-700 border-red-200',
    dotClass: 'bg-red-500',
  },
  [INVOICE_STATUS.VOID]: {
    label: 'Void',
    icon: XCircle,
    badgeClass: 'bg-gray-100 text-gray-600 border-gray-200',
    dotClass: 'bg-gray-400',
  },
  [INVOICE_STATUS.CANCELLED]: {
    label: 'Cancelled',
    icon: XCircle,
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    dotClass: 'bg-slate-400',
  },
};

/** Neutral fallback for unrecognized statuses */
const UNKNOWN_STATUS_CONFIG = {
  label: 'Unknown',
  icon: HelpCircle,
  badgeClass: 'bg-gray-100 text-gray-500 border-gray-200',
  dotClass: 'bg-gray-400',
};

/**
 * Get the UI config for an invoice status.
 * Falls back to a neutral "Unknown" config for unrecognized statuses.
 */
export const getInvoiceStatusConfig = (status) => {
  const config = INVOICE_STATUS_CONFIG[status];
  if (!config) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Unknown invoice status: "${status}".`);
    }
    return UNKNOWN_STATUS_CONFIG;
  }
  return config;
};

// ─── Line item types ───
export const LINE_ITEM_TYPES = {
  CONSULTATION: 'consultation',
  LAB_TEST: 'lab_test',
  PRESCRIPTION: 'prescription',
  PROCEDURE: 'procedure',
  ADMISSION: 'admission',
  IMAGING: 'imaging',
  THERAPY: 'therapy',
  OTHER: 'other',
};

export const LINE_ITEM_LABELS = {
  [LINE_ITEM_TYPES.CONSULTATION]: 'Consultation',
  [LINE_ITEM_TYPES.LAB_TEST]: 'Lab Test',
  [LINE_ITEM_TYPES.PRESCRIPTION]: 'Prescription',
  [LINE_ITEM_TYPES.PROCEDURE]: 'Procedure',
  [LINE_ITEM_TYPES.ADMISSION]: 'Admission',
  [LINE_ITEM_TYPES.IMAGING]: 'Imaging',
  [LINE_ITEM_TYPES.THERAPY]: 'Therapy',
  [LINE_ITEM_TYPES.OTHER]: 'Other',
};

// ─── Payment methods ───
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  MOBILE_PAYMENT: 'mobile_payment',
  BANK_TRANSFER: 'bank_transfer',
  INSURANCE: 'insurance',
};

export const PAYMENT_METHOD_CONFIG = {
  [PAYMENT_METHODS.CASH]: { label: 'Cash', icon: Banknote },
  [PAYMENT_METHODS.CREDIT_CARD]: { label: 'Credit Card', icon: CreditCard },
  [PAYMENT_METHODS.DEBIT_CARD]: { label: 'Debit Card', icon: CreditCard },
  [PAYMENT_METHODS.MOBILE_PAYMENT]: { label: 'Mobile Payment', icon: Smartphone },
  [PAYMENT_METHODS.BANK_TRANSFER]: { label: 'Bank Transfer', icon: Building2 },
  [PAYMENT_METHODS.INSURANCE]: { label: 'Insurance', icon: Wallet },
};

// ─── Filter/sort/pagination ───
export const INVOICE_FILTER_OPTIONS = {
  ALL: 'all',
  ...INVOICE_STATUS,
};

export const INVOICE_SORT_OPTIONS = {
  DATE_DESC: '-created_at',
  DATE_ASC: 'created_at',
  AMOUNT_DESC: '-total',
  AMOUNT_ASC: 'total',
  DUE_DATE_ASC: 'due_date',
};

export const INVOICE_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LIMITS: [10, 25, 50],
};

/**
 * Format currency in LKR
 */
export const formatCurrency = (amount) =>
  `LKR ${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
