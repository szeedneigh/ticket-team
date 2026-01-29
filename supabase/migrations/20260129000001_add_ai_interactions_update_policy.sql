-- Migration: Add RLS UPDATE policy for ai_interactions
-- Description: Allows users to update their own AI interactions (archiving, feedback, metadata)
-- Root cause: Archived chats were not showing because RLS blocked UPDATE - no policy existed
-- Date: 2026-01-29

-- Add UPDATE policy: Users can update their own interactions
-- Required for: archiving (archived_at), feedback (was_helpful), session title (metadata)
CREATE POLICY "Users can update own AI interactions"
  ON ai_interactions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
