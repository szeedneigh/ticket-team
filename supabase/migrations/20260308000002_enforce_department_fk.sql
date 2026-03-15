-- Migration: Enforce department FK from users to departments
-- Description: Clean up orphaned department values and add a foreign key constraint
-- so users.department always references a valid departments.name.
-- Date: 2026-03-08

-- Step 1: Clean up any orphaned department values.
-- Set to NULL if the value doesn't match any departments.name.
UPDATE users
SET department = NULL, updated_at = NOW()
WHERE department IS NOT NULL
  AND department NOT IN (SELECT name FROM departments);

-- Step 2: Add FK constraint.
-- ON UPDATE CASCADE: renaming a department auto-updates all users.
-- ON DELETE SET NULL: deleting a department nulls out affected users.
ALTER TABLE users
  ADD CONSTRAINT fk_users_department
  FOREIGN KEY (department) REFERENCES departments(name)
  ON UPDATE CASCADE
  ON DELETE SET NULL;

-- Step 3: Add an index on users.department for FK lookup performance.
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
