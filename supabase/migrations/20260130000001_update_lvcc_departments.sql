-- ============================================================================
-- Migration: Update LVCC Departments
-- Description: Replaces departments with La Verdad Christian College structure
-- Date: 2025-01-30
-- ============================================================================

-- Remove existing departments (users.department stores name as text, no FK)
DELETE FROM departments;

-- Insert LVCC departments in display order
INSERT INTO departments (name, description, is_active, display_order) VALUES
  ('Primary Level', 'Primary education department', true, 10),
  ('Intermediate Level', 'Intermediate education department', true, 20),
  ('Junior High School', 'Junior high school department', true, 30),
  ('Senior High School', 'Senior high school department', true, 40),
  ('Higher Education', 'Higher education and college programs', true, 50),
  ('Administration', 'General administration and leadership', true, 60),
  ('Accounting & Finance', 'Financial operations and accounting', true, 70),
  ('Registration and Admissions', 'Student registration and admissions', true, 80),
  ('Prefect of Students Affairs & Services (PSAS)', 'Student affairs and services', true, 90),
  ('Library', 'Library services and resources', true, 100),
  ('Data Privacy', 'Data privacy and compliance', true, 110),
  ('Human Resources', 'HR and personnel management', true, 120),
  ('MIS', 'Management Information Systems', true, 130),
  ('Quality Assurance & Accreditation', 'QA and institutional accreditation', true, 140),
  ('General Admin Services', 'General administrative services', true, 150),
  ('Security', 'Campus security and safety', true, 160);
