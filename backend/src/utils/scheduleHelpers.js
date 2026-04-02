const SLOT_DURATION_MINUTES = 20

// Clinic operates in a fixed timezone; all schedule comparisons use this.
const CLINIC_TIMEZONE = 'Asia/Colombo'

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

/**
 * Converts a UTC Date to clinic local time and returns day-of-week and time in minutes.
 * Returns { dayOfWeek (0=Sun..6=Sat), totalMinutes } in the clinic's local timezone.
 *
 * Used for comparing appointment times against doctor_schedules which are stored in
 * local clinic time (e.g., "08:00-17:00" means 8am-5pm Asia/Colombo time).
 */
function clinicLocalTime(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TIMEZONE,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(date).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {})

  const DAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

  return {
    dayOfWeek: DAY_INDEX[parts.weekday],
    totalMinutes: (parseInt(parts.hour, 10) % 24) * 60 + parseInt(parts.minute, 10),
  }
}

module.exports = { SLOT_DURATION_MINUTES, CLINIC_TIMEZONE, generateSlots, clinicLocalTime }
