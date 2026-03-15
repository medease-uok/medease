const db = require('../config/database')

const getStatistics = async (req, res, next) => {
  try {
    const [
      totalResult,
      departmentResult,
      genderResult,
    ] = await Promise.all([
      db.query(`
        SELECT COUNT(*) AS total_nurses
        FROM nurses n
        JOIN users u ON n.user_id = u.id
        WHERE u.is_active = true
      `),

      db.query(`
        SELECT COALESCE(n.department, 'Unassigned') AS department, COUNT(*) AS count
        FROM nurses n
        JOIN users u ON n.user_id = u.id
        WHERE u.is_active = true
        GROUP BY n.department
        ORDER BY count DESC
      `),

      db.query(`
        SELECT
          CASE
            WHEN u.date_of_birth IS NULL THEN 'Not specified'
            ELSE
              CASE
                WHEN AGE(u.date_of_birth) < INTERVAL '25 years' THEN 'Under 25'
                WHEN AGE(u.date_of_birth) < INTERVAL '35 years' THEN '25-34'
                WHEN AGE(u.date_of_birth) < INTERVAL '45 years' THEN '35-44'
                WHEN AGE(u.date_of_birth) < INTERVAL '55 years' THEN '45-54'
                ELSE '55+'
              END
          END AS age_group,
          COUNT(*) AS count
        FROM nurses n
        JOIN users u ON n.user_id = u.id
        WHERE u.is_active = true
        GROUP BY age_group
        ORDER BY
          CASE age_group
            WHEN 'Under 25' THEN 1
            WHEN '25-34' THEN 2
            WHEN '35-44' THEN 3
            WHEN '45-54' THEN 4
            WHEN '55+' THEN 5
            ELSE 6
          END
      `),
    ])

    res.json({
      status: 'success',
      data: {
        totalNurses: parseInt(totalResult.rows[0].total_nurses, 10),
        byDepartment: departmentResult.rows.map((r) => ({
          department: r.department,
          count: parseInt(r.count, 10),
        })),
        byAgeGroup: genderResult.rows.map((r) => ({
          ageGroup: r.age_group,
          count: parseInt(r.count, 10),
        })),
      },
    })
  } catch (err) {
    return next(err)
  }
}

module.exports = { getStatistics }
