-- Migration: Fix user_preferences font_size constraint
-- Description: Update font_size values from medium/x-large to normal/extra-large
-- Date: 2025-01-30

-- First, update any existing data to use the new values
UPDATE user_preferences
SET font_size = 'normal'
WHERE font_size = 'medium';

UPDATE user_preferences
SET font_size = 'extra-large'
WHERE font_size = 'x-large';

-- Drop the old constraint
ALTER TABLE user_preferences
DROP CONSTRAINT IF EXISTS user_preferences_font_size_check;

-- Add the corrected constraint
ALTER TABLE user_preferences
ADD CONSTRAINT user_preferences_font_size_check
CHECK (font_size IN ('small', 'normal', 'large', 'extra-large'));

-- Comment for documentation
COMMENT ON CONSTRAINT user_preferences_font_size_check ON user_preferences IS 
  'Font size must be one of: small, normal, large, or extra-large';

