/**
 * Format dispensing status for display
 */
export const formatDispensingStatus = (status) => {
  const statusMap = {
    pending: 'Pending',
    in_progress: 'In Progress',
    dispensed: 'Dispensed',
    on_hold: 'On Hold',
    cancelled: 'Cancelled',
  };
  return statusMap[status] || status;
};

/**
 * Get status color styles
 */
export const getStatusColorStyles = (status) => {
  const styles = {
    pending: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      badge: 'warning',
    },
    in_progress: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      badge: 'default',
    },
    dispensed: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      badge: 'success',
    },
    on_hold: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      badge: 'destructive',
    },
    cancelled: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      badge: 'destructive',
    },
  };
  return styles[status] || styles.pending;
};

/**
 * Format priority level
 */
export const formatPriority = (priority) => {
  const priorityMap = {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent',
  };
  return priorityMap[priority] || priority;
};

/**
 * Get priority color styles
 */
export const getPriorityColorStyles = (priority) => {
  const styles = {
    low: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      badge: 'secondary',
    },
    normal: {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      badge: 'secondary',
    },
    high: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      badge: 'destructive',
    },
    urgent: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      badge: 'destructive',
    },
  };
  return styles[priority] || styles.normal;
};

/**
 * Calculate dispensing time (time taken from request to dispensing)
 */
export const calculateDispensingTime = (requestDate, dispensedDate) => {
  if (!requestDate || !dispensedDate) return null;

  const request = new Date(requestDate);
  const dispensed = new Date(dispensedDate);
  const diffMs = dispensed - request;

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
};

/**
 * Check if dispensing request is overdue
 */
export const isRequestOverdue = (requestDate, maxWaitMinutes = 120) => {
  const request = new Date(requestDate);
  const now = new Date();
  const diffMs = now - request;
  const minutes = Math.floor(diffMs / 60000);
  return minutes > maxWaitMinutes;
};

/**
 * Get overdue time display
 */
