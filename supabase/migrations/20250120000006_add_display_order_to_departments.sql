-- ============================================================================
-- Migration: Add display_order to departments table
-- Description: Adds display_order column for custom department sorting
-- Date: 2025-11-21
-- ============================================================================

-- Add display_order column
-- Default to 0, will be updated below with sequential values
ALTER TABLE departments
  ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;

-- Create index for efficient ordering queries
CREATE INDEX idx_departments_display_order ON departments(display_order);

-- Initialize display_order for existing departments
-- Set display_order based on current alphabetical order
WITH ordered_departments AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY name ASC) * 10 AS new_order
  FROM departments
)
UPDATE departments d
SET display_order = od.new_order
FROM ordered_departments od
WHERE d.id = od.id;

-- Add comment
COMMENT ON COLUMN departments.display_order IS 'Display order for departments (lower = higher priority). Use multiples of 10 to allow easy re-ordering.';

-- Update the updated_at trigger to include display_order changes
-- (The trigger already exists, this ensures it fires on display_order updates)
