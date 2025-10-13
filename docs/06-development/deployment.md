# Deployment

> Steps and environments for deploying the application.

## Table of Contents
- [Environments](#environments)
- [Build and Release](#build-and-release)
- [Environment Variables](#environment-variables)
- [Rollback](#rollback)
- [Post-Deployment Checks](#post-deployment-checks)
- [References](#references)

## Environments
- Preview: per-PR deployments via Vercel
- Production: `main` branch deployments

## Build and Release
```bash
npm run build
# Vercel deploy hooks can trigger builds on pushes to main
```

## Environment Variables
Configure in Vercel Project Settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`

## Rollback
- Re-deploy a previous successful build from Vercel deployments.
- Revert the Git commit that introduced issues if needed.

## Post-Deployment Checks
- Smoke tests for auth, ticket creation, comment posting
- Verify RLS-protected endpoints
- Check analytics dashboard loading and key KPIs

## References
- See also: [Git Workflow](./git-workflow.md)
- See also: [Testing](./testing.md)
