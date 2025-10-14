# Folder Structure

> Explanation of the project's directory layout and conventions.

## Table of Contents
- [Root Layout](#root-layout)
- [Key Directories](#key-directories)
- [Naming Conventions](#naming-conventions)
- [References](#references)

## Root Layout
```text
/ (repo root)
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx
│  │  ├─ page.tsx
│  │  └─ globals.css
│  ├─ components/
│  │  └─ ui/           # shadcn/ui primitives
│  └─ ...
├─ docs/
│  ├─ 01-overview/
│  ├─ 02-architecture/
│  └─ ...
├─ public/
└─ package.json
```

## Key Directories

- **src/app/**: Next.js App Router pages and layouts
  - `layout.tsx`: Root layout with providers
  - `page.tsx`: Home/landing page
  - `globals.css`: Global styles and Tailwind directives
- **src/components/**: React components
  - `ui/`: shadcn/ui primitive components (Button, Dialog, Input, etc.)
  - Domain-specific feature components
- **docs/**: Comprehensive project documentation (see README.md)
- **public/**: Static assets
  - `assets/`: General static files
  - `images/`: Image assets
- **Configuration files** (root):
  - `next.config.ts`: Next.js configuration
  - `tsconfig.json`: TypeScript compiler options
  - `eslint.config.mjs`: ESLint rules
  - `postcss.config.mjs`: PostCSS (Tailwind v4) configuration

## Naming Conventions

- **Components**: PascalCase (e.g., `TicketList.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useTickets.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Types**: PascalCase with descriptive names (e.g., `TicketStatus`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- **Files**: Match the default export name

## References
- See also: [Coding Standards](../06-development/coding-standards.md)
- See also: [Component Library](../05-components/component-library.md)
