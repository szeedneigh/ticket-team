<!-- 4548fbde-a1cd-4060-9196-1faefeb0f421 16b838e3-4944-4b59-be7d-e501fac0bce1 -->
# Phase 3C: Dashboard & Landing Pages Implementation

## Context

**Current State:**

- Phase 3A: UI components (shadcn/ui) installed and configured
- Phase 3B: Google SSO authentication fully implemented
- Existing Figma landing page at `/` with animations and branding
- No dashboard infrastructure yet

**Goals:**

- Keep Figma landing page as primary at `/`
- Create alternative landing page at `/landing-alt` for testing variations
- Build protected dashboard layout with role-based content
- Match Figma design aesthetic in new dashboard components

---

## Chunk 1: Route Structure & Dashboard Layout Foundation

**Priority:** Critical - Required foundation for all dashboard features

### Deliverables

**1.1 Create Protected Dashboard Layout**

File: `src/app/(dashboard)/layout.tsx`

```tsx
import { requireAuth } from '@/lib/auth/session'
import { Navbar } from '@/components/shared/navbar'
import { Sidebar } from '@/components/shared/sidebar'
import { Footer } from '@/components/shared/footer'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <div className="flex flex-1">
        <Sidebar user={user} />
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  )
}
```

**1.2 Create Dashboard Home Page**

File: `src/app/(dashboard)/dashboard/page.tsx`

- Role-based content rendering
- Quick action cards
- Recent activity summary
- Placeholder sections for ticket stats, KB articles, AI chat

**1.3 Update Middleware Route Protection**

File: `middleware.ts`

Ensure `/dashboard` routes are properly protected and redirect to `/auth/sign-in` if unauthenticated.

**Key Files:**

- `src/app/(dashboard)/layout.tsx` - Auth-protected layout
- `src/app/(dashboard)/dashboard/page.tsx` - Main dashboard
- `middleware.ts` - Route protection updates

**Success Criteria:**

- Unauthenticated users redirected to sign-in
- Dashboard layout renders with navbar, sidebar, footer
- Role-based content displays correctly
- Layout matches Figma aesthetic (colors, spacing, typography)

---

## Chunk 2: Enhanced Navigation Components

**Priority:** High - Required for dashboard UX

### Deliverables

**2.1 Update Authenticated Navbar**

File: `src/components/shared/navbar.tsx`

Current navbar is public-facing. Create authenticated version with:

- User avatar and dropdown menu
- Role badge display
- Quick links (Profile, Settings)
- Sign out button
- Notification bell (placeholder for Phase 4+)
- Search bar (placeholder)

**2.2 Build Dashboard Sidebar**

File: `src/components/shared/sidebar.tsx`

- Navigation menu with icons (lucide-react)
- Role-based menu items:
  - **All users:** Dashboard, My Tickets, Knowledge Base, AI Chat
  - **Staff+:** Ticket Queue, Assignments
  - **Admin+:** User Management, Analytics, Settings
  - **Super Admin:** System Config
- Active route highlighting
- Collapsible on mobile
- Consistent with Figma color scheme

**2.3 Update Footer**

File: `src/components/shared/footer.tsx`

- La Verdad Christian College branding
- Quick links (Help, Privacy, Terms)
- Copyright notice
- Minimal, clean design

**Key Files:**

- `src/components/shared/navbar.tsx` - Enhanced with auth state
- `src/components/shared/sidebar.tsx` - Role-based navigation
- `src/components/shared/footer.tsx` - Institution branding

**Success Criteria:**

- Navbar shows user info and dropdown
- Sidebar navigation works with active states
- Role-based menu items show/hide correctly
- Mobile responsive design
- Matches Figma design aesthetic

---

## Chunk 3: Dashboard Content Components

**Priority:** High - Core dashboard functionality

### Deliverables

**3.1 Create Dashboard Stats Cards**

File: `src/components/dashboard/stats-card.tsx`

Reusable stat display component:

- Icon + label + value + trend
- Color-coded by metric type
- Responsive grid layout
- Loading skeleton state

**3.2 Create Quick Actions Panel**

File: `src/components/dashboard/quick-actions.tsx`

Role-based quick action buttons:

