<!-- 2a6d24d1-2c17-45f2-9a69-a38f4950a8d0 0132ce06-0ff5-4363-bf7e-1f256a8ae15d -->
# Phase 3C Completion Plan

### Scope

Complete three tasks:

- Connect dashboard stats to real Supabase data
- Build real activity feed from Supabase
- Add profile view/edit toggle to profile page

---

### Task 1 — Connect Dashboard Stats to Database (Priority 1)

Files to update:

- `src/app/(dashboard)/dashboard/page.tsx`
- `src/components/dashboard/stats-card.tsx` (validate props; likely no change)
- `src/components/dashboard/dashboard-skeleton.tsx` (ensure stats placeholders)
- `src/lib/dashboard/queries.ts` (reuse `getUserTicketStats`)

Implementation steps:

1. In `page.tsx` (server component), get the current user (reuse existing auth util in `src/lib/auth/session.ts` or `src/lib/supabase/server.ts`).
2. Call `getUserTicketStats(userId)` from `src/lib/dashboard/queries.ts`.
3. Render `StatsCard` components using the returned values instead of hardcoded numbers.
4. Add loading via the existing route-level `loading.tsx` and keep a lightweight in-component suspense fallback if needed.
5. Add error handling: if the stats query fails, render a non-blocking alert (`src/components/ui/alert.tsx`) and show zeroed or previous values.

Essential snippet (shape, not exact code):

```tsx
// in src/app/(dashboard)/dashboard/page.tsx
const { user } = await getSession();
const stats = await getUserTicketStats(user.id);

<StatsCard title="Open Tickets" value={stats.openCount} />
<StatsCard title="Resolved Today" value={stats.resolvedToday} />
<StatsCard title="Avg Response Time" value={`${stats.avgResponseHours}h`} />
<StatsCard title="Satisfaction" value={Number(stats.csatAvg).toFixed(1)} />
```

Acceptance criteria:

- Hardcoded numbers removed.
- Stats reflect actual Supabase data for the signed-in user.
- Graceful loading and a visible error state without crashing the page.

---

### Task 2 — Real Activity Feed (Priority 2)

New file:

- `src/lib/dashboard/activity-queries.ts`

Files to update:

- `src/components/dashboard/recent-activity.tsx` (accept typed `items` prop, remove mock)
- `src/app/(dashboard)/dashboard/page.tsx` (fetch activity data and pass down)
- `src/lib/types/dashboard.ts` (add `DashboardActivityItem` type if missing)

Implementation steps:

1. Create `activity-queries.ts` with functions that fetch:

   - Recent tickets created by the user
   - Recent comments by the user
   - Recent status changes on the user’s tickets

2. Normalize to a single union shape and sort by timestamp descending.
3. Update `RecentActivity` to accept `items: DashboardActivityItem[]` and render by `type`.
4. In `page.tsx`, fetch activity in parallel with stats on the server and pass to `RecentActivity`.

Data shape (proposed):

```ts
export type DashboardActivityItem = {
  id: string;
  type: 'ticket_created' | 'comment_added' | 'status_changed';
  title: string; // e.g., Ticket #123
  description?: string;
  ticketId: string;
  actorId: string;
  createdAt: string; // ISO
  meta?: Record<string, unknown>; // e.g., { from: 'open', to: 'resolved' }
};
```

Essential snippet for page wiring:

```tsx
const [stats, activity] = await Promise.all([
  getUserTicketStats(user.id),
  getUserActivity(user.id, { limit: 20 }),
]);

<RecentActivity items={activity} />
```

Acceptance criteria:

- Activity list reflects real user actions across tickets, comments, and status changes.
- Items are correctly typed, chronologically sorted, and visually consistent.
- Empty state is shown when no activity exists.

---

### Task 3 — Profile View/Edit Mode (Priority 3)

New file:

- `src/components/profile/profile-view.tsx`

Files to update:

- `src/app/(dashboard)/profile/page.tsx` (introduce `isEditing` state, toggle UI)
- `src/components/profile/profile-form.tsx` (add Cancel button callback)
- Reuse components: `avatar-upload.tsx`, `ui/button.tsx`

Implementation steps:

1. Build `ProfileView` to show: avatar, name, email, role, department, member since, last login, and key activity stats.
2. Add an "Edit Profile" button.
3. In page component, manage `isEditing` state. Render `ProfileView` when false, `ProfileForm` when true.
4. Update `ProfileForm` to accept `onCancel` prop and show a Cancel button that toggles back to view mode.

Essential snippet (shape):

```tsx
// src/app/(dashboard)/profile/page.tsx
const [isEditing, setIsEditing] = useState(false);
return isEditing ? (
  <ProfileForm onCancel={() => setIsEditing(false)} onSuccess={() => setIsEditing(false)} />
) : (
  <ProfileView onEdit={() => setIsEditing(true)} />
);
```

Acceptance criteria:

- Profile shows read-only view by default.
- Edit mode fully functional; Save persists (existing), Cancel returns to view mode.
- Layout clean and responsive.

---

### Testing & QA Checklist

- Verify stats change when the database changes.
- Verify activity feed updates with new tickets/comments/status changes.
- Verify profile edit: save persists; cancel discards and returns to view.
- Check loading spinners, skeletons, and error alerts render appropriately.
- Confirm TypeScript types and ESLint pass.

### Rollout

- Implement Task 1, then Task 2, then Task 3.
- After each task: run lints, manual QA, and update docs (`docs/03-features/user-flows.md` if needed).

### To-dos

- [ ] Wire dashboard stats to Supabase in page.tsx
- [ ] Add loading and error states for dashboard stats
- [ ] Create activity queries and types for dashboard
- [ ] Update RecentActivity to accept items prop and render
- [ ] Fetch activity in page.tsx and pass to component
- [ ] Create ProfileView component with key fields and actions
- [ ] Add isEditing toggle in profile page and wire buttons
- [ ] Add Cancel support to ProfileForm to exit edit mode