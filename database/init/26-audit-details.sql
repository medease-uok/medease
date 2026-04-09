-- Migration: Add details JSONB column to audit_logs
-- This script is part of the initial database setup and is environment-independent.

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details JSONB;
