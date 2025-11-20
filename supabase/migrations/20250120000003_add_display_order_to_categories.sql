-- ============================================================================
-- Migration: Add display_order to categories table
-- Description: Adds display_order column for custom category sorting
-- Date: 2025-11-20
-- ============================================================================

-- Add display_order column
-- Default to 0, will be updated below with sequential values
ALTER TABLE categories
  ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;

-- Create index for efficient ordering queries
CREATE INDEX idx_categories_display_order ON categories(display_order);

-- Initialize display_order for existing categories
-- Set display_order based on current alphabetical order
WITH ordered_categories AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY name ASC) * 10 AS new_order
  FROM categories
)
UPDATE categories c
SET display_order = oc.new_order
FROM ordered_categories oc
WHERE c.id = oc.id;

-- Add comment
COMMENT ON COLUMN categories.display_order IS 'Display order for categories (lower = higher priority). Use multiples of 10 to allow easy re-ordering.';

-- Update the updated_at trigger to include display_order changes
-- (The trigger already exists, this ensures it fires on display_order updates)
