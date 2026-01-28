-- Fix System Settings RLS Policies
-- Date: 2026-01-27
-- Issue: Settings not saving for admins/super_admins

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can insert settings" ON system_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON system_settings;
DROP POLICY IF EXISTS "Admins can delete settings" ON system_settings;

-- Recreate with explicit checks
CREATE POLICY "Admins can insert settings"
  ON system_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
      AND users.deactivated_at IS NULL
    )
  );

CREATE POLICY "Admins can update settings"
  ON system_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
      AND users.deactivated_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
      AND users.deactivated_at IS NULL
    )
  );

CREATE POLICY "Admins can delete settings"
  ON system_settings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
      AND users.deactivated_at IS NULL
    )
  );

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'system_settings'
ORDER BY cmd, policyname;
