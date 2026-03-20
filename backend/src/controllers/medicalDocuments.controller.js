const db = require('../config/database');
const AppError = require('../utils/AppError');
const { createNotification } = require('./notifications.controller');
const auditLog = require('../utils/auditLog');
const { uploadDocumentToS3, deleteFromS3, getPresignedImageUrl } = require('../middleware/upload');

const MAX_TITLE_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 1000;

const VALID_CATEGORIES = [
  'lab_report', 'imaging', 'discharge_summary', 'referral',
  'insurance', 'consent_form', 'clinical_note', 'medical_record',
  'prescription', 'other',
];

const mapDocument = (row) => ({
  id: row.id,
  patientId: row.patient_id,
  uploadedBy: row.uploaded_by,
  uploaderName: row.uploader_name,
  patientName: row.patient_name,
  category: row.category,
  title: row.title,
  description: row.description,
  fileName: row.file_name,
  fileSize: row.file_size,
  mimeType: row.mime_type,
  createdAt: row.created_at,
});

/**
 * Build a WHERE clause that restricts documents to the user's own patients.
 *  - Admin: all documents
 *  - Patient: own documents only
 *  - Doctor: patients they have medical records, prescriptions, or appointments with
 *  - Lab tech: patients they have lab reports for, or documents they uploaded
 *  - Nurse: patients treated by doctors in the same department
 */
function buildDocumentAccessFilter(user) {
  const role = user.role;

  if (role === 'admin') {
    return { clause: 'TRUE', params: [] };
  }

  if (role === 'patient') {
    if (!user.patientId) return { clause: 'FALSE', params: [] };
    return { clause: 'md.patient_id = $1', params: [user.patientId] };
  }

  if (role === 'doctor') {
    if (!user.doctorId) return { clause: 'FALSE', params: [] };
    return {
      clause: `md.patient_id IN (
        SELECT mr.patient_id FROM medical_records mr WHERE mr.doctor_id = $1
        UNION SELECT rx.patient_id FROM prescriptions rx WHERE rx.doctor_id = $1
        UNION SELECT a.patient_id FROM appointments a WHERE a.doctor_id = $1
      )`,
      params: [user.doctorId],
    };
  }

  if (role === 'lab_technician') {
    return {
      clause: `(md.uploaded_by = $1 OR md.patient_id IN (
        SELECT lr.patient_id FROM lab_reports lr WHERE lr.technician_id = $1
      ))`,
      params: [user.id],
    };
  }

  if (role === 'nurse') {
    return {
      clause: `md.patient_id IN (
        SELECT DISTINCT a.patient_id FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        WHERE d.department = (SELECT n.department FROM nurses n WHERE n.user_id = $1)
      )`,
      params: [user.id],
    };
  }

  return { clause: 'FALSE', params: [] };
}

/**
 * Check whether the requesting user is allowed to access a specific patient's documents.
 */
async function canAccessPatientDocuments(user, patientId, docUploadedBy) {
  if (user.role === 'admin') return true;
  if (user.role === 'patient') return patientId === user.patientId;

  if (user.role === 'doctor') {
    const rel = await db.query(
      `SELECT 1 FROM medical_records WHERE doctor_id = $1 AND patient_id = $2
       UNION SELECT 1 FROM prescriptions WHERE doctor_id = $1 AND patient_id = $2
       UNION SELECT 1 FROM appointments WHERE doctor_id = $1 AND patient_id = $2
       LIMIT 1`,
      [user.doctorId, patientId]
    );
    return rel.rows.length > 0;
  }

  if (user.role === 'lab_technician') {
    if (docUploadedBy === user.id) return true;
    const rel = await db.query(
      `SELECT 1 FROM lab_reports WHERE technician_id = $1 AND patient_id = $2 LIMIT 1`,
      [user.id, patientId]
    );
    return rel.rows.length > 0;
  }

  if (user.role === 'nurse') {
    const rel = await db.query(
      `SELECT 1 FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.patient_id = $1
         AND d.department = (SELECT n.department FROM nurses n WHERE n.user_id = $2)
       LIMIT 1`,
      [patientId, user.id]
    );
    return rel.rows.length > 0;
  }

  return false;
}

