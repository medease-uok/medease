/**
 * Format 24-hour time string to 12-hour AM/PM format
 * @param {string} time - Time in HH:mm format (e.g., "14:30")
 * @returns {string} Formatted time (e.g., "2:30 PM")
 */
export function formatSlotTime(time) {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}
