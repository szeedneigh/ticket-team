-- Migration: Fix ticket_feedback RLS policy for submitter access
-- Description: Allow users to read their own feedback to fix duplicate prompt bug
-- Date: 2025-02-05

-- ============================================================================
-- TICKET_FEEDBACK TABLE - Fix SELECT policy
-- ============================================================================

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Only super admin can read feedback" ON ticket_feedback;

-- Create new policy that allows:
-- 1. Users to read their own feedback (for checking if they already submitted)
-- 2. Super admins to read all feedback (for analytics)
CREATE POLICY "Users can read own feedback, super admin all"
  ON ticket_feedback FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR get_user_role(auth.uid()) = 'super_admin'
  );

-- Add comment for documentation
COMMENT ON POLICY "Users can read own feedback, super admin all" ON ticket_feedback IS
  'Allows users to read their own feedback entries (for duplicate check in UI) and super admins to read all feedback (for analytics)';
