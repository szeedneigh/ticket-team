<!-- 52488841-a21e-4831-9862-d7edf9864930 f47ee0ba-e14f-40c0-a813-37d872ee2574 -->
# Phase 3: Authentication & Core UI Foundation

## Current State Summary

**✅ Completed (Phases 1 & 2):**

- Database schema with 10 tables, RLS, indexes
- All migrations applied successfully
- Supabase clients (browser, server, service)
- TypeScript types for all domain entities
- Super admin user configured
- Environment variables ready (.env.local exists)

**📍 Current Status:**

- Default Next.js homepage (needs replacement)
- No auth pages or flows
- No UI components installed
- Empty components directory
- Middleware configured but no auth routes

**🎯 Goal:**

Build a production-ready authentication system and foundational UI that enables users to sign in, sign up, and access role-appropriate features.

---

## Implementation Strategy

### Phase 3A: UI Foundation & Component Library

**Why First?**

We need UI building blocks before creating auth pages and feature modules.

#### 1. Initialize shadcn/ui Component System

**Install Core Components:**

```bash
npx shadcn@latest init
npx shadcn@latest add button input label card form select textarea badge table dialog alert toast tabs separator avatar dropdown-menu
```

**Configure shadcn/ui:**

- Set up `components.json` configuration
- Configure Tailwind CSS v4 integration
- Set up CSS variables for theming (light/dark modes)
- Create `src/components/ui/` directory structure

**Key Files:**

- `components.json` - shadcn/ui config
- `src/components/ui/*` - Primitive components
- Theme variables in `globals.css`

#### 2. Create Shared Layout Components

**Build Foundational Layouts:**

**`src/components/shared/navbar.tsx`**

- App navigation bar
- User menu (profile, settings, sign out)
- Role-based navigation items
- Responsive mobile menu

**`src/components/shared/sidebar.tsx`**

- Main navigation sidebar
- Conditional rendering based on user role
- Active route highlighting
- Collapsible on mobile

**`src/components/shared/footer.tsx`**

- Application footer
- Institution branding
- Links and copyright

**`src/components/shared/page-header.tsx`**

- Reusable page title component
- Breadcrumbs
- Action buttons slot

---

### Phase 3B: Authentication System

**Critical for:** User identity, RLS policies, role-based access

#### 3. Create Auth Route Handlers

**`src/app/auth/sign-in/page.tsx`**

- Email/password sign-in form
- "Remember me" option
- Link to sign-up page
- Error handling and validation
- Redirect to dashboard on success

**`src/app/auth/sign-up/page.tsx`**

- User registration form
- Email, password, full name, department (optional)
- Terms acceptance
- Auto-confirm or email verification flow
- Trigger `handle_new_user()` to create profile

**`src/app/auth/callback/route.ts`**

- OAuth callback handler
- Exchange code for session
- Redirect to intended destination

**`src/app/auth/sign-out/route.ts`**

- Sign out API route
- Clear session cookies
- Redirect to sign-in page

**`src/app/auth/forgot-password/page.tsx`**

- Password reset request form
- Send reset email via Supabase

**`src/app/auth/reset-password/page.tsx`**

- Password reset form
- Token validation
- Update password

#### 4. Create Auth Components

**`src/components/auth/sign-in-form.tsx`**

- Client component with form state
- Validation with error messages
- Submit handler using Supabase client
- Loading states

**`src/components/auth/sign-up-form.tsx`**

- Registration form logic
- Password strength indicator
- Form validation
- Auto-create user profile via trigger

**`src/components/auth/auth-guard.tsx`**

- Wrapper component for protected routes
- Redirect unauthenticated users
- Role-based access checks

**`src/components/auth/user-avatar.tsx`**

- User profile picture component
- Fallback to initials
- Role badge overlay

#### 5. Create Auth Utilities

**`src/lib/auth/session.ts`**

```typescript
// Server-side session helpers
- getSession() - Get current user session
- requireAuth() - Throw if not authenticated
- requireRole(role) - Check user role
- getUserProfile() - Get full user profile with role
```

**`src/lib/auth/client.ts`**

