const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');
const AppError = require('../utils/AppError');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const PRESIGNED_URL_EXPIRY = 3600;

const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];
const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20 MB

const S3_REQUIRED = ['bucket', 'region', 'accessKeyId', 'secretAccessKey'];
const missingS3 = S3_REQUIRED.filter((k) => !config.s3[k]);
if (missingS3.length > 0 && process.env.NODE_ENV !== 'test') {
  console.warn(`Warning: Missing S3 config (${missingS3.join(', ')}). Profile image uploads will fail.`);
}

const s3 = new S3Client({
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
});

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Only JPEG, PNG, and WebP images are allowed.', 400));
    }
  },
});

async function uploadToS3(file, patientId) {
  // Sanitize file extension
  let ext = path.extname(file.originalname).toLowerCase();
  ext = ext.replace(/[^a-z0-9.]/g, '') || '.jpg';
  if (!ext.startsWith('.') || ext.length > 10) {
    ext = '.jpg';
  }

  const hash = crypto.randomBytes(16).toString('hex');
  const key = `profile-images/${patientId}/${hash}${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));

  return key;
}

async function getPresignedImageUrl(key) {
  if (!key) return null;
  const command = new GetObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn: PRESIGNED_URL_EXPIRY });
}

async function getS3Object(key) {
  if (!key) return null;
  const command = new GetObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
  });
  const response = await s3.send(command);
  return response;
}

async function deleteFromS3(key) {
  if (!key) return;
  try {
    await s3.send(new DeleteObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
    }));
  } catch (err) {
    // Don't include key in error message to prevent log injection
    console.warn('Failed to delete S3 object:', err.message);
  }
}

const documentUpload = multer({
  storage,
  limits: { fileSize: MAX_DOCUMENT_SIZE },
  fileFilter: (_req, file, cb) => {
    if (DOCUMENT_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Unsupported file type. Allowed: PDF, JPEG, PNG, WebP, DOC, DOCX, TXT.', 400));
    }
  },
});

async function uploadDocumentToS3(file, patientId) {
  // Sanitize file extension
  let ext = path.extname(file.originalname).toLowerCase();
  ext = ext.replace(/[^a-z0-9.]/g, '') || '.pdf';
  if (!ext.startsWith('.') || ext.length > 10) {
    ext = '.pdf';
  }

  const hash = crypto.randomBytes(16).toString('hex');
  const key = `medical-documents/${patientId}/${hash}${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));

  return key;
}

const PRESCRIPTION_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_PRESCRIPTION_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

const prescriptionImageUpload = multer({
  storage,
  limits: { fileSize: MAX_PRESCRIPTION_IMAGE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (PRESCRIPTION_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Only JPEG, PNG, WebP, and PDF files are allowed for prescription images.', 400));
    }
  },
});

async function uploadPrescriptionImageToS3(file, patientId) {
  // Sanitize file extension
  let ext = path.extname(file.originalname).toLowerCase();
  ext = ext.replace(/[^a-z0-9.]/g, '') || '.jpg';
  if (!ext.startsWith('.') || ext.length > 10) {
    ext = '.jpg';
  }

  const hash = crypto.randomBytes(16).toString('hex');
  const key = `prescription-images/${patientId}/${hash}${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));

  return key;
}

// Lab Report File Upload
const LAB_REPORT_FILE_TYPES = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_LAB_REPORT_SIZE = 25 * 1024 * 1024; // 25 MB

const labReportUpload = multer({
  storage,
  limits: { fileSize: MAX_LAB_REPORT_SIZE },
  fileFilter: (_req, file, cb) => {
    if (LAB_REPORT_FILE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Unsupported file type. Allowed: PDF, JPEG, PNG, WebP, DOC, DOCX.', 400));
    }
  },
});

async function uploadLabReportToS3(file, patientId) {
  // Validate patientId to prevent path traversal in S3 key
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(patientId)) {
    throw new Error('Invalid patientId format for S3 upload');
  }

  // Sanitize file extension to prevent log injection
  let ext = path.extname(file.originalname).toLowerCase();
  // Only allow alphanumeric and dot, default to .pdf
  ext = ext.replace(/[^a-z0-9.]/g, '') || '.pdf';
  // Ensure it starts with a dot and is reasonable length
  if (!ext.startsWith('.') || ext.length > 10) {
    ext = '.pdf';
  }

  const hash = crypto.randomBytes(16).toString('hex');
  const key = `lab-reports/${patientId}/${hash}${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));

  return key;
}

module.exports = { upload, uploadToS3, deleteFromS3, getPresignedImageUrl, getS3Object, documentUpload, uploadDocumentToS3, prescriptionImageUpload, uploadPrescriptionImageToS3, labReportUpload, uploadLabReportToS3 };
