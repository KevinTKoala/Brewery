-- Allow moderators to delete reviews
-- First drop the policy if it exists
DROP POLICY IF EXISTS "Moderators can delete reviews" ON reviews;

-- Create the policy
CREATE POLICY "Moderators can delete reviews"
ON reviews
FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin' OR role = 'moderator'
  )
);
