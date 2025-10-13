# Coding Standards

> Code conventions and patterns for this project.

## Table of Contents
- [Languages and Style](#languages-and-style)
- [Naming](#naming)
- [Error Handling](#error-handling)
- [Logging](#logging)
- [Performance](#performance)
- [Security](#security)
- [References](#references)

## Languages and Style
- TypeScript strict mode enabled.
- Prefer explicit return types for exported functions.
- Co-locate modules by domain (feature folders).
- Avoid deep nesting; use guard clauses.

```ts
export function fetchTickets(): Promise<Ticket[]> {
  // implementation
}
```

## Naming
- Variables and functions use full words; avoid abbreviations.
- Components: `PascalCase`. Hooks: `useFoo`.
- Files: match default export name.

## Error Handling
- Do not swallow errors. Surface user-facing messages where appropriate.
- Wrap external calls (Supabase, Gemini) and map errors to a standard shape.

```ts
try {
  const { data, error } = await supabase.from('tickets').select('*');
  if (error) throw error;
  return data;
} catch (err) {
  // map and rethrow
  throw mapToAppError(err);
}
```

## Logging
- Use structured logs in serverless functions.
- Avoid logging secrets (tokens, API keys, PII).

## Performance
- Memoize heavy computations; avoid unnecessary re-renders.
- Paginate and filter on the server. Index frequently queried columns.

## Security
- Enforce RLS and least-privilege access for Supabase tables.
- Keep `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` server-only.
- Validate and sanitize user input; limit file upload size/types.
 - Immutability & deletions:
   - Comments/history are immutable; do not implement UPDATE/DELETE on comments.
   - No hard deletes for domain records (tickets, users, feedback). Use status transitions or soft-delete fields.
   - Attachments must use soft delete (`deleted_at`, `deleted_by`) via RPC; retain object/quarantine in storage.
   - User lifecycle via deactivation (`deactivated_at`, `deactivated_by`); only Super Admin may govern `super_admin` roles.

## References
- See also: [Testing](./testing.md)
- See also: [Folder Structure](../02-architecture/folder-structure.md)
