const crypto = require('crypto');

/**
 * Generate a cryptographically secure random token
 * @param {number} length - Length of the token in bytes (default: 32, which produces 64 hex characters)
 * @returns {string} - Hex-encoded token string
 */
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a hashed version of a token for secure storage
 * @param {string} token - The plain token to hash
 * @returns {string} - SHA-256 hash of the token
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verify that a plain token matches a hashed token
 * @param {string} plainToken - The plain token to verify
 * @param {string} hashedToken - The stored hashed token
 * @returns {boolean} - True if tokens match
 */
function verifyToken(plainToken, hashedToken) {
  const plainHashed = hashToken(plainToken);
  return crypto.timingSafeEqual(
    Buffer.from(plainHashed, 'hex'),
    Buffer.from(hashedToken, 'hex')
  );
}

/**
 * Check if a token has expired
 * @param {Date|string} expiresAt - Expiration timestamp
 * @returns {boolean} - True if token has expired
 */
function isTokenExpired(expiresAt) {
  return new Date(expiresAt) < new Date();
}

module.exports = {
  generateToken,
  hashToken,
  verifyToken,
  isTokenExpired,
};
