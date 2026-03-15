const SLOT_DURATION_MINUTES = 20

/**
 * Generate all 20-minute slots between startTime and endTime.
 * Returns array of "HH:MM" strings.
 */
function generateSlots(startTime, endTime) {
  const slots = []
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  for (let m = startMinutes; m + SLOT_DURATION_MINUTES <= endMinutes; m += SLOT_DURATION_MINUTES) {
    const h = Math.floor(m / 60)
    const min = m % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
  }
  return slots
}

module.exports = { SLOT_DURATION_MINUTES, generateSlots }
