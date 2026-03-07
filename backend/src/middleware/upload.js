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
  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
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

async function deleteFromS3(key) {
  if (!key) return;
  try {
    await s3.send(new DeleteObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
    }));
  } catch {
    // best-effort
  }
}

module.exports = { upload, uploadToS3, deleteFromS3, getPresignedImageUrl };
