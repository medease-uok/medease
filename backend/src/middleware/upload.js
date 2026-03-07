const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');
const AppError = require('../utils/AppError');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

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

/**
 * Upload a buffer to S3 and return the public URL.
 * Key format: profile-images/<patientId>/<randomHash>.<ext>
 */
async function uploadToS3(file, patientId) {
  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  const hash = crypto.randomBytes(16).toString('hex');
  const key = `profile-images/${patientId}/${hash}${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));

  return `https://${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com/${key}`;
}

/**
 * Delete an object from S3 by its full URL.
 */
async function deleteFromS3(url) {
  if (!url) return;
  try {
    const urlObj = new URL(url);
    const key = urlObj.pathname.slice(1); // remove leading /
    await s3.send(new DeleteObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
    }));
  } catch {
    // Ignore delete errors — old image cleanup is best-effort
  }
}

module.exports = { upload, uploadToS3, deleteFromS3 };
