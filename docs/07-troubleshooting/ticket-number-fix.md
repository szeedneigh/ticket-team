# Ticket Number Inconsistency Fix

**Issue ID:** #17  
**Status:** ✅ FIXED  
**Date:** January 26, 2026  
**Priority:** High

## Problem Description

Ticket numbers were displayed inconsistently across different views:
- **List View:** Showed human-readable format like `TT-2026-008`
- **Detail View:** Showed UUID slice like `Ticket #65080241`
- **Activity Tab:** Failed to display ticket numbers (wrong field name)

This caused confusion for users trying to reference tickets.

## Root Cause

The application uses two identifiers for tickets:

1. **`id` (UUID):** Internal database identifier (e.g., `65080241-a1b2-...`)
2. **`display_number` (string):** User-facing ticket number (e.g., `TT-2026-008`)

Some components were incorrectly using `id.slice(0, 8)` instead of `display_number`.

## Changes Made

### 1. Fixed Ticket Detail Page Metadata
**File:** `src/app/(dashboard)/tickets/[id]/page.tsx`

```typescript
// BEFORE
export async function generateMetadata({ params }: PageProps) {
  return {
    title: `Ticket #${id.slice(0, 8)}`, // ❌ Using UUID slice
  }
}

// AFTER
export async function generateMetadata({ params }: PageProps) {
  const supabase = await createClient()
  const { data: ticket } = await supabase
    .from('tickets')
    .select('display_number')
    .eq('id', id)
    .single()
  
  const ticketNumber = ticket?.display_number || `#${id.slice(0, 8)}`
  return {
    title: `Ticket ${ticketNumber}`, // ✅ Using display_number
  }
}
```

### 2. Fixed Ticket Detail Page Header Badge
**File:** `src/app/(dashboard)/tickets/[id]/page.tsx`

```typescript
// BEFORE
<span>Ticket #{ticket.id.slice(0, 8)}</span> // ❌ UUID slice

// AFTER
<span>{ticket.display_number || `Ticket #${ticket.id.slice(0, 8)}`}</span> // ✅
```

### 3. Fixed Activity Tab Recent Tickets
**File:** `src/components/profile/activity-tab.tsx`

```typescript
// BEFORE
interface RecentTicket {
  ticket_number: string // ❌ Wrong field name
}
.select('id, ticket_number, title, status, created_at') // ❌ Column doesn't exist

// AFTER
interface RecentTicket {
  display_number: string // ✅ Correct field name
}
.select('id, display_number, title, status, created_at') // ✅ Correct column
```

### 4. Fixed Audit Log Table
**File:** `src/components/audit/audit-log-table.tsx`

```typescript
// BEFORE
{log.ticket.ticket_number || fallback} // ❌ Wrong field

// AFTER
{log.ticket.display_number || fallback} // ✅ Correct field
```

## Database Schema Reference

```sql
-- Display number generation (from migration 20260111000002)
ALTER TABLE tickets 
  ADD COLUMN display_number TEXT UNIQUE;

-- Format: TT-YYYY-NNN (e.g., TT-2026-001)
-- Generated automatically on ticket creation
-- Resets counter each year
```

## Testing Instructions

### 1. Test Ticket List View
1. Navigate to **My Tickets** (`/tickets`)
2. Verify all tickets show format: `TT-2026-XXX`
3. Check both desktop table and mobile card views

### 2. Test Ticket Detail View
1. Click on any ticket from the list
2. Verify the header badge shows: `TT-2026-XXX` (same as list)
3. Verify browser tab title shows: `Ticket TT-2026-XXX`
4. **Expected:** Numbers match between list and detail views

### 3. Test Activity Tab
1. Navigate to **Profile → Activity** (`/profile?tab=activity`)
2. Scroll to "Recent Tickets" section
3. Verify ticket numbers display as: `TT-2026-XXX`
4. **Expected:** No "undefined" or blank ticket numbers

### 4. Test Audit Log (Admin Only)
1. Navigate to **Audit** page (super_admin only)
2. Verify ticket references show: `TT-2026-XXX`

### 5. Create New Ticket Test
1. Create a new ticket
2. Note the ticket number shown in the list
3. Open the ticket details
4. **Expected:** Same ticket number in both views

## Verification Checklist

- [ ] Ticket list shows `TT-2026-XXX` format
- [ ] Ticket detail page shows same `TT-2026-XXX`
- [ ] Browser tab title uses `TT-2026-XXX`
- [ ] Activity tab shows `TT-2026-XXX` in recent tickets
- [ ] Audit log shows `TT-2026-XXX` (if admin)
- [ ] New tickets get assigned sequential numbers
- [ ] No console errors related to `ticket_number` field

## Rollback Plan

If issues arise, revert these commits:
- Ticket detail page metadata fetch
- All `display_number` field references

Fallback behavior is built-in: `display_number || id.slice(0, 8)`

## Additional Notes

- All components now consistently use `display_number` field
- Fallback to UUID slice is maintained for backwards compatibility
- The `ticket_number` field name was incorrect and has been replaced
- Migration `20260111000002` ensures all existing tickets have display numbers

## Related Issues

- User report: "Random Ticket Example shows TT-2026-008 in list but Ticket #65080241 when opened"
- Affects user experience and ticket reference accuracy
- Critical for support staff communication

## Follow-up

Monitor for:
- Any remaining references to `ticket_number` (incorrect field)
- Display number generation failures for new tickets
- Inconsistencies in other ticket-related components
