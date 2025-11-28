-- Migration: Create user_preferences table
-- Description: User customization settings for theme, localization, and dashboard defaults
-- Date: 2025-01-24

-- CREATE USER_PREFERENCES TABLE
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Appearance
  theme TEXT NOT NULL DEFAULT 'system',
  accent_color TEXT DEFAULT '#0EA5E9',

  -- Localization
  language TEXT NOT NULL DEFAULT 'en',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  date_format TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
  time_format TEXT NOT NULL DEFAULT '12h',

  -- Dashboard Defaults
  default_ticket_filter TEXT DEFAULT 'all',
  items_per_page INTEGER NOT NULL DEFAULT 20,
  default_sort_order TEXT NOT NULL DEFAULT 'newest',
  sidebar_collapsed BOOLEAN NOT NULL DEFAULT FALSE,

  -- Accessibility
  reduced_motion BOOLEAN NOT NULL DEFAULT FALSE,
  high_contrast BOOLEAN NOT NULL DEFAULT FALSE,
  font_size TEXT NOT NULL DEFAULT 'normal',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_theme CHECK (theme IN ('light', 'dark', 'system')),
  CONSTRAINT valid_time_format CHECK (time_format IN ('12h', '24h')),
  CONSTRAINT valid_items_per_page CHECK (items_per_page IN (10, 20, 50, 100)),
  CONSTRAINT valid_default_sort CHECK (default_sort_order IN ('newest', 'oldest', 'priority', 'status')),
  CONSTRAINT valid_font_size CHECK (font_size IN ('small', 'normal', 'large', 'extra-large'))
);

-- Create index for faster lookups
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only read/update their own preferences
CREATE POLICY "Users can view their own preferences"
  ON user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment for documentation
COMMENT ON TABLE user_preferences IS 'User customization settings for theme, localization, and dashboard preferences';
