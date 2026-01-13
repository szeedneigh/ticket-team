-- Migration: Add chat history archiving support
-- Description: Adds archived_at column to ai_interactions table for soft delete functionality
-- Date: 2026-01-11

-- Add archived_at column to ai_interactions table
ALTER TABLE ai_interactions 
  ADD COLUMN archived_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for efficient filtering of non-archived interactions
CREATE INDEX idx_ai_interactions_archived 
  ON ai_interactions(user_id, archived_at)
  WHERE archived_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN ai_interactions.archived_at IS 
  'Timestamp when interaction was archived. NULL = active, NOT NULL = archived';