export const getOverdueDisplay = (requestDate) => {
  const request = new Date(requestDate);
  const now = new Date();
  const diffMs = now - request;
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m overdue`;
  }
  return `${minutes}m overdue`;
};

/**
 * Format batch number for display
 */
export const formatBatchNumber = (batchNumber) => {
  if (!batchNumber) return 'N/A';
  return batchNumber.toUpperCase();
};

/**
 * Check if medication is close to expiry
 */
export const isCloseToExpiry = (expiryDate, daysThreshold = 30) => {
  if (!expiryDate) return false;

  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 && diffDays <= daysThreshold;
};

/**
 * Check if medication is expired
 */
export const isExpired = (expiryDate) => {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const today = new Date();
  return expiry < today;
};

/**
 * Get expiry status display
 */
export const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return { status: 'unknown', display: 'Unknown' };

  if (isExpired(expiryDate)) {
    return { status: 'expired', display: 'Expired' };
  }

  if (isCloseToExpiry(expiryDate)) {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { status: 'expiring_soon', display: `Expires in ${diffDays}d` };
  }

  return { status: 'valid', display: 'Valid' };
};

/**
 * Filter requests by status
 */
export const filterByStatus = (requests, status) => {
  if (status === 'all') return requests;
  return requests.filter(req => req.status === status);
};

/**
 * Filter requests by priority
 */
export const filterByPriority = (requests, priority) => {
  if (priority === 'all') return requests;
  return requests.filter(req => req.priority === priority);
};

/**
 * Search requests by query
 */
export const searchRequests = (requests, query) => {
  if (!query) return requests;

  const lowerQuery = query.toLowerCase();
  return requests.filter(req =>
    req.patientName.toLowerCase().includes(lowerQuery) ||
    req.prescriptionId.toLowerCase().includes(lowerQuery) ||
    req.doctorName.toLowerCase().includes(lowerQuery) ||
    req.medications.some(med =>
      med.name.toLowerCase().includes(lowerQuery) ||
      med.strength.toLowerCase().includes(lowerQuery)
    )
  );
};

/**
 * Sort requests by various criteria
 */
export const sortRequests = (requests, sortBy = 'recent') => {
  const sorted = [...requests];

  switch (sortBy) {
    case 'recent':
      return sorted.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));

    case 'oldest':
      return sorted.sort((a, b) => new Date(a.requestDate) - new Date(b.requestDate));

    case 'priority':
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      return sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    case 'patient':
      return sorted.sort((a, b) => a.patientName.localeCompare(b.patientName));

    default:
      return sorted;
  }
};

/**
 * Calculate total quantity of medications in a request
 */
export const calculateTotalQuantity = (medications) => {
  return medications.reduce((total, med) => total + med.quantity, 0);
};

/**
 * Get medication list as string
 */
export const getMedicationListString = (medications) => {
  if (!medications || medications.length === 0) return 'No medications';
  if (medications.length === 1) {
    return medications[0].name;
  }
  return `${medications[0].name} +${medications.length - 1} more`;
};

/**
 * Validate batch number format
 */
export const isValidBatchNumber = (batchNumber) => {
  // Batch numbers should be alphanumeric
  const batchRegex = /^[A-Z0-9\-]{3,20}$/;
  return batchRegex.test(batchNumber);
};

/**
 * Validate expiry date
 */
export const isValidExpiryDate = (expiryDate) => {
  if (!expiryDate) return false;
  const date = new Date(expiryDate);
  const today = new Date();
  // Expiry date should be in the future
  return date > today;
};

/**
 * Generate dispensing report summary
 */
export const generateDispensingReport = (requests) => {
  const totalRequests = requests.length;
  const dispensedCount = requests.filter(r => r.status === 'dispensed').length;
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const inProgressCount = requests.filter(r => r.status === 'in_progress').length;
  const onHoldCount = requests.filter(r => r.status === 'on_hold').length;

  const totalMedications = requests.reduce((acc, req) => acc + req.medications.length, 0);
  const avgDispensingTime = requests
    .filter(r => r.dispensedDate)
    .reduce((acc, req) => acc + (new Date(req.dispensedDate) - new Date(req.requestDate)), 0) /
    (requests.filter(r => r.dispensedDate).length || 1);

  return {
    totalRequests,
    dispensedCount,
    pendingCount,
    inProgressCount,
    onHoldCount,
    totalMedications,
    avgDispensingTime: Math.floor(avgDispensingTime / 60000), // Convert to minutes
    dispensingRate: ((dispensedCount / totalRequests) * 100).toFixed(1),
  };
};

/**
 * Sanitize value for CSV export to prevent CSV injection attacks
 * @param {*} value - Value to sanitize
 * @returns {string} - Sanitized value safe for CSV
 */
export const sanitizeForCSV = (value) => {
  if (value === null || value === undefined) return '';

  const str = String(value);

  // Check for dangerous characters that indicate CSV injection
  if (/^[=+\-@]/.test(str)) {
    // Prefix with single quote to prevent formula execution
    return `'${str}`;
  }

  // Escape double quotes and wrap in quotes if contains comma, newline, or quote
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
};

/**
 * Convert dispensing data to CSV format with sanitization
 * @param {Array} records - Array of records to convert
 * @param {Array} headers - Column headers
 * @returns {string} - CSV formatted string
 */
export const convertToCSV = (records, headers) => {
  if (!records || records.length === 0) return '';

  // Sanitize headers
  const headerRow = headers.map(h => sanitizeForCSV(h)).join(',');

  // Sanitize data rows
  const dataRows = records.map(record => {
    return headers.map(header => {
      const value = record[header];
      return sanitizeForCSV(value);
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
};

/**
 * Download CSV file with proper encoding
 * @param {string} csvContent - CSV formatted content
 * @param {string} filename - File name for download
 */
export const downloadCSV = (csvContent, filename = 'export.csv') => {
  const BOM = '\uFEFF'; // UTF-8 BOM for proper Excel encoding
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
