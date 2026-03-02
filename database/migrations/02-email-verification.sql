-- Email Verification Migration
-- Add email verification fields to users table

-- Add email verification columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;

-- Create index for verification token lookups
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);

-- Comment on columns
COMMENT ON COLUMN users.email_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN users.email_verification_token IS 'Token sent to user email for verification';
COMMENT ON COLUMN users.email_verification_expires IS 'Expiration timestamp for email verification token';
COMMENT ON COLUMN users.password_reset_token IS 'Token sent to user email for password reset';
COMMENT ON COLUMN users.password_reset_expires IS 'Expiration timestamp for password reset token';
