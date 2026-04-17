-- Add Google Maps link column to cafes table
ALTER TABLE cafes ADD COLUMN IF NOT EXISTS google_maps_link TEXT;
