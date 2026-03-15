# Server/Client Boundary Errors

## Problem: Functions Cannot Be Passed to Client Components

### Error Message

```
Functions cannot be passed directly to Client Components unless you explicitly 
expose it by marking it with "use server". Or maybe you meant to call this 
function rather than return it.
```

### Root Cause

In Next.js with React Server Components, there is a strict boundary between:
- **Server Components** (default, no `'use client'` directive)
- **Client Components** (have `'use client'` directive)

Functions cannot be serialized and passed across this boundary. When a Server Component tries to pass a function (like `formatTooltip`, `render`, event handlers, etc.) as props to a Client Component, React cannot serialize it and throws an error.

### Examples of the Problem

#### ❌ BAD: Server Component passing function to Client Component

```tsx
// page.tsx (Server Component - no 'use client')
export default async function MyPage() {
  const data = await fetchData()
  
  // ❌ ERROR: Passing function to Client Component
  return (
    <TrendChart 
      data={data} 
      formatTooltip={(value) => `${value}%`}  // ❌ Function prop
    />
  )
}
```

```tsx
// trend-chart.tsx (Client Component)
'use client'

export function TrendChart({ data, formatTooltip }) {
  // ...
}
```

#### ❌ BAD: Passing render functions in table columns

```tsx
// page.tsx (Server Component)
async function StaffPage() {
  const columns = [
    {
      key: 'score',
      label: 'Score',
      render: (value) => <Badge>{value}</Badge>  // ❌ Function in object
    }
  ]
  
  return <DataTable columns={columns} data={data} />  // ❌ Error
}
```

## Solution: Extract Content to Client Components

The correct pattern is to move all interactive logic and function definitions to Client Components.

### ✅ GOOD: Extract to Client Component

**Step 1: Create a Client Component with the functions**

```tsx
// my-page-content.tsx (Client Component)
'use client'

import { TrendChart } from '@/components/analytics'

interface MyPageContentProps {
  data: Array<{ date: string; value: number }>
}

export function MyPageContent({ data }: MyPageContentProps) {
  // ✅ Function defined in client component
  return (
    <TrendChart 
      data={data} 
      formatTooltip={(value) => `${value}%`}
    />
  )
}
```

**Step 2: Use it in the Server Component**

```tsx
// page.tsx (Server Component)
import { MyPageContent } from './my-page-content'

export default async function MyPage() {
  const data = await fetchData()  // Server-side data fetching
  
  // ✅ Pass serializable data only
  return <MyPageContent data={data} />
}
```

### ✅ GOOD: Table columns with render functions

**Step 1: Create Client Component with column definitions**

```tsx
// staff-table.tsx (Client Component)
'use client'

import { DataTable } from '@/components/analytics'
import { Badge } from '@/components/ui/badge'

export function StaffTable({ data }) {
  // ✅ Columns defined in client component
  const columns = [
    {
      key: 'score',
      label: 'Score',
      render: (value) => <Badge>{value}</Badge>
    },
    {
      key: 'name',
      label: 'Name',
      render: (value, row) => (
        <div>
          <p>{value}</p>
          <p className="text-muted-foreground">{row.email}</p>
        </div>
      )
    }
  ]
  
  return <DataTable columns={columns} data={data} />
}
```

**Step 2: Use in Server Component**

```tsx
// page.tsx (Server Component)
import { StaffTable } from './staff-table'

export default async function StaffPage() {
  const data = await fetchStaffData()
  
  return <StaffTable data={data} />
}
```

## Architecture Pattern

### File Organization

```
src/app/(dashboard)/analytics/
├── tickets/
│   ├── page.tsx                  # Server Component (data fetching)
│   └── ticket-analytics-content.tsx  # Client Component (UI + functions)
├── staff/
│   ├── page.tsx                  # Server Component (data fetching)
│   └── staff-performance-content.tsx  # Client Component (UI + functions)
└── satisfaction/
    ├── page.tsx                  # Server Component (data fetching)
    └── satisfaction-content.tsx  # Client Component (UI + functions)
```

Or organize by shared components:

```
src/components/analytics/
├── ticket-analytics-content.tsx  # Client Component
├── staff-performance-content.tsx # Client Component
└── satisfaction-content.tsx      # Client Component

src/app/(dashboard)/analytics/
├── tickets/page.tsx               # Server Component
├── staff/page.tsx                 # Server Component
└── satisfaction/page.tsx          # Server Component
```

### Server Component Responsibilities

✅ **DO in Server Components:**
- Fetch data from database/API
- Authentication checks
- Authorization/role verification
- Data transformation (serializable only)
- Pass serializable props to Client Components

❌ **DON'T in Server Components:**
- Define functions to pass as props
- Use browser APIs (window, document)
- Use React hooks (useState, useEffect, etc.)
- Pass non-serializable data (functions, class instances, Date objects with methods, etc.)

### Client Component Responsibilities

✅ **DO in Client Components:**
- Define event handlers and callback functions
- Use React hooks (useState, useEffect, etc.)
- Define render functions for tables/charts
- Use browser APIs
- Handle user interactions

❌ **DON'T in Client Components:**
- Directly access database (use Server Actions or API routes instead)
- Fetch server-only secrets (SUPABASE_SERVICE_ROLE_KEY, etc.)

## Real-World Fix Example

### Before (Broken)

```tsx
// src/app/(dashboard)/analytics/tickets/page.tsx
import { TrendChart } from '@/components/analytics'

async function TicketAnalyticsContent() {
  const data = await fetchData()
  
  return (
    <div>
      <TrendChart 
        data={data.resolutionRate}
        formatTooltip={(value) => `${value}%`}  // ❌ ERROR
      />
    </div>
  )
}
```

### After (Fixed)

**1. Create Client Component**
```tsx
// src/components/analytics/ticket-analytics-content.tsx
'use client'

import { TrendChart } from '@/components/analytics'

interface Props {
  trends: {
    resolutionRate: Array<{ date: string; value: number }>
  }
}

export function TicketAnalyticsContent({ trends }: Props) {
  return (
    <div>
      <TrendChart 
        data={trends.resolutionRate}
        formatTooltip={(value) => `${value}%`}  // ✅ OK
      />
    </div>
  )
}
```

**2. Update Server Component**
```tsx
// src/app/(dashboard)/analytics/tickets/page.tsx
import { TicketAnalyticsContent } from '@/components/analytics/ticket-analytics-content'

async function TicketAnalyticsData() {
  const trends = await fetchData()
  
  return <TicketAnalyticsContent trends={trends} />  // ✅ OK
}

export default function TicketAnalyticsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <TicketAnalyticsData />
    </Suspense>
  )
}
```

## Prevention Checklist

Before committing code, verify:

- [ ] No functions passed as props from Server to Client Components
- [ ] All function props are defined in Client Components
- [ ] Server Components only pass serializable data (plain objects, arrays, primitives)
- [ ] Event handlers (`onClick`, `onChange`, etc.) are in Client Components
- [ ] Render functions for tables/charts are in Client Components
- [ ] Format functions (`formatTooltip`, `formatYAxis`, etc.) are in Client Components

## Related Documentation

- [Next.js: Server and Client Components](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)
- [React: Server Components](https://react.dev/reference/react/use-client)
- [Project: Component Patterns](.cursor/rules/component-patterns.mdc)

## Summary

**Golden Rule:** Functions cannot cross the server/client boundary. Always define functions in Client Components where they will be used.

**Pattern:**
1. Server Component fetches data
2. Server Component passes serializable data to Client Component
3. Client Component defines all functions and handlers
4. Client Component renders interactive UI

