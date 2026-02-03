-- Migration: Restrict ticket comments visibility to creator and assigned staff only
-- Description: Replace broad staff access with creator + assigned_to only
-- Date: 2026-02-02

-- ============================================================================
-- TICKET_COMMENTS: Drop existing policies and create restricted policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read comments on accessible tickets" ON ticket_comments;
DROP POLICY IF EXISTS "Users can create comments on accessible tickets" ON ticket_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON ticket_comments;

-- SELECT: Only creator or assigned staff can read comments
-- Creator sees non-internal comments; assigned staff sees all (including internal notes)
CREATE POLICY "Creator and assigned staff can read comments"
  ON ticket_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_comments.ticket_id
      AND (
        (t.user_id = auth.uid() AND NOT ticket_comments.is_internal)
        OR t.assigned_to = auth.uid()
      )
    )
  );

-- INSERT: Only creator or assigned staff can create comments
CREATE POLICY "Creator and assigned staff can create comments"
  ON ticket_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_comments.ticket_id
      AND (
        tickets.user_id = auth.uid()
        OR tickets.assigned_to = auth.uid()
      )
    )
  );

-- UPDATE: Only comment author or assigned staff can update comments
CREATE POLICY "Creator and assigned staff can update comments"
  ON ticket_comments FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_comments.ticket_id
      AND tickets.assigned_to = auth.uid()
    )
  );
