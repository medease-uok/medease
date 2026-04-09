import {
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  Wallet,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

export const PAYMENT_STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
};

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  MOBILE_PAYMENT: 'mobile_payment',
  BANK_TRANSFER: 'bank_transfer',
  INSURANCE: 'insurance',
};

export const PAYMENT_CATEGORIES = {
  CONSULTATION: 'consultation',
  LAB_TEST: 'lab_test',
  PRESCRIPTION: 'prescription',
  PROCEDURE: 'procedure',
  ADMISSION: 'admission',
  OTHER: 'other',
};

export const PAYMENT_STATUS_CONFIG = {
  [PAYMENT_STATUS.COMPLETED]: {
    label: 'Completed',
    icon: CheckCircle,
    badgeClass: 'bg-green-100 text-green-700 border-green-200',
    dotClass: 'bg-green-500',
  },
  [PAYMENT_STATUS.PENDING]: {
    label: 'Pending',
    icon: Clock,
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  [PAYMENT_STATUS.FAILED]: {
    label: 'Failed',
    icon: XCircle,
    badgeClass: 'bg-red-100 text-red-700 border-red-200',
    dotClass: 'bg-red-500',
  },
  [PAYMENT_STATUS.REFUNDED]: {
    label: 'Refunded',
    icon: RotateCcw,
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
  },
  [PAYMENT_STATUS.CANCELLED]: {
    label: 'Cancelled',
    icon: AlertCircle,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-500',
  },
};

export const PAYMENT_METHOD_CONFIG = {
  [PAYMENT_METHODS.CASH]: {
    label: 'Cash',
    icon: Banknote,
    color: 'text-green-600',
  },
  [PAYMENT_METHODS.CREDIT_CARD]: {
    label: 'Credit Card',
    icon: CreditCard,
    color: 'text-blue-600',
  },
  [PAYMENT_METHODS.DEBIT_CARD]: {
    label: 'Debit Card',
    icon: CreditCard,
    color: 'text-indigo-600',
  },
  [PAYMENT_METHODS.MOBILE_PAYMENT]: {
    label: 'Mobile Payment',
    icon: Smartphone,
    color: 'text-purple-600',
  },
  [PAYMENT_METHODS.BANK_TRANSFER]: {
    label: 'Bank Transfer',
    icon: Building2,
    color: 'text-slate-600',
  },
  [PAYMENT_METHODS.INSURANCE]: {
    label: 'Insurance',
    icon: Wallet,
    color: 'text-teal-600',
  },
};

export const CATEGORY_LABELS = {
  [PAYMENT_CATEGORIES.CONSULTATION]: 'Consultation',
  [PAYMENT_CATEGORIES.LAB_TEST]: 'Lab Test',
  [PAYMENT_CATEGORIES.PRESCRIPTION]: 'Prescription',
  [PAYMENT_CATEGORIES.PROCEDURE]: 'Procedure',
  [PAYMENT_CATEGORIES.ADMISSION]: 'Admission',
  [PAYMENT_CATEGORIES.OTHER]: 'Other',
};

export const getStatusConfig = (status) => {
  if (process.env.NODE_ENV === 'development' && !PAYMENT_STATUS_CONFIG[status]) {
    console.warn(`Unknown payment status: "${status}". Falling back to pending.`);
  }
  return PAYMENT_STATUS_CONFIG[status] || PAYMENT_STATUS_CONFIG[PAYMENT_STATUS.PENDING];
};

export const getMethodConfig = (method) => {
  if (process.env.NODE_ENV === 'development' && !PAYMENT_METHOD_CONFIG[method]) {
    console.warn(`Unknown payment method: "${method}". Falling back to cash.`);
  }
  return PAYMENT_METHOD_CONFIG[method] || PAYMENT_METHOD_CONFIG[PAYMENT_METHODS.CASH];
};

export const PAYMENT_FILTER_OPTIONS = {
  ALL: 'all',
  ...PAYMENT_STATUS,
};

export const PAYMENT_SORT_OPTIONS = {
  DATE_DESC: '-created_at',
  DATE_ASC: 'created_at',
  AMOUNT_DESC: '-amount',
  AMOUNT_ASC: 'amount',
};

export const PAYMENT_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LIMITS: [10, 25, 50],
};
