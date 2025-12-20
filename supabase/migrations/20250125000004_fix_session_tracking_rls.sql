-- Fix Session Tracking RLS Policy
-- Issue: New users cannot track sessions during OAuth callback due to RLS restrictions
-- Solution: Create a SECURITY DEFINER function to handle session tracking

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "System can insert sessions" ON user_sessions_log;

-- Create a more permissive policy that allows authenticated users to insert their own sessions
-- This is safe because the user_id is validated in the WITH CHECK clause
CREATE POLICY "Users can insert own sessions"
  ON user_sessions_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create a SECURITY DEFINER function to track sessions (bypasses RLS)
-- This ensures session tracking always succeeds, even for brand new users
CREATE OR REPLACE FUNCTION public.track_user_session(
  p_user_id UUID,
  p_session_id TEXT,
  p_device_type TEXT,
  p_browser TEXT,
  p_os TEXT,
  p_device_name TEXT,
  p_user_agent TEXT,
  p_ip_address TEXT
)
RETURNS UUID AS $$
DECLARE
  v_session_log_id UUID;
BEGIN
  -- Validate that the user exists in public.users
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User does not exist in public.users table';
  END IF;

  -- Insert session record (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO user_sessions_log (
    user_id,
    session_id,
    device_type,
    browser,
    os,
    device_name,
    user_agent,
    ip_address,
    login_at,
    last_activity_at,
    is_active
  ) VALUES (
    p_user_id,
    p_session_id,
    p_device_type,
    p_browser,
    p_os,
    p_device_name,
    p_user_agent,
    p_ip_address,
    NOW(),
    NOW(),
    TRUE
  )
  RETURNING id INTO v_session_log_id;

  RETURN v_session_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.track_user_session TO authenticated;

COMMENT ON FUNCTION public.track_user_session IS 'Tracks user session with SECURITY DEFINER to bypass RLS for new users';

