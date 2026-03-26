-- Migration: Ticket due date (SLA-based)
-- Description: Adds due_date and due_date_manual; trigger computes SLA deadline from system_config and priority
-- Date: 2026-03-25

-- ============================================================================
-- COLUMNS
-- ============================================================================

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS due_date_manual BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.tickets.due_date IS 'Target resolution deadline derived from SLA (created_at + priority-based hours) unless manually overridden';
COMMENT ON COLUMN public.tickets.due_date_manual IS 'When true, due_date is set by staff and not auto-recalculated on minor updates';

-- ============================================================================
-- SLA HOURS (matches src/lib/settings/sla.ts getSLAThresholds)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.ticket_sla_resolution_hours(p ticket_priority, base_hours numeric)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT CASE p
    WHEN 'low' THEN base_hours * 2
    WHEN 'medium' THEN base_hours
    WHEN 'high' THEN base_hours / 3.0
    WHEN 'urgent' THEN base_hours / 4.0
    WHEN 'critical' THEN base_hours / 6.0
    ELSE base_hours
  END;
$$;

-- ============================================================================
-- TRIGGER: set / clear due date
-- ============================================================================

CREATE OR REPLACE FUNCTION public.tickets_set_due_date()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_hours numeric;
  interval_hours numeric;
BEGIN
  SELECT COALESCE((value->>'sla_resolution_hours')::numeric, 72) INTO base_hours
  FROM public.system_settings
  WHERE key = 'system_config'
  LIMIT 1;

  IF base_hours IS NULL OR base_hours <= 0 THEN
    base_hours := 72;
  END IF;

  IF TG_OP = 'INSERT' THEN
    interval_hours := public.ticket_sla_resolution_hours(NEW.priority, base_hours);
    NEW.due_date := NEW.created_at + (interval '1 hour' * interval_hours);
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Terminal statuses: clear due date
    IF NEW.status IN ('resolved', 'closed', 'canceled') THEN
      NEW.due_date := NULL;
      NEW.due_date_manual := FALSE;
      RETURN NEW;
    END IF;

    -- Priority change: always recalculate from SLA
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
      interval_hours := public.ticket_sla_resolution_hours(NEW.priority, base_hours);
      NEW.due_date := NEW.created_at + (interval '1 hour' * interval_hours);
      NEW.due_date_manual := FALSE;
      RETURN NEW;
    END IF;

    -- Reopen from resolved/closed
    IF OLD.status IN ('resolved', 'closed') AND NEW.status IN ('open', 'in_progress', 'on_hold') THEN
      interval_hours := public.ticket_sla_resolution_hours(NEW.priority, base_hours);
      NEW.due_date := NEW.created_at + (interval '1 hour' * interval_hours);
      NEW.due_date_manual := FALSE;
      RETURN NEW;
    END IF;

    -- Staff manual due date (due_date + due_date_manual set by application)
    IF NEW.due_date_manual IS TRUE AND (
      OLD.due_date_manual IS DISTINCT FROM NEW.due_date_manual
      OR OLD.due_date IS DISTINCT FROM NEW.due_date
    ) THEN
      RETURN NEW;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tickets_set_due_date_trigger ON public.tickets;

CREATE TRIGGER tickets_set_due_date_trigger
  BEFORE INSERT OR UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.tickets_set_due_date();

-- ============================================================================
-- INDEX (filtering / overdue)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tickets_due_date
  ON public.tickets (due_date)
  WHERE due_date IS NOT NULL;

-- ============================================================================
-- BACKFILL active tickets (trigger does not run for plain UPDATE without row changes that match)
-- ============================================================================

UPDATE public.tickets t
SET
  due_date = t.created_at + (
    interval '1 hour' * public.ticket_sla_resolution_hours(
      t.priority,
      COALESCE(
        (SELECT (value->>'sla_resolution_hours')::numeric FROM public.system_settings WHERE key = 'system_config' LIMIT 1),
        72
      )
    )
  ),
  due_date_manual = FALSE
WHERE t.status IN ('open', 'in_progress', 'on_hold')
  AND t.due_date IS NULL;
