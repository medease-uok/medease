-- ============================================================
-- Migration: Add email verification columns to users table
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified          BOOLEAN      DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token      VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP;

-- Index for fast token lookup during verification
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
