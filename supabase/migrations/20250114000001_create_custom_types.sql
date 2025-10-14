-- Migration: Create PostgreSQL custom types (ENUMs)
-- Description: Defines controlled vocabularies for type safety and data integrity
-- Date: 2025-01-14

-- User role hierarchy for RBAC
CREATE TYPE user_role AS ENUM ('employee', 'staff', 'admin', 'super_admin');

-- Ticket lifecycle states
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'on_hold', 'resolved', 'closed', 'canceled');

-- Ticket priority levels
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high');

-- Knowledge article publication workflow
CREATE TYPE article_status AS ENUM ('draft', 'published', 'archived');

