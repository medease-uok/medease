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

export const REORDER_MULTIPLIER = 3;
export const MINIMUM_REORDER_QUANTITY = 10;

/**
 * Calculates a reorder quantity suggestion for a low-stock item.
 * Targets restocking to 3× the reorder level as a buffer.
 *
 * @param {number} currentQuantity - Current stock quantity (must be >= 0)
 * @param {number} reorderLevel - The minimum threshold before reordering
 * @returns {number} Suggested quantity to order, or 0 if not needed
 */
export const calculateReorderSuggestion = (currentQuantity, reorderLevel) => {
  if (typeof currentQuantity !== 'number' || typeof reorderLevel !== 'number') return 0;
  
  const safeQuantity = Math.max(0, currentQuantity);
  
  if (safeQuantity > reorderLevel) {
    return 0;
  }
  
  const targetStock = reorderLevel > 0 ? reorderLevel * REORDER_MULTIPLIER : MINIMUM_REORDER_QUANTITY;
  const suggestion = targetStock - safeQuantity;
  return suggestion > 0 ? suggestion : 0;
};
