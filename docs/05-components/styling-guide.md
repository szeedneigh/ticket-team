# Styling Guide

> Design system principles, tokens, and theming.

## Table of Contents
- [Design Tokens](#design-tokens)
- [Spacing](#spacing)
- [Typography](#typography)
- [Colors](#colors)
- [Global Styles](#global-styles)
- [Component Styling](#component-styling)
- [Dark Mode](#dark-mode)
- [References](#references)

## Design Tokens
Expose tokens at the CSS root for portability.

```css
:root {
  --color-primary: #1e88e5;
  --color-primary-contrast: #ffffff;
  --color-bg: #ffffff;
  --color-fg: #1a1a1a;
  --radius-sm: 6px;
  --radius-md: 10px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.06);
}
```

## Spacing
- Unit: 4px base
- Scale: 4, 8, 12, 16, 24, 32, 48

## Typography
- Base: 16px; line-height 1.5
- Headings use optical sizes and consistent margins

```css
h1 { font-size: 2rem; }
h2 { font-size: 1.5rem; }
```

## Colors
- Primary: `--color-primary`
- Feedback: success, warning, danger palette
- Maintain contrast ratio ≥ 4.5:1 for body text

## Global Styles
- Normalize margins, set box-sizing
- Define layout containers and responsive breakpoints

## Component Styling
- Prefer composition over deep specificity
- Co-locate styles with components (CSS Modules) or use utility classes (Tailwind)
- Keep variants explicit (`variant="primary" | "secondary"`)

### shadcn/ui Theming
shadcn components use CSS variables for theming, defined in `src/app/globals.css`:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    /* ... other variables */
  }
  
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark mode overrides */
  }
}
```

**Customizing shadcn components:**
```tsx
import { Button } from '@/components/ui/button'

// Use built-in variants
<Button variant="default">Submit</Button>
<Button variant="outline">Cancel</Button>

// Extend with Tailwind classes
<Button className="w-full">Full Width</Button>
```

## Dark Mode
- Use class-based toggle on `html.dark` and override tokens

```css
html.dark {
  --color-bg: #0f172a;
  --color-fg: #e2e8f0;
  --color-primary: #60a5fa;
}
```

## References
- See also: [Component Library](./component-library.md)
- See also: [Coding Standards](../06-development/coding-standards.md)
