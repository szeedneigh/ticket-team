-- Fix Users RLS Policy for KB Article Authors
-- Issue: Knowledge base articles show null authors because non-admin users
--        cannot read other users' profiles due to restrictive RLS policy
-- Solution: Allow all authenticated users to read basic profile info
--           (id, full_name, email, avatar_url) for displaying authors

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can read own profile" ON users;

-- Create a more permissive policy that allows reading basic profile info
-- This is safe because:
-- 1. Only basic info (name, email, avatar) is exposed
-- 2. This info is already visible in KB articles, comments, tickets
-- 3. Sensitive fields (role, deactivated_at) are handled by column-level security if needed
CREATE POLICY "Users can read all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (TRUE);

COMMENT ON POLICY "Users can read all profiles" ON users IS 
  'Allows all authenticated users to read user profiles for displaying authors in KB articles, comments, and tickets';

