-- Fix: RLS on ticket_number_sequences used only a RESTRICTIVE policy.
-- In PostgreSQL, restrictive policies cannot grant access; at least one permissive
-- policy must allow the operation. With no permissive policies, all DML failed
-- (including trigger-driven INSERT/UPDATE from generate_ticket_number()).
-- Recreate the same rule as a permissive policy for role authenticated.

DROP POLICY IF EXISTS ticket_number_sequences_internal_only
  ON public.ticket_number_sequences;

CREATE POLICY ticket_number_sequences_internal_only
  ON public.ticket_number_sequences
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