```typescript
// Client-side auth helpers
- useUser() - React hook for current user
- useSession() - React hook for session
- signIn(email, password)
- signUp(email, password, userData)
- signOut()
```

---

### Phase 3C: Dashboard & Landing Pages

#### 6. Create Landing/Home Page

**`src/app/page.tsx` (Replace current)**

- Public landing page
- Feature highlights
- Call-to-action buttons (Sign In / Sign Up)
- Institution branding
- Link to knowledge base (public articles)

**Design:**

- Hero section with value proposition
- Feature cards (AI Chatbot, Ticket System, Knowledge Base)
- Statistics (if available)
- Modern, professional design

#### 7. Create Main Dashboard Layout

**`src/app/(dashboard)/layout.tsx`**

- Shared layout for authenticated pages
- Include Navbar, Sidebar, Footer
- Auth guard wrapper
- Breadcrumbs
- Protected route wrapper

**Route Groups:**

```
src/app/
├── (dashboard)/
│   ├── layout.tsx          # Auth required
│   ├── dashboard/page.tsx  # Main dashboard
│   ├── tickets/            # Ticket routes
│   ├── kb/                 # Knowledge base routes
│   └── admin/              # Admin routes
└── (public)/
    ├── layout.tsx          # Public layout
    └── kb/                 # Public KB articles
```

#### 8. Create Dashboard Pages

**`src/app/(dashboard)/dashboard/page.tsx`**

- Role-based dashboard view
- **For Employees:**
  - My open tickets
  - Quick ticket submission
  - Recent KB articles
  - AI Chat
- **For Staff/Admin:**
  - Assigned tickets
  - Ticket queue
  - Quick stats
  - Recent activity
- **For Super Admin:**
  - System overview
  - User management link
  - Analytics preview

**`src/app/(dashboard)/profile/page.tsx`**

- User profile view/edit
- Display: email, full name, role, department, position
- Edit: full name, department, position, phone, avatar
- Password change form
- Role display (cannot self-edit)

---

### Phase 3D: Core Domain Components

#### 9. Ticket Components (Foundation)

**`src/components/tickets/ticket-card.tsx`**

- Display ticket summary
- Status badge, priority indicator
- Assignment info
- Click to view details

**`src/components/tickets/ticket-list.tsx`**

- List of ticket cards
- Filtering by status, priority
- Sorting options
- Pagination
- Empty state

**`src/components/tickets/status-badge.tsx`**

- Visual status indicator
- Color-coded by status
- Tooltip with status description

**`src/components/tickets/priority-badge.tsx`**

- Priority indicator (Low/Medium/High)
- Icon + color coding

#### 10. Create Providers & Context

**`src/app/providers.tsx`**

- Toast/notification provider
- Theme provider (light/dark mode)
- React Query provider (if needed)
- Supabase session provider

**`src/lib/hooks/use-user.ts`**

- Custom hook to get current user
- Role checking utilities
- Permission helpers

---

## File Structure After Phase 3

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Auth layout
│   │   ├── dashboard/page.tsx      # Main dashboard
│   │   ├── profile/page.tsx        # User profile
│   │   └── tickets/                # (Phase 4)
│   ├── (public)/
│   │   └── layout.tsx              # Public layout
│   ├── auth/
│   │   ├── sign-in/page.tsx
│   │   ├── sign-up/page.tsx
│   │   ├── callback/route.ts
│   │   ├── sign-out/route.ts
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── layout.tsx
│   ├── page.tsx                    # New landing page
│   ├── providers.tsx               # App providers
│   └── globals.css
├── components/
│   ├── ui/                         # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   └── ... (12+ components)
│   ├── auth/
│   │   ├── sign-in-form.tsx
│   │   ├── sign-up-form.tsx
│   │   ├── auth-guard.tsx
│   │   └── user-avatar.tsx
│   ├── shared/
│   │   ├── navbar.tsx
│   │   ├── sidebar.tsx
│   │   ├── footer.tsx
│   │   └── page-header.tsx
│   └── tickets/
│       ├── ticket-card.tsx
│       ├── ticket-list.tsx
│       ├── status-badge.tsx
│       └── priority-badge.tsx
├── lib/
│   ├── auth/
│   │   ├── session.ts
│   │   └── client.ts
│   ├── hooks/
│   │   └── use-user.ts
│   ├── supabase/                   # ✅ Already exists
│   └── types/                      # ✅ Already exists
└── middleware.ts                   # ✅ Already exists
```

---

## Key Technical Decisions

### Authentication Flow

1. **Sign Up:**

   - User submits form → Supabase Auth creates auth.users record
   - Trigger `handle_new_user()` auto-creates public.users profile with role='employee'
   - Admin can later upgrade role to staff/admin/super_admin

2. **Sign In:**

   - Validate credentials via Supabase Auth
   - Set session cookie
   - Redirect to dashboard
   - Middleware protects routes

3. **Session Management:**

   - Server Components: Use `createClient()` from `@/lib/supabase/server`
   - Client Components: Use `createClient()` from `@/lib/supabase/client`
   - Middleware: Refresh session on each request

### Role-Based UI

```typescript
// Example: Conditional rendering
const { data: user } = await getUser()
const isStaff = user?.role && ['staff', 'admin', 'super_admin'].includes(user.role)