- **Employee:** Create Ticket, Browse KB, Chat with Timi
- **Staff:** View Queue, Assign Tickets, Create KB Article
- **Admin:** Manage Users, View Reports
- Button cards with icons and descriptions

**3.3 Create Recent Activity Feed**

File: `src/components/dashboard/recent-activity.tsx`

- Timeline-style activity list
- Icons for different activity types
- Relative timestamps
- "View All" link
- Empty state design

**3.4 Create Welcome Section**

File: `src/components/dashboard/welcome-banner.tsx`

- Personalized greeting using user's name
- Role-specific messaging
- Optional dismissible tips
- Matches Figma gradient/styling

**Key Files:**

- `src/components/dashboard/stats-card.tsx`
- `src/components/dashboard/quick-actions.tsx`
- `src/components/dashboard/recent-activity.tsx`
- `src/components/dashboard/welcome-banner.tsx`

**Success Criteria:**

- Components render with proper data structure
- Role-based content displays correctly
- Loading and empty states handled
- Design matches Figma aesthetic
- Responsive across devices

---

## Chunk 4: Profile & Settings Pages

**Priority:** Medium - User account management

### Deliverables

**4.1 User Profile Page**

File: `src/app/(dashboard)/profile/page.tsx`

Display and edit user information:

- Avatar upload/change
- View: email, role, department
- Edit: full_name, position, phone, department
- Last login timestamp
- Account creation date
- Form validation with server action

**4.2 Create Profile Components**

File: `src/components/profile/profile-form.tsx`

- Edit mode toggle
- Field validation
- Loading states during save
- Success/error notifications
- Cancel changes functionality

File: `src/components/profile/avatar-upload.tsx`

- Image preview
- File size/type validation
- Crop/resize (optional)
- Upload to Supabase Storage
- Update user avatar_url

**4.3 Create Server Action for Profile Updates**

File: `src/app/actions/profile.ts`

```typescript
export async function updateProfile(formData: FormData): Promise<ActionResult>
export async function uploadAvatar(file: File): Promise<ActionResult>
```

**Key Files:**

- `src/app/(dashboard)/profile/page.tsx`
- `src/components/profile/profile-form.tsx`
- `src/components/profile/avatar-upload.tsx`
- `src/app/actions/profile.ts`

**Success Criteria:**

- Profile displays current user data
- Edit form validates inputs
- Changes save successfully
- Avatar upload works
- RLS policies enforced
- Matches design aesthetic

---

## Chunk 5: Alternative Landing Page

**Priority:** Low - Optional variation testing

### Deliverables

**5.1 Create Alternative Landing Route**

File: `src/app/landing-alt/page.tsx`

Alternative design approach:

- Different layout structure
- Feature showcase variations
- Alternative CTA positioning
- A/B test variations
- Keep same color palette/branding
- Different animation style (or no animations)

**5.2 Landing Page Comparison Component**

File: `src/components/landing/feature-card.tsx`

Reusable feature highlight cards:

- Icon + title + description
- Hover effects
- Consistent spacing
- Used in alternative landing page

**5.3 Add Navigation to Alternative Version**

- Link in footer or dev menu to access `/landing-alt`
- Side-by-side comparison capability
- Query param for showing both versions

**Key Files:**

- `src/app/landing-alt/page.tsx`
- `src/components/landing/feature-card.tsx`

**Success Criteria:**

- Alternative landing accessible at `/landing-alt`
- Different design approach from Figma version
- Same branding and color scheme
- Production-ready quality
- No impact on existing `/` route

---

## Chunk 6: Dashboard Utilities & Helpers

**Priority:** Medium - Supporting infrastructure

### Deliverables

**6.1 Dashboard Data Fetching Utilities**

File: `src/lib/dashboard/queries.ts`

```typescript
export async function getDashboardStats(userId: string): Promise<DashboardStats>
export async function getRecentActivity(userId: string, limit: number): Promise<Activity[]>
export async function getUserTicketSummary(userId: string): Promise<TicketSummary>
```

**6.2 Dashboard Types**

File: `src/lib/types/dashboard.ts`

```typescript
export interface DashboardStats {
  openTickets: number
  resolvedTickets: number
  avgResponseTime: string
  satisfaction: number
}

export interface Activity {
  id: string
  type: ActivityType
  description: string
  timestamp: Date
  metadata?: Record<string, unknown>
}
```

