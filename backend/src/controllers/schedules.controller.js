const db = require('../config/database')
const AppError = require('../utils/AppError')
const auditLog = require('../utils/auditLog')

const SLOT_DURATION_MINUTES = 20

const getSchedule = async (req, res, next) => {
  try {
    const { doctorId } = req.params

    const doctorCheck = await db.query(
      'SELECT id FROM doctors WHERE id = $1', [doctorId]
    )
    if (doctorCheck.rows.length === 0) {
      throw new AppError('Doctor not found.', 404)
    }

    const result = await db.query(
      `SELECT id, day_of_week, start_time, end_time, is_active
       FROM doctor_schedules
       WHERE doctor_id = $1
       ORDER BY day_of_week ASC`,
      [doctorId]
    )

    const schedule = result.rows.map((row) => ({
      id: row.id,
      dayOfWeek: row.day_of_week,
      startTime: row.start_time.slice(0, 5),
      endTime: row.end_time.slice(0, 5),
      isActive: row.is_active,
    }))

    res.json({ status: 'success', data: { doctorId, schedule } })
  } catch (err) {
    return next(err)
  }
}

const upsertSchedule = async (req, res, next) => {
  try {
    const { doctorId } = req.params
    const { schedule } = req.body
    const { role, id: userId } = req.user

    const doctorCheck = await db.query(
      'SELECT id, user_id FROM doctors WHERE id = $1', [doctorId]
    )
    if (doctorCheck.rows.length === 0) {
      throw new AppError('Doctor not found.', 404)
    }

    const doctor = doctorCheck.rows[0]

    // Doctors can only edit their own schedule
    if (role === 'doctor' && doctor.user_id !== userId) {
      throw new AppError('You can only manage your own schedule.', 403)
    }

    const client = await db.getClient()
    try {
      await client.query('BEGIN')

      // Delete existing schedule for this doctor
      await client.query(
        'DELETE FROM doctor_schedules WHERE doctor_id = $1', [doctorId]
      )

      // Insert new schedule entries
      for (const entry of schedule) {
        await client.query(
          `INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_active)
           VALUES ($1, $2, $3, $4, $5)`,
          [doctorId, entry.dayOfWeek, entry.startTime, entry.endTime, entry.isActive]
        )
      }

      await client.query('COMMIT')
    } catch (txErr) {
      await client.query('ROLLBACK')
      throw txErr
    } finally {
      client.release()
    }

    await auditLog({
      userId,
      action: 'UPDATE_SCHEDULE',
      resourceType: 'doctor_schedule',
      resourceId: doctorId,
      ip: req.ip,
    })

    // Fetch the updated schedule to return
    const result = await db.query(
      `SELECT id, day_of_week, start_time, end_time, is_active
       FROM doctor_schedules
       WHERE doctor_id = $1
       ORDER BY day_of_week ASC`,
      [doctorId]
    )

    const updatedSchedule = result.rows.map((row) => ({
      id: row.id,
      dayOfWeek: row.day_of_week,
      startTime: row.start_time.slice(0, 5),
      endTime: row.end_time.slice(0, 5),
      isActive: row.is_active,
    }))

    res.json({ status: 'success', data: { doctorId, schedule: updatedSchedule } })
  } catch (err) {
    return next(err)
  }
}

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

const getAvailableSlots = async (req, res, next) => {
  try {
    const { doctorId } = req.params
    const { date } = req.query

    const doctorCheck = await db.query(
      'SELECT id FROM doctors WHERE id = $1', [doctorId]
    )
    if (doctorCheck.rows.length === 0) {
      throw new AppError('Doctor not found.', 404)
    }

    // Get day of week for the requested date (0=Sun, 6=Sat)
    const requestedDate = new Date(date)
    const dayOfWeek = requestedDate.getDay()

    // Get schedule for this day
    const scheduleResult = await db.query(
      `SELECT start_time, end_time, is_active
       FROM doctor_schedules
       WHERE doctor_id = $1 AND day_of_week = $2`,
      [doctorId, dayOfWeek]
    )

    if (scheduleResult.rows.length === 0 || !scheduleResult.rows[0].is_active) {
      return res.json({
        status: 'success',
        data: {
          doctorId,
          date,
          slots: [],
          totalSlots: 0,
          bookedSlots: 0,
          availableCount: 0,
        },
      })
    }

    const { start_time, end_time } = scheduleResult.rows[0]
    const startTime = start_time.slice(0, 5)
    const endTime = end_time.slice(0, 5)

    // Generate all possible slots
    const allSlots = generateSlots(startTime, endTime)

    // Get existing bookings for this doctor on this date
    const bookingsResult = await db.query(
      `SELECT TO_CHAR(scheduled_at AT TIME ZONE 'UTC', 'HH24:MI') AS slot_time
       FROM appointments
       WHERE doctor_id = $1
         AND DATE(scheduled_at) = $2
         AND status NOT IN ('cancelled', 'no_show')`,
      [doctorId, date]
    )

    const bookedTimes = new Set(bookingsResult.rows.map((r) => r.slot_time))

    // Filter out past slots if the date is today
    const now = new Date()
    const isToday = requestedDate.toDateString() === now.toDateString()

    const slots = allSlots.map((time) => {
      const isBooked = bookedTimes.has(time)
      let isPast = false
      if (isToday) {
        const [h, m] = time.split(':').map(Number)
        const slotDate = new Date(requestedDate)
        slotDate.setHours(h, m, 0, 0)
        isPast = slotDate <= now
      }
      return {
        time,
        available: !isBooked && !isPast,
        booked: isBooked,
        past: isPast,
      }
    })

    const totalSlots = allSlots.length
    const bookedSlots = bookedTimes.size
    const availableCount = slots.filter((s) => s.available).length

    res.json({
      status: 'success',
      data: {
        doctorId,
        date,
        slots,
        totalSlots,
        bookedSlots,
        availableCount,
      },
    })
  } catch (err) {
    return next(err)
  }
}

module.exports = { getSchedule, upsertSchedule, getAvailableSlots, generateSlots, SLOT_DURATION_MINUTES }
