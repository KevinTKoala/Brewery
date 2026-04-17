-- Create deletion_log table to track deleted items
CREATE TABLE IF NOT EXISTS deletion_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('review', 'discussion')),
  deletion_reason TEXT NOT NULL,
  deleted_by UUID NOT NULL REFERENCES auth.users(id),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  original_title TEXT,
  original_content TEXT,
  author_id UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE deletion_log ENABLE ROW LEVEL SECURITY;

-- Allow admins and moderators to view deletion logs
CREATE POLICY "Admins and moderators can view deletion logs"
ON deletion_log
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin' OR role = 'moderator'
  )
);

-- Allow admins and moderators to insert deletion logs
CREATE POLICY "Admins and moderators can insert deletion logs"
ON deletion_log
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin' OR role = 'moderator'
  )
);
