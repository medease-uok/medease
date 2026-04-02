export const EXPIRY_WARNING_THRESHOLD_DAYS = 30;

export const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  // If it's a full ISO string with T, split it.
  const datePart = dateStr.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const getExpiryStatus = (expiryDate, threshold = EXPIRY_WARNING_THRESHOLD_DAYS) => {
  if (!expiryDate) return { status: 'normal', daysRemaining: null };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = parseLocalDate(expiryDate);
  const daysRemaining = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) return { status: 'danger', daysRemaining };
  if (daysRemaining === 0) return { status: 'critical', daysRemaining };
  if (daysRemaining <= threshold) return { status: 'warning', daysRemaining };
  return { status: 'normal', daysRemaining };
};
