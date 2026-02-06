-- Migration: Allow all staff to see ticket comments in activity timeline
-- Description: Updates RLS policy to allow staff/admin/super_admin to see all comments,
--              not just assigned staff. Creator still only sees non-internal comments.
-- Date: 2026-02-06

-- ============================================================================
-- TICKET_COMMENTS: Update SELECT policy to allow all staff to read comments
-- ============================================================================

-- Drop the existing restricted policy
DROP POLICY IF EXISTS "Creator and assigned staff can read comments" ON ticket_comments;

-- SELECT: Creator sees non-internal comments; any staff/admin/super_admin sees all comments
CREATE POLICY "Creator and all staff can read comments"
  ON ticket_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_comments.ticket_id
      AND (
        -- Creator can read non-internal comments
        (t.user_id = auth.uid() AND NOT ticket_comments.is_internal)
        -- Any staff/admin/super_admin can read all comments (including internal)
        OR EXISTS (
          SELECT 1 FROM users u
          WHERE u.id = auth.uid()
          AND u.role IN ('staff', 'admin', 'super_admin')
        )
      )
    )
  );
