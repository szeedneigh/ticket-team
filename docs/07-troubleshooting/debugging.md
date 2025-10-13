# Debugging Guide

> How to diagnose and fix issues effectively.

## Table of Contents
- [Local Debugging](#local-debugging)
- [Logging](#logging)
- [Tracing & Profiling](#tracing--profiling)
- [Supabase & Serverless Logs](#supabase--serverless-logs)
- [References](#references)

## Local Debugging
- Use Next.js dev tooling and React DevTools.
- Enable source maps in development.

### Example
```bash
DEBUG=* npm run dev
```

## Logging
- Use structured logs in API Routes and redact secrets.
- Log correlation IDs for multi-service requests.

## Tracing & Profiling
- Measure slow endpoints with simple timing wrappers.
- Use browser Performance panel for UI bottlenecks.

## Supabase & Serverless Logs
- Supabase: Project > Logs for Postgres, Auth, and API events.
- Vercel: Function logs per deployment for API Routes.

## References
- See also: [Common Issues](./common-issues.md)
- See also: [Testing](../06-development/testing.md)
