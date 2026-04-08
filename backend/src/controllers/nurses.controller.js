const db = require('../config/database');

const getStatistics = async (req, res, next) => {
  try {
    const [
      totalResult,
      departmentResult,
      ageGroupResult,
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
        SELECT age_group, "count" FROM (
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
            COUNT(*) AS "count"
          FROM nurses n
          JOIN users u ON n.user_id = u.id
          WHERE u.is_active = true
          GROUP BY 1
        ) sub
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
    ]);

    res.json({
      status: 'success',
      data: {
        totalNurses: parseInt(totalResult.rows[0].total_nurses, 10),
        byDepartment: departmentResult.rows.map((r) => ({
          department: r.department,
          count: parseInt(r.count, 10),
        })),
        byAgeGroup: ageGroupResult.rows.map((r) => ({
          ageGroup: r.age_group,
          count: parseInt(r.count, 10),
        })),
      },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getStatistics };

// ─── Care Notes ───────────────────────────────────────────────────────────────
const AppError = require('../utils/AppError');

const getCareNotes = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const result = await db.query(
      `SELECT ncn.id, ncn.note, ncn.created_at, ncn.updated_at,
              u.first_name || ' ' || u.last_name AS nurse_name
       FROM nurse_care_notes ncn
       JOIN nurses n ON ncn.nurse_id = n.id
       JOIN users u ON n.user_id = u.id
       WHERE ncn.patient_id = $1
       ORDER BY ncn.created_at DESC`,
      [patientId]
    );
    res.json({ status: 'success', data: result.rows });
  } catch (err) { next(err); }
};

const addCareNote = async (req, res, next) => {
  try {
    const nurseId = req.nurseId;
    const { patientId } = req.params;
    const { note } = req.body;
    if (!note || !note.trim()) throw new AppError('Note text is required.', 400);

    const result = await db.query(
      `INSERT INTO nurse_care_notes (nurse_id, patient_id, note)
       VALUES ($1, $2, $3)
       RETURNING id, note, created_at, updated_at`,
      [nurseId, patientId, note.trim()]
    );
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) { next(err); }
};

const updateCareNote = async (req, res, next) => {
  try {
    const nurseId = req.nurseId;
    const { noteId } = req.params;
    const { note } = req.body;
    if (!note || !note.trim()) throw new AppError('Note text is required.', 400);

    const result = await db.query(
      `UPDATE nurse_care_notes
       SET note = $1, updated_at = NOW()
       WHERE id = $2 AND nurse_id = $3
       RETURNING id, note, created_at, updated_at`,
      [note.trim(), noteId, nurseId]
    );
    if (result.rows.length === 0) throw new AppError('Note not found or not yours.', 404);
    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) { next(err); }
};

const deleteCareNote = async (req, res, next) => {
  try {
    const nurseId = req.nurseId;
    const { noteId } = req.params;
    const result = await db.query(
      `DELETE FROM nurse_care_notes WHERE id = $1 AND nurse_id = $2 RETURNING id`,
      [noteId, nurseId]
    );
    if (result.rows.length === 0) throw new AppError('Note not found or not yours.', 404);
    res.json({ status: 'success', message: 'Note deleted.' });
  } catch (err) { next(err); }
};

// Re-export everything (getStatistics is declared above, care notes below)
module.exports = { getStatistics, getCareNotes, addCareNote, updateCareNote, deleteCareNote };

