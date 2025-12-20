-- Create Preference Creation Triggers
-- Issue: Trigger functions for creating default preferences during signup don't exist in migrations
-- Solution: Define them properly with SECURITY DEFINER and schema-qualified table names

-- ============================================================================
-- FUNCTION: Create Default User Preferences
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_default_user_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert default user preferences with explicit schema qualification
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to create default user preferences for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.create_default_user_preferences() IS 
  'Auto-creates default user preferences when a new user is created';

-- ============================================================================
-- FUNCTION: Create Default Notification Preferences
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert default notification preferences with explicit schema qualification
  INSERT INTO public.user_notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to create default notification preferences for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.create_default_notification_preferences() IS 
  'Auto-creates default notification preferences when a new user is created';

-- ============================================================================
-- TRIGGERS: Auto-create preferences when user is created
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS create_user_preferences_trigger ON public.users;
DROP TRIGGER IF EXISTS create_notification_preferences_trigger ON public.users;

-- Create trigger for user preferences
CREATE TRIGGER create_user_preferences_trigger
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_user_preferences();

-- Create trigger for notification preferences  
CREATE TRIGGER create_notification_preferences_trigger
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_notification_preferences();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions to authenticated role
GRANT EXECUTE ON FUNCTION public.create_default_user_preferences() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_default_notification_preferences() TO authenticated;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION public.create_default_user_preferences() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_default_notification_preferences() TO service_role;

