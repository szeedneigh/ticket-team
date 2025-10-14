-- Migration: Seed initial data
-- Description: Categories taxonomy and super_admin user
-- Date: 2025-01-14

-- ============================================================================
-- SEED CATEGORIES
-- ============================================================================

-- Hardware Categories
INSERT INTO categories (name, parent_id, type, is_active) VALUES
('Hardware', NULL, 'both', TRUE),
('Software', NULL, 'both', TRUE),
('Network', NULL, 'both', TRUE),
('Access', NULL, 'both', TRUE),
('Other', NULL, 'both', TRUE);

-- Store parent category IDs for subcategories
DO $$
DECLARE
  hardware_id UUID;
  software_id UUID;
  network_id UUID;
  access_id UUID;
  other_id UUID;
BEGIN
  -- Get parent category IDs
  SELECT id INTO hardware_id FROM categories WHERE name = 'Hardware';
  SELECT id INTO software_id FROM categories WHERE name = 'Software';
  SELECT id INTO network_id FROM categories WHERE name = 'Network';
  SELECT id INTO access_id FROM categories WHERE name = 'Access';
  SELECT id INTO other_id FROM categories WHERE name = 'Other';

  -- Hardware Subcategories
  INSERT INTO categories (name, parent_id, type, is_active) VALUES
    ('Desktop', hardware_id, 'both', TRUE),
    ('Laptop', hardware_id, 'both', TRUE),
    ('Printer', hardware_id, 'both', TRUE),
    ('Projector', hardware_id, 'both', TRUE),
    ('Network Equipment', hardware_id, 'both', TRUE),
    ('Peripherals', hardware_id, 'both', TRUE);

  -- Software Subcategories
  INSERT INTO categories (name, parent_id, type, is_active) VALUES
    ('Email', software_id, 'both', TRUE),
    ('Office Applications', software_id, 'both', TRUE),
    ('Antivirus', software_id, 'both', TRUE),
    ('Operating System', software_id, 'both', TRUE),
    ('Database', software_id, 'both', TRUE),
    ('Custom Applications', software_id, 'both', TRUE);

  -- Network Subcategories
  INSERT INTO categories (name, parent_id, type, is_active) VALUES
    ('Internet Connection', network_id, 'both', TRUE),
    ('WiFi', network_id, 'both', TRUE),
    ('VPN', network_id, 'both', TRUE),
    ('File Sharing', network_id, 'both', TRUE),
    ('Network Drive', network_id, 'both', TRUE);

  -- Access Subcategories
  INSERT INTO categories (name, parent_id, type, is_active) VALUES
    ('Account Creation', access_id, 'both', TRUE),
    ('Password Reset', access_id, 'both', TRUE),
    ('Permissions', access_id, 'both', TRUE),
    ('System Access', access_id, 'both', TRUE);

  -- Other Subcategories
  INSERT INTO categories (name, parent_id, type, is_active) VALUES
    ('Consultation', other_id, 'both', TRUE),
    ('Training', other_id, 'both', TRUE),
    ('Documentation', other_id, 'knowledge_base', TRUE),
    ('General Inquiry', other_id, 'both', TRUE);
END $$;

-- ============================================================================
-- SEED SUPER ADMIN USER
-- ============================================================================

-- NOTE: This creates a placeholder user entry. The actual auth.users entry
-- must be created through Supabase Auth (signup or admin API).
-- After creating the auth user, update this record with the correct UUID.

-- First, check if we can create a super admin via auth
-- If not, this will need to be done manually through Supabase Dashboard

-- Create super admin placeholder (to be updated with real auth.users.id)
-- IMPORTANT: Replace this with actual auth user creation in production

DO $$
DECLARE
  super_admin_email TEXT := 'systemadmin@laverdad.edu.ph';
  existing_auth_user UUID;
BEGIN
  -- Check if auth user already exists
  SELECT id INTO existing_auth_user
  FROM auth.users
  WHERE email = super_admin_email
  LIMIT 1;

  -- If auth user exists, create the profile
  IF existing_auth_user IS NOT NULL THEN
    INSERT INTO public.users (id, email, full_name, role, department, position)
    VALUES (
      existing_auth_user,
      super_admin_email,
      'System Administrator',
      'super_admin',
      'MIS',
      'System Administrator'
    )
    ON CONFLICT (id) DO UPDATE
    SET
      role = 'super_admin',
      department = 'MIS',
      position = 'System Administrator';
    
    RAISE NOTICE 'Super admin profile created for existing auth user: %', existing_auth_user;
  ELSE
    RAISE NOTICE 'Auth user for % does not exist yet. Please create via Supabase Auth first.', super_admin_email;
    RAISE NOTICE 'After creating the auth user, run:';
    RAISE NOTICE 'INSERT INTO public.users (id, email, full_name, role, department, position)';
    RAISE NOTICE 'VALUES (<auth_user_id>, ''systemadmin@laverdad.edu.ph'', ''System Administrator'', ''super_admin'', ''MIS'', ''System Administrator'')';
    RAISE NOTICE 'ON CONFLICT (id) DO UPDATE SET role = ''super_admin'';';
  END IF;
END $$;

-- ============================================================================
-- INITIAL KNOWLEDGE BASE ARTICLES (Optional)
-- ============================================================================

-- Example: Password Reset Guide
-- Note: This requires an author_id. Will be added after super admin user is created.

-- Comments for documentation
COMMENT ON TABLE categories IS 'Seeded with standard IT support taxonomy';

