const { fileTypeFromBuffer } = require('file-type');
const NodeClam = require('clamscan');
const AppError = require('../utils/AppError');

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

// Initialize ClamAV scanner (singleton)
let clamScanInstance = null;
let clamScanEnabled = false;

async function initClamScan() {
  if (clamScanInstance) return clamScanInstance;

  try {
    const clamscan = await new NodeClam().init({
      removeInfected: false,
      quarantineInfected: false,
      scanLog: null,
      debugMode: false,
      clamdscan: {
        host: process.env.CLAMAV_HOST || 'localhost',
        port: process.env.CLAMAV_PORT || 3310,
        timeout: 60000,
        localFallback: false,
      },
    });

    clamScanInstance = clamscan;
    clamScanEnabled = true;
    console.log('ClamAV malware scanner initialized successfully');
    return clamscan;
  } catch (err) {
    console.warn('ClamAV not available, malware scanning disabled:', err.message);
    clamScanEnabled = false;
    return null;
  }
}

// Initialize on module load
initClamScan().catch((err) => console.warn('Failed to initialize ClamAV:', err.message));

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
 * Scan file for malware using ClamAV
 * Only scans if ClamAV is available
 */
async function scanForMalware(buffer, filename) {
  // Skip if ClamAV not enabled
  if (!clamScanEnabled || !clamScanInstance) {
    console.log('Malware scanning skipped (ClamAV not available)');
    return { isInfected: false, viruses: [] };
  }

  try {
    const { isInfected, viruses } = await clamScanInstance.scanStream(buffer);

    if (isInfected) {
      console.error(`Malware detected in file "${filename}":`, viruses);
      throw new AppError('File rejected: malware detected.', 400);
    }

    console.log(`File "${filename}" scanned: clean`);
    return { isInfected, viruses };
  } catch (err) {
    if (err instanceof AppError) {
      throw err; // Re-throw malware detection errors
    }

    // Log scan errors but don't fail the upload if scanner has issues
    console.error('Malware scan error:', err.message);
    console.warn('Proceeding without malware scan due to scanner error');
    return { isInfected: false, viruses: [], error: err.message };
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

    // Check if detected type matches declared type
    if (detectedType.mime !== mimetype) {
      console.warn(
        `MIME type mismatch: declared=${mimetype}, detected=${detectedType.mime}, file=${originalname}`
      );
      // For safety, use the detected type
      req.file.mimetype = detectedType.mime;
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
  return clamScanEnabled;
}

module.exports = {
  validateUploadedFile,
  validateFileType,
  validateFileSize,
  scanForMalware,
  isMalwareScanningEnabled,
  ALLOWED_FILE_TYPES,
};
