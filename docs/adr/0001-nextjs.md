# ADR 0001: Choose Next.js for Frontend

## Status
Accepted

## Context
We need a frontend framework that supports SSR/CSR, great DX, routing, and easy deployment on Vercel.

## Decision
Adopt Next.js as the frontend framework.

## Consequences
- Pros: SSR/ISR, file-based routing, strong ecosystem, seamless Vercel deploys.
- Cons: Framework conventions to follow; learning curve for app router.

## Alternatives Considered
- Create React App: no SSR; dated.
- Vite + React: fast dev, but SSR and routing require manual setup.
