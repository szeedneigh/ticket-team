# Component Library

> Catalogue of UI components and usage guidelines.

## Table of Contents
- [Overview](#overview)
- [Components](#components)
  - [TicketList](#ticketlist)
  - [TicketDetails](#ticketdetails)
  - [CommentBox](#commentbox)
  - [KBArticleCard](#kbarticlecard)
  - [ChatbotWidget](#chatbotwidget)
  - [AnalyticsCharts](#analyticscharts)
- [Accessibility](#accessibility)
- [References](#references)

## Overview
Shared, composable components built with React (Next.js) and shadcn/ui primitives. UI components are based on accessible Radix UI primitives, customized with Tailwind CSS, and composed into domain-specific features. Follow [Styling Guide](./styling-guide.md) and [Coding Standards](../06-development/coding-standards.md).

### shadcn/ui Foundation
- **Primitive components** live in `src/components/ui/` (generated via shadcn CLI)
- **Feature components** compose primitives into domain-specific functionality
- **Customization** via Tailwind classes and CSS variables defined in `globals.css`
- **Accessibility** baked in through Radix UI foundation (ARIA, keyboard navigation, focus management)

## Components

### TicketList
Renders a paginated list of tickets with filters.

Props:

| Name | Type | Required | Description |
|---|---|---|---|
| tickets | Ticket[] | yes | Tickets to display |
| onSelect | (ticketId: string) => void | yes | Selection callback |
| filters | TicketFilters | no | Applied filters |

Usage:
```tsx
<TicketList tickets={tickets} onSelect={setActiveId} />
```

### TicketDetails
Displays full ticket info and related comments.

Props:

| Name | Type | Required | Description |
|---|---|---|---|
| ticket | Ticket | yes | Ticket to display |
| onStatusChange | (status: TicketStatus) => void | no | Update handler |

Usage:
```tsx
<TicketDetails ticket={ticket} onStatusChange={handleStatus} />
```

Behavioral notes:
- Show immutable comment history; no edit/delete affordances on comments.
- For removed attachments, render a tombstone row (e.g., "Attachment removed by staff on <date>") with no download link.

### CommentBox
Rich text input with submit/cancel.

Props:

| Name | Type | Required | Description |
|---|---|---|---|
| onSubmit | (body: string) => Promise<void> | yes | Submit handler |
| onCancel | () => void | no | Cancel handler |

Usage:
```tsx
<CommentBox onSubmit={addComment} />
```

### KBArticleCard
Compact view of a knowledge base article with snippet.

Props:

| Name | Type | Required | Description |
|---|---|---|---|
| article | KBArticle | yes | Article to render |

Usage:
```tsx
<KBArticleCard article={article} />
```

### ChatbotWidget
Floating assistant for first-line support (RAG).

Props:

| Name | Type | Required | Description |
|---|---|---|---|
| open | boolean | no | Initial open state |

Usage:
```tsx
<ChatbotWidget />
```

### AnalyticsCharts
KPI widgets for the Analytics dashboard.

Props:

| Name | Type | Required | Description |
|---|---|---|---|
| data | AnalyticsSummary | yes | Aggregated metrics |

Usage:
```tsx
<AnalyticsCharts data={summary} />
```

Visibility:
- Hide feedback-related views and data for non-`super_admin` roles. Super Admin sees feedback panels and filters.

## Accessibility
- All interactive controls support keyboard navigation and ARIA roles.
- Ensure color contrast meets WCAG AA.
- Provide labels for inputs and alt text for images/icons.

## References
- See also: [Styling Guide](./styling-guide.md)
- See also: [Folder Structure](../02-architecture/folder-structure.md)