**6.3 Create Dashboard Hooks**

File: `src/lib/hooks/use-dashboard.ts`

```typescript
export function useDashboardStats(): UseQueryResult<DashboardStats>
export function useRecentActivity(): UseQueryResult<Activity[]>
```

**Key Files:**

- `src/lib/dashboard/queries.ts`
- `src/lib/types/dashboard.ts`
- `src/lib/hooks/use-dashboard.ts`

**Success Criteria:**

- Type-safe data fetching
- Proper error handling
- Loading states managed
- Server/client separation maintained
- RLS policies respected

---

## Chunk 7: Polish & Responsive Design

**Priority:** Medium - Production quality

### Deliverables

**7.1 Mobile Responsive Refinements**

- Test all dashboard pages on mobile viewports
- Sidebar collapses to hamburger menu
- Stats cards stack properly
- Tables scroll horizontally
- Touch-friendly tap targets

**7.2 Loading States & Skeletons**

File: `src/components/dashboard/dashboard-skeleton.tsx`

- Skeleton screens for dashboard
- Loading spinners for actions
- Smooth transitions
- Suspense boundaries

**7.3 Error Boundaries**

File: `src/app/(dashboard)/error.tsx`

Dashboard-specific error handling:

- User-friendly error messages
- Retry functionality
- Report issue button
- Fallback UI

File: `src/app/(dashboard)/dashboard/loading.tsx`

Dashboard loading state.

**7.4 Accessibility Improvements**

- ARIA labels for interactive elements
- Keyboard navigation support
- Focus indicators
- Screen reader testing
- Color contrast verification

**Key Files:**

- `src/components/dashboard/dashboard-skeleton.tsx`
- `src/app/(dashboard)/error.tsx`
- `src/app/(dashboard)/dashboard/loading.tsx`
- Various responsive CSS updates

**Success Criteria:**

- Works on mobile, tablet, desktop
- Loading states smooth and informative
- Errors handled gracefully
- Keyboard navigation works
- Passes accessibility audit

---

## Implementation Order

**Phase 1 (Critical Path):**

1. Chunk 1: Route Structure & Layout Foundation
2. Chunk 2: Navigation Components
3. Chunk 3: Dashboard Content Components

**Phase 2 (Core Features):**

4. Chunk 4: Profile & Settings Pages
5. Chunk 6: Dashboard Utilities & Helpers

**Phase 3 (Polish):**

6. Chunk 7: Polish & Responsive Design
7. Chunk 5: Alternative Landing Page (optional)

---

## Technical Considerations

### Design Aesthetic Alignment

From current Figma landing (`src/app/page.tsx`):

- Color palette: `#0693D2` (primary blue), `#003B73` (dark blue), `#d4e8f0` (light blue)
- Font: Poppins (already loaded in layout)
- Rounded corners: `20px` - `40px`
- Shadows: `shadow-lg`, `shadow-[0_20px_60px_rgba(0,0,0,0.3)]`
- Animations: framer-motion with staggered reveals
- Gradient backgrounds: `from-[#d4e8f0] via-[#e8f4f8] to-[#0a4d7e]`

Apply these consistently across dashboard:

- Use same color variables
- Match border radius styles
- Similar shadow depths
- Consistent spacing scale
- Optional: subtle animations for state changes

### Data Integration Points

Dashboard will need:

- Real ticket counts (from `tickets` table)
- User activity logs (from `ticket_activities` table)
- KB article stats (from `knowledge_base` table)
- User preferences (placeholder for future)

For Phase 3C, use:

- Mock data/placeholder numbers
- Database schema structure ready
- Actual queries implementation in Phase 4

### Server vs Client Components

- **Layouts:** Server components (auth checks)
- **Dashboard page:** Server component (initial data fetch)
- **Navigation:** Client components (interactive states)
- **Stats cards:** Server components (static data)
- **Quick actions:** Client components (click handlers)
- **Profile form:** Client component (form state)

---

