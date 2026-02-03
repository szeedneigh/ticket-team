-- Migration: Add tables to supabase_realtime publication
-- Description: Enables postgres_changes for real-time updates on notifications,
--   tickets, ticket_comments, and ticket_activities
-- Date: 2026-02-02

-- Add tables to supabase_realtime publication for postgres_changes
-- Use DO block to handle case where table is already in publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL; -- Table already in publication
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE ticket_comments;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE ticket_activities;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
