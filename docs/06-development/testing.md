# Testing Guidelines

> How to write, run, and organize tests.

## Table of Contents
- [Testing Strategy](#testing-strategy)
- [Writing Tests](#writing-tests)
- [Running Tests](#running-tests)
- [Mocking External Services](#mocking-external-services)
- [CI Integration](#ci-integration)
- [References](#references)

## Testing Strategy
- Unit: pure functions and components (shallow behaviors).
- Integration: component + data fetching (Supabase SDK mocked).
- E2E: critical flows (auth, ticket lifecycle, KB search) with Playwright.

## Writing Tests
- Co-locate: `ComponentName.test.tsx`.
- Prefer RTL for component behavior over implementation details.

## Running Tests
```bash
npm run test
# or
pnpm test
```

## Mocking External Services
- Supabase: stub client methods (`from().select()...`).
- Gemini: stub serverless fetch to return deterministic responses.

```ts
vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({
  candidates: [{ content: { parts: [{ text: 'Stubbed answer' }] } }]
})));
```

## CI Integration
- Run unit/integration on every PR.
- Nightly E2E on main; smoke E2E on PR labels.

```bash
npm ci
npm run lint
npm run test -- --run
```

## References
- See also: [Git Workflow](./git-workflow.md)
- See also: [Deployment](./deployment.md)
