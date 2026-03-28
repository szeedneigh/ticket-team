-- Ensure authenticated clients can run semantic search RPC (PostgREST / supabase-js with user JWT).

DO $$
DECLARE
  fn text;
BEGIN
  SELECT p.oid::regprocedure::text INTO fn
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'match_kb_articles'
  LIMIT 1;

  IF fn IS NOT NULL THEN
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn);
  END IF;
END $$;
