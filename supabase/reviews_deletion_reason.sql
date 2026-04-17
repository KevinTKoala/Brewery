-- Add deletion_reason column to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS deletion_reason TEXT;
