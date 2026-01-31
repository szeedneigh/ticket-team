/**
 * SLA threshold utilities
 *
 * Pure functions for deriving per-priority SLA thresholds from system config.
 * Kept separate from actions.ts to avoid 'use server' (Server Actions must be async).
 */

import type { SystemConfig } from './actions'

/**
 * Derive per-priority SLA thresholds from system config
 */
export function getSLAThresholds(config: SystemConfig | null): Record<string, number> {
  const base = config?.sla_resolution_hours ?? 72
  return {
    low: base * 2,
    medium: base,
    high: base / 3,
    urgent: base / 4,
    critical: base / 6,
  }
}