## File Structure After Phase 3C

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx              # ✅ Auth-protected layout
│   │   ├── error.tsx               # ✅ Error boundary
│   │   ├── dashboard/
│   │   │   ├── page.tsx            # ✅ Main dashboard
│   │   │   └── loading.tsx         # ✅ Loading state
│   │   └── profile/
│   │       └── page.tsx            # ✅ User profile
│   ├── landing-alt/
│   │   └── page.tsx                # ✅ Alternative landing
│   ├── page.tsx                    # ✅ Figma landing (unchanged)
│   └── actions/
│       └── profile.ts              # ✅ Profile server actions
├── components/
│   ├── dashboard/
│   │   ├── stats-card.tsx          # ✅ Stat display
│   │   ├── quick-actions.tsx       # ✅ Action buttons
│   │   ├── recent-activity.tsx     # ✅ Activity feed
│   │   ├── welcome-banner.tsx      # ✅ Greeting section
│   │   └── dashboard-skeleton.tsx  # ✅ Loading state
│   ├── profile/
│   │   ├── profile-form.tsx        # ✅ Edit form
│   │   └── avatar-upload.tsx       # ✅ Avatar management
│   ├── landing/
│   │   └── feature-card.tsx        # ✅ Feature highlights
│   └── shared/
│       ├── navbar.tsx              # ✅ Enhanced with auth
│       ├── sidebar.tsx             # ✅ Role-based nav
│       └── footer.tsx              # ✅ Updated
├── lib/
│   ├── dashboard/
│   │   └── queries.ts              # ✅ Data fetching
│   ├── hooks/
│   │   └── use-dashboard.ts        # ✅ Dashboard hooks
│   └── types/
│       └── dashboard.ts            # ✅ Dashboard types
```

---

## Dependencies

All required dependencies already installed:

- ✅ framer-motion (for animations)
- ✅ lucide-react (for icons)
- ✅ shadcn/ui components
- ✅ @supabase/ssr
- ✅ react-hook-form, zod

No additional packages needed.

---

## Testing Checklist

After implementation:

**Authentication & Authorization:**

- [ ] Unauthenticated users redirected from `/dashboard`
- [ ] Role-based sidebar items show/hide correctly
- [ ] Profile updates respect RLS policies

**UI/UX:**

- [ ] Dashboard loads with user-specific data
- [ ] Navigation active states work
- [ ] Mobile sidebar collapses properly
- [ ] Loading states display smoothly
- [ ] Error boundaries catch failures

**Routes:**

- [ ] `/` shows Figma landing (unchanged)
- [ ] `/landing-alt` shows alternative design
- [ ] `/dashboard` shows main dashboard
- [ ] `/profile` shows user profile

**Design Consistency:**

- [ ] Color palette matches Figma
- [ ] Typography consistent (Poppins)
- [ ] Spacing and shadows aligned
- [ ] Responsive on all screen sizes

---

## Next Phase Preview

**Phase 4: Ticket Management System**

- Ticket creation form and workflow
- Ticket detail view with comments
- Assignment and status management
- File attachments
- Activity timeline
- Integration with dashboard stats

This phase will populate the dashboard with real data and make quick actions functional.

### To-dos

- [ ] Create protected dashboard layout with navbar, sidebar, footer integration
- [ ] Build main dashboard page with role-based content placeholders
- [ ] Update middleware to ensure proper route protection for dashboard routes
- [ ] Enhance navbar with authenticated user state, dropdown menu, and role badge
- [ ] Build sidebar with role-based navigation menu and active route highlighting
- [ ] Update footer with La Verdad branding and quick links
- [ ] Create reusable stats card component with loading states
- [ ] Build quick actions panel with role-based action buttons
- [ ] Create recent activity feed component with timeline design
- [ ] Build welcome banner with personalized greeting and role-specific messaging
- [ ] Create profile page with view and edit modes for user information
- [ ] Build profile form component with validation and server action integration
- [ ] Create avatar upload component with image preview and Supabase storage
- [ ] Create alternative landing page at /landing-alt with design variations
- [ ] Build dashboard data fetching utilities and type definitions
- [ ] Create dashboard custom hooks for data management
- [ ] Implement responsive design refinements for mobile and tablet
- [ ] Create loading states, skeletons, and error boundaries
- [ ] Add accessibility improvements (ARIA labels, keyboard navigation, focus indicators)