{isStaff && <StaffOnlyFeature />}
```

### Form Validation

Use Zod schemas for type-safe validation:

```typescript
// src/lib/validations/auth.ts
import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})
```

---

## Dependencies to Add

```bash
# Form handling & validation
npm install react-hook-form @hookform/resolvers zod

# Date formatting
npm install date-fns

# Icons (optional but recommended)
npm install lucide-react

# Toast notifications
npm install sonner
```

---

## Testing Checklist

After implementation, verify:

- [ ] Sign up creates user in auth.users and public.users
- [ ] Sign in redirects to dashboard
- [ ] Sign out clears session
- [ ] Middleware protects /dashboard routes
- [ ] Role-based UI shows/hides correctly
- [ ] User can view their profile
- [ ] Password reset flow works
- [ ] Dark mode toggles correctly
- [ ] Mobile responsive design works
- [ ] RLS policies enforce access control

---

## Success Criteria

**Phase 3 Complete When:**

✅ User can sign up and sign in

✅ Auth triggers create user profiles automatically

✅ Protected routes redirect unauthenticated users

✅ Dashboard shows role-appropriate content

✅ UI components are reusable and styled

✅ Navbar/Sidebar navigation works

✅ User profile page functional

✅ Landing page is professional and inviting

✅ All auth flows tested and working

✅ Ready to build ticket management (Phase 4)

---

## Next Phase Preview

**Phase 4: Ticket Management System**

- Ticket creation form
- Ticket detail view
- Comment system
- Assignment workflow
- Status transitions
- File attachments
- Activity timeline

---

## Estimated Timeline

- **Phase 3A (UI Foundation):** 4-6 hours
- **Phase 3B (Authentication):** 6-8 hours
- **Phase 3C (Dashboard):** 4-6 hours
- **Phase 3D (Components):** 3-4 hours

**Total: ~20-24 hours** of focused development

---

## Notes

- shadcn/ui is already in devDependencies (v3.3.1)
- Supabase clients already configured
- TypeScript types already defined
- RLS policies already active
- Auth trigger (`handle_new_user()`) already deployed
- Middleware already configured for route protection

**We're building on a solid foundation!** 🚀

### To-dos

- [ ] Initialize shadcn/ui and install core UI components (button, input, card, form, etc.)
- [ ] Build shared layout components (navbar, sidebar, footer, page-header)
- [ ] Create authentication pages (sign-in, sign-up, callback, sign-out, password reset)
- [ ] Build auth form components and auth guard wrapper
- [ ] Build auth utility functions and custom hooks (session helpers, useUser)
- [ ] Replace default home page with professional landing page
- [ ] Create protected dashboard layout with auth guard
- [ ] Build dashboard and profile pages with role-based content
- [ ] Create foundational ticket components (card, list, badges)
- [ ] Set up app providers (toast, theme, session)
- [ ] Install additional dependencies (react-hook-form, zod, date-fns, lucide-react, sonner)
- [ ] Test complete authentication flow and RLS policies