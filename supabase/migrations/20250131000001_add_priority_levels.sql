-- Migration: Add urgent and critical priority levels
-- Description: Expands ticket_priority enum to include 'urgent' and 'critical' levels
-- Date: 2025-01-31

-- Add new priority values to enum
-- Note: PostgreSQL doesn't support removing enum values, so this is a one-way expansion
ALTER TYPE ticket_priority ADD VALUE IF NOT EXISTS 'urgent';
ALTER TYPE ticket_priority ADD VALUE IF NOT EXISTS 'critical';

-- Optional: Update existing high-priority tickets to urgent if they're older than 24 hours
-- This is optional and can be commented out if you want to keep existing priorities as-is
-- UPDATE tickets 
-- SET priority = 'urgent' 
-- WHERE priority = 'high' 
--   AND created_at < NOW() - INTERVAL '24 hours'
--   AND status NOT IN ('resolved', 'closed', 'canceled');

-- Add comment to document the priority levels
COMMENT ON TYPE ticket_priority IS 'Ticket priority levels: low (minor issues), medium (standard), high (critical business impact), urgent (immediate attention required), critical (system-wide impact requiring immediate resolution)';
