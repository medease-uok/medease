const { fileTypeFromBuffer } = require('file-type');
const AppError = require('../utils/AppError');
const { scanFileWithVirusTotal, isVirusTotalEnabled } = require('./virusTotalScan');

// File type definitions with magic bytes
const ALLOWED_FILE_TYPES = {
  'application/pdf': { ext: 'pdf', maxSize: 25 * 1024 * 1024 }, // 25 MB
  'image/jpeg': { ext: 'jpg', maxSize: 10 * 1024 * 1024 }, // 10 MB
  'image/png': { ext: 'png', maxSize: 10 * 1024 * 1024 }, // 10 MB
  'image/webp': { ext: 'webp', maxSize: 10 * 1024 * 1024 }, // 10 MB
  'application/msword': { ext: 'doc', maxSize: 20 * 1024 * 1024 }, // 20 MB
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    ext: 'docx',
    maxSize: 20 * 1024 * 1024,
  }, // 20 MB
};

// Malware scanning now uses VirusTotal (cloud-based, works on all platforms)

/**
 * Validate file type using magic bytes (not just MIME type)
 * Defense in depth - prevents bypassing via file extension rename
 */
async function validateFileType(buffer, allowedMimeTypes) {
  const detectedType = await fileTypeFromBuffer(buffer);

  if (!detectedType) {
    throw new AppError('Could not determine file type. File may be corrupted.', 400);
  }

  if (!allowedMimeTypes.includes(detectedType.mime)) {
    throw new AppError(
      `Invalid file type detected: ${detectedType.mime}. File content does not match allowed types.`,
      400
    );
  }

  return detectedType;
}

/**
 * Validate file size against type-specific limits
 */
function validateFileSize(size, mimeType) {
  const typeConfig = ALLOWED_FILE_TYPES[mimeType];

  if (!typeConfig) {
    throw new AppError('Unsupported file type.', 400);
  }

  if (size > typeConfig.maxSize) {
    const maxMB = (typeConfig.maxSize / 1024 / 1024).toFixed(0);
    throw new AppError(`File size exceeds ${maxMB} MB limit for ${mimeType}.`, 400);
  }

  return true;
}

/**
 * Scan file for malware using VirusTotal
 * Cloud-based scanning that works on all platforms
 */
async function scanForMalware(buffer, filename) {
  if (!isVirusTotalEnabled()) {
    console.log('Malware scanning skipped (VirusTotal API key not configured)');
    return { isInfected: false, scanned: false };
  }

  try {
    const result = await scanFileWithVirusTotal(buffer, filename);

    if (!result.scanned) {
      console.warn(`VirusTotal scan skipped for "${filename}": ${result.reason}`);
      return { isInfected: false, scanned: false, reason: result.reason };
    }

    return {
      isInfected: !result.clean,
      scanned: true,
      malicious: result.malicious,
      suspicious: result.suspicious,
      totalEngines: result.totalEngines,
      sha256: result.sha256,
    };
  } catch (err) {
    if (err instanceof AppError) {
      throw err; // Re-throw malware detection errors
    }

    // Log scan errors but don't fail the upload if scanner has issues
    console.error('VirusTotal scan error:', err.message);
    console.warn('Proceeding without malware scan due to scanner error');
    return { isInfected: false, scanned: false, error: err.message };
  }
}

/**
 * Comprehensive file validation middleware
 * Use this AFTER multer has parsed the file
 */
async function validateUploadedFile(req, res, next) {
  try {
    if (!req.file) {
      return next(); // No file to validate
    }

    const { buffer, originalname, size, mimetype } = req.file;

    // Step 1: Validate declared MIME type is allowed
    const allowedTypes = Object.keys(ALLOWED_FILE_TYPES);
    if (!allowedTypes.includes(mimetype)) {
      throw new AppError(
        'Unsupported file type declared. Allowed: PDF, JPEG, PNG, WebP, DOC, DOCX.',
        400
      );
    }

    // Step 2: Validate file size
    validateFileSize(size, mimetype);

    // Step 3: Validate actual file type using magic bytes
    const detectedType = await validateFileType(buffer, allowedTypes);

    // Check if detected type matches declared type (strict validation for security)
    if (detectedType.mime !== mimetype) {
      throw new AppError(
        `File content does not match declared type. Declared: ${mimetype}, Detected: ${detectedType.mime}. ` +
          `This may indicate file spoofing or corruption.`,
        400
      );
    }

    // Step 4: Scan for malware
    await scanForMalware(buffer, originalname);

    // All validations passed
    console.log(`File validated successfully: ${originalname} (${detectedType.mime}, ${size} bytes)`);
    next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Check if malware scanning is available
 */
function isMalwareScanningEnabled() {
  return isVirusTotalEnabled();
}

module.exports = {
  validateUploadedFile,
  validateFileType,
  validateFileSize,
  scanForMalware,
  isMalwareScanningEnabled,
  ALLOWED_FILE_TYPES,
};
