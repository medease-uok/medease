const axios = require('axios');
const FormData = require('form-data');
const crypto = require('crypto');
const AppError = require('../utils/AppError');

// VirusTotal API configuration
const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY;
const VIRUSTOTAL_ENABLED = !!VIRUSTOTAL_API_KEY;
const VIRUSTOTAL_API_URL = 'https://www.virustotal.com/api/v3';

// Scanning thresholds
const MAX_FILE_SIZE_FOR_SCAN = 32 * 1024 * 1024; // 32 MB (VirusTotal limit)
const MALICIOUS_THRESHOLD = 2; // Number of engines that must flag as malicious

/**
 * Check if VirusTotal scanning is enabled
 */
function isVirusTotalEnabled() {
  return VIRUSTOTAL_ENABLED;
}

/**
 * Calculate SHA256 hash of file buffer
 */
function calculateSHA256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Check if file hash is already known to VirusTotal
 * This is faster than uploading the file
 */
async function checkFileHash(sha256) {
  try {
    const response = await axios.get(`${VIRUSTOTAL_API_URL}/files/${sha256}`, {
      headers: {
        'x-apikey': VIRUSTOTAL_API_KEY,
      },
      timeout: 10000,
    });

    const stats = response.data.data.attributes.last_analysis_stats;
    return {
      found: true,
      malicious: stats.malicious || 0,
      suspicious: stats.suspicious || 0,
      harmless: stats.harmless || 0,
      undetected: stats.undetected || 0,
      totalEngines: Object.values(stats).reduce((a, b) => a + b, 0),
    };
  } catch (err) {
    if (err.response?.status === 404) {
      // File not found in VirusTotal database
      return { found: false };
    }
    // Other errors (rate limit, network, etc.)
    throw err;
  }
}

/**
 * Upload file to VirusTotal for scanning
 */
async function uploadFileForScan(buffer, filename) {
  const form = new FormData();
  form.append('file', buffer, { filename });

  try {
    const response = await axios.post(`${VIRUSTOTAL_API_URL}/files`, form, {
      headers: {
        'x-apikey': VIRUSTOTAL_API_KEY,
        ...form.getHeaders(),
      },
      maxBodyLength: Infinity,
      timeout: 60000, // 60 seconds for upload
    });

    const analysisId = response.data.data.id;
    return analysisId;
  } catch (err) {
    console.error('VirusTotal upload error:', err.message);
    throw err;
  }
}

/**
 * Get analysis results from VirusTotal
 */
async function getAnalysisResults(analysisId, maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(`${VIRUSTOTAL_API_URL}/analyses/${analysisId}`, {
        headers: {
          'x-apikey': VIRUSTOTAL_API_KEY,
        },
        timeout: 10000,
      });

      const status = response.data.data.attributes.status;

      if (status === 'completed') {
        const stats = response.data.data.attributes.stats;
        return {
          malicious: stats.malicious || 0,
          suspicious: stats.suspicious || 0,
          harmless: stats.harmless || 0,
          undetected: stats.undetected || 0,
          totalEngines: Object.values(stats).reduce((a, b) => a + b, 0),
        };
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 2000 * (i + 1)));
    } catch (err) {
      console.error(`VirusTotal analysis check attempt ${i + 1} failed:`, err.message);
      if (i === maxRetries - 1) throw err;
    }
  }

  throw new Error('VirusTotal analysis timed out');
}

/**
 * Scan file for malware using VirusTotal
 * Returns scan results or throws if malware detected
 */
async function scanFileWithVirusTotal(buffer, filename) {
  if (!VIRUSTOTAL_ENABLED) {
    console.log('VirusTotal scanning disabled (no API key configured)');
    return { scanned: false, reason: 'API key not configured' };
  }

  if (buffer.length > MAX_FILE_SIZE_FOR_SCAN) {
    console.warn(`File too large for VirusTotal scan: ${buffer.length} bytes (max ${MAX_FILE_SIZE_FOR_SCAN})`);
    return { scanned: false, reason: 'File exceeds VirusTotal size limit (32 MB)' };
  }

  try {
    // Step 1: Calculate file hash
    const sha256 = calculateSHA256(buffer);
    console.log(`Scanning file: ${filename} (SHA256: ${sha256})`);

    // Step 2: Check if hash is already known (faster)
    let results;
    try {
      results = await checkFileHash(sha256);

      if (results.found) {
        console.log(`File found in VirusTotal database: ${filename}`);
        console.log(
          `Scan results: ${results.malicious} malicious, ${results.suspicious} suspicious, ${results.harmless} clean (${results.totalEngines} engines)`
        );
      }
    } catch (hashErr) {
      console.warn('Hash check failed, will upload file:', hashErr.message);
      results = { found: false };
    }

    // Step 3: If not found, upload for scanning
    if (!results.found) {
      console.log(`Uploading file to VirusTotal for scanning: ${filename}`);
      const analysisId = await uploadFileForScan(buffer, filename);
      console.log(`File uploaded, analysis ID: ${analysisId}`);

      // Wait for analysis to complete
      results = await getAnalysisResults(analysisId);
      console.log(
        `Analysis complete: ${results.malicious} malicious, ${results.suspicious} suspicious, ${results.harmless} clean (${results.totalEngines} engines)`
      );
    }

    // Step 4: Check if file is malicious
    const totalThreats = results.malicious + results.suspicious;

    if (results.malicious >= MALICIOUS_THRESHOLD) {
      const message = `File rejected: ${results.malicious} antivirus engines detected malware`;
      console.error(`MALWARE DETECTED: ${filename} - ${message}`);
      throw new AppError(message, 400);
    }

    if (totalThreats > 0) {
      console.warn(
        `File flagged by ${totalThreats} engines but below threshold: ${filename} (threshold: ${MALICIOUS_THRESHOLD})`
      );
    }

    return {
      scanned: true,
      clean: totalThreats === 0,
      malicious: results.malicious,
      suspicious: results.suspicious,
      harmless: results.harmless,
      totalEngines: results.totalEngines,
      sha256,
    };
  } catch (err) {
    if (err instanceof AppError) {
      throw err; // Re-throw malware detection errors
    }

    // Handle API errors gracefully
    if (err.response?.status === 429) {
      console.error('VirusTotal rate limit exceeded');
      return { scanned: false, reason: 'Rate limit exceeded', error: err.message };
    }

    if (err.response?.status === 401) {
      console.error('VirusTotal API key invalid');
      return { scanned: false, reason: 'Invalid API key', error: err.message };
    }

    // Other errors - log but don't fail the upload
    console.error('VirusTotal scan error:', err.message);
    return { scanned: false, reason: 'Scan failed', error: err.message };
  }
}

/**
 * Express middleware for VirusTotal scanning
 * Use after multer has parsed the file
 */
async function virusTotalMiddleware(req, res, next) {
  try {
    if (!req.file) {
      return next(); // No file to scan
    }

    const { buffer, originalname } = req.file;

    const result = await scanFileWithVirusTotal(buffer, originalname);

    // Attach scan result to request for logging
    req.virusTotalScan = result;

    // If scanned and clean, or if scanning was skipped, proceed
    next();
  } catch (err) {
    // Malware detected or critical error
    return next(err);
  }
}

module.exports = {
  virusTotalMiddleware,
  scanFileWithVirusTotal,
  isVirusTotalEnabled,
  MALICIOUS_THRESHOLD,
};
