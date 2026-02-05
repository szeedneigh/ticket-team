/**
 * Satisfaction rating emojis (1–5 scale).
 * Matches the design: crying → sad → neutral → happy → love-struck.
 */

export const SATISFACTION_EMOJIS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '😢', // Crying – very dissatisfied
  2: '😞', // Sad – dissatisfied
  3: '😐', // Neutral
  4: '🙂', // Happy – satisfied
  5: '😍', // Love-struck – very satisfied
} as const

/** Emoji for a given rating (1–5). Clamps out-of-range values. */
export function getSatisfactionEmoji(rating: number): string {
  const r = Math.max(1, Math.min(5, Math.round(rating))) as 1 | 2 | 3 | 4 | 5
  return SATISFACTION_EMOJIS[r]
}
