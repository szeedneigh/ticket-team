-- Migration: Add trigger to automatically set first_response_at
-- Description: Creates a trigger that sets first_response_at when staff first comments on a ticket
-- Date: 2025-01-23

-- Function to set first_response_at when staff comments
CREATE OR REPLACE FUNCTION public.set_first_response_at()
RETURNS TRIGGER AS $$
DECLARE
  commenter_role user_role;
  ticket_creator_id uuid;
BEGIN
  -- Get the role of the commenter
  SELECT role INTO commenter_role
  FROM users
  WHERE id = NEW.user_id;

  -- Get the ticket creator
  SELECT user_id INTO ticket_creator_id
  FROM tickets
  WHERE id = NEW.ticket_id;

  -- Only set first_response_at if:
  -- 1. The commenter is staff, admin, or super_admin
  -- 2. The commenter is not the ticket creator
  -- 3. first_response_at is not already set
  IF commenter_role IN ('staff', 'admin', 'super_admin')
     AND NEW.user_id != ticket_creator_id THEN

    UPDATE tickets
    SET first_response_at = NEW.created_at
    WHERE id = NEW.ticket_id
      AND first_response_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on ticket_comments
CREATE TRIGGER set_ticket_first_response
  AFTER INSERT ON ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION set_first_response_at();

-- Add comment for documentation
COMMENT ON FUNCTION public.set_first_response_at() IS 'Automatically sets first_response_at when staff first comments on a ticket';
