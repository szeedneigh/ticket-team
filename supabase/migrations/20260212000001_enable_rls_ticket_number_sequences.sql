-- Migration: Enable RLS on ticket_number_sequences
-- Description: Secures ticket_number_sequences so only privileged contexts can read/write it.
-- Date: 2026-02-12

-- Enable Row Level Security on the sequence table
ALTER TABLE public.ticket_number_sequences
  ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts (idempotent for re-runs)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ticket_number_sequences'
  ) THEN
    DELETE FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ticket_number_sequences';
  END IF;
END;
$$;

-- Policy: Only allow access through authenticated contexts that already have full ticket access.
-- In practice, this table should only be touched by the generate_ticket_number() function,
-- which runs in the database and is not exposed directly via PostgREST.
CREATE POLICY ticket_number_sequences_internal_only
ON public.ticket_number_sequences
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

