-- Migration: Add first_response_at column to tickets table
-- Description: Adds first_response_at timestamp to track when a staff member first responds to a ticket
-- Date: 2025-01-23

-- Add first_response_at column to tickets table
ALTER TABLE tickets
ADD COLUMN first_response_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN tickets.first_response_at IS 'Timestamp when staff first responded to the ticket';

-- Create index for analytics queries
CREATE INDEX idx_tickets_first_response_at ON tickets(first_response_at);

-- Backfill first_response_at for existing tickets based on first staff comment
-- This sets first_response_at to the earliest comment created by a staff/admin user
UPDATE tickets t
SET first_response_at = (
  SELECT MIN(tc.created_at)
  FROM ticket_comments tc
  INNER JOIN users u ON tc.user_id = u.id
  WHERE tc.ticket_id = t.id
    AND u.role IN ('staff', 'admin', 'super_admin')
    AND u.id != t.user_id  -- Exclude ticket creator's own comments
)
WHERE first_response_at IS NULL;
