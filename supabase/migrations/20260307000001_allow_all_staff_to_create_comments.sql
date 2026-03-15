-- Allow all staff (staff, admin, super_admin) to create comments on any ticket.
-- Previously only creator or assigned staff could insert.

DROP POLICY IF EXISTS "Creator and assigned staff can create comments" ON ticket_comments;

CREATE POLICY "Creator and all staff can create comments"
  ON ticket_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM tickets
        WHERE tickets.id = ticket_comments.ticket_id
        AND (
          tickets.user_id = auth.uid()
          OR tickets.assigned_to = auth.uid()
        )
      )
      OR EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role IN ('staff', 'admin', 'super_admin')
      )
    )
  );
