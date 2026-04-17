-- Add deletion_reason column to discussions table
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS deletion_reason TEXT;