const getAll = async (req, res, next) => {
  try {
    const { clause, params } = buildDocumentAccessFilter(req.user);

    const query = `
      SELECT md.id, md.patient_id, md.uploaded_by, md.category,
             md.title, md.description, md.file_name, md.file_size, md.mime_type, md.created_at,
             pu.first_name || ' ' || pu.last_name AS patient_name,
             uu.first_name || ' ' || uu.last_name AS uploader_name
      FROM medical_documents md
      JOIN patients p ON md.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN users uu ON md.uploaded_by = uu.id
      WHERE ${clause}
      ORDER BY md.created_at DESC`;

    const result = await db.query(query, params);

    await auditLog({ userId: req.user.id, action: 'VIEW_MEDICAL_DOCUMENTS', resourceType: 'medical_document', ip: req.ip });

    res.json({ status: 'success', data: result.rows.map(mapDocument) });
  } catch (err) {
    return next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT md.id, md.patient_id, md.uploaded_by, md.category,
              md.title, md.description, md.file_key, md.file_name, md.file_size, md.mime_type, md.created_at,
              pu.first_name || ' ' || pu.last_name AS patient_name,
              uu.first_name || ' ' || uu.last_name AS uploader_name
       FROM medical_documents md
       JOIN patients p ON md.patient_id = p.id
       JOIN users pu ON p.user_id = pu.id
       JOIN users uu ON md.uploaded_by = uu.id
       WHERE md.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Document not found.', 404);
    }

    const doc = result.rows[0];

    const allowed = await canAccessPatientDocuments(req.user, doc.patient_id, doc.uploaded_by);
    if (!allowed) {
      throw new AppError('You do not have access to this patient\'s documents.', 403);
    }

    const url = await getPresignedImageUrl(doc.file_key);

    await auditLog({
      userId: req.user.id,
      action: 'VIEW_MEDICAL_DOCUMENT',
      resourceType: 'medical_document',
      resourceId: id,
      ip: req.ip,
    });

    res.json({
      status: 'success',
      data: {
        ...mapDocument(doc),
        url,
      },
    });
  } catch (err) {
    return next(err);
  }
};

const upload = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) throw new AppError('No file uploaded.', 400);

    const { patientId, title, description, category } = req.body;

    if (!patientId) throw new AppError('patientId is required.', 400);
    if (!title || !title.trim()) throw new AppError('title is required.', 400);
    if (title.length > MAX_TITLE_LENGTH) {
      throw new AppError(`Title must be ${MAX_TITLE_LENGTH} characters or fewer.`, 400);
    }
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      throw new AppError(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`, 400);
    }

    const docCategory = category || 'other';
    if (!VALID_CATEGORIES.includes(docCategory)) {
      throw new AppError(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`, 400);
    }

    // Verify patient exists
    const patientCheck = await db.query(
      `SELECT p.id, u.id AS user_id, u.first_name, u.last_name
       FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
      [patientId]
    );
    if (patientCheck.rows.length === 0) throw new AppError('Patient not found.', 404);

    // Patients can only upload for themselves
    if (req.user.role === 'patient' && patientId !== req.user.patientId) {
      throw new AppError('You can only upload documents for yourself.', 403);
    }

    // Only one file allowed per patient for prescription, lab_report, and medical_record categories
    const ONE_FILE_CATEGORIES = ['prescription', 'lab_report', 'medical_record'];
    if (ONE_FILE_CATEGORIES.includes(docCategory)) {
      const existing = await db.query(
        'SELECT id FROM medical_documents WHERE patient_id = $1 AND category = $2 LIMIT 1',
        [patientId, docCategory]
      );
      if (existing.rows.length > 0) {
        throw new AppError(
          `Only one file is allowed per patient for the ${docCategory.replace('_', ' ')} category. Please delete the existing file before uploading a new one.`,
          409
        );
      }
    }

    const fileKey = await uploadDocumentToS3(file, patientId);

    const result = await db.query(
      `INSERT INTO medical_documents (patient_id, uploaded_by, category, title, description, file_key, file_name, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [patientId, req.user.id, docCategory, title.trim(), description || null, fileKey, file.originalname, file.size, file.mimetype]
    );

    const patient = patientCheck.rows[0];

    // Notify patient if document was uploaded by staff
    if (req.user.id !== patient.user_id) {
      createNotification({
        recipientId: patient.user_id,
        type: 'document_uploaded',
        title: 'New Document',
        message: `A new document "${title.trim()}" has been uploaded to your records.`,
        referenceId: result.rows[0].id,
        referenceType: 'medical_document',
      });
    }

    await auditLog({
      userId: req.user.id,
      action: 'UPLOAD_DOCUMENT',
      resourceType: 'medical_document',
      resourceId: result.rows[0].id,
      ip: req.ip,
      details: { patientId, title: title.trim(), category: docCategory, fileName: file.originalname },
    });

    res.status(201).json({ status: 'success', data: { id: result.rows[0].id } });
  } catch (err) {
    return next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT id, patient_id, uploaded_by, file_key, title FROM medical_documents WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) throw new AppError('Document not found.', 404);

    const doc = result.rows[0];

    // Only admin or uploader can delete
    if (req.user.role !== 'admin' && doc.uploaded_by !== req.user.id) {
      throw new AppError('Only the uploader or an admin can delete this document.', 403);
    }

    await deleteFromS3(doc.file_key);
    await db.query('DELETE FROM medical_documents WHERE id = $1', [id]);

    await auditLog({
      userId: req.user.id,
      action: 'DELETE_DOCUMENT',
      resourceType: 'medical_document',
      resourceId: id,
      ip: req.ip,
      details: { title: doc.title },
    });

    res.json({ status: 'success', data: { id } });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, getById, upload, remove };
