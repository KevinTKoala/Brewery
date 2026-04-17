-- Add helpful_users column to reviews table to track which users marked review as helpful
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful_users TEXT[] DEFAULT '{}';
