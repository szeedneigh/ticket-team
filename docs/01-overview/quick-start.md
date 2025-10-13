# Quick Start

> The fastest way to get the app running locally.

## Table of Contents
- [Clone and Install](#clone-and-install)
- [Set Environment](#set-environment)
- [Run the App](#run-the-app)
- [Next Steps](#next-steps)
- [References](#references)

## Clone and Install
```bash
git clone <REPO_URL>
cd ticket-team
npm install
# or
pnpm install
```

## Set Environment
```bash
# create local env file
cp .env.example .env.local
# edit with your values for Supabase and Gemini API
```

## Run the App
```bash
npm run dev
# or
pnpm dev
# Open http://localhost:3000
```

## Next Steps
- Set up Supabase and env vars (see Setup Guide).
- Review [System Architecture](../02-architecture/system-architecture.md).
- Review [Coding Standards](../06-development/coding-standards.md).

## References
- See also: [Setup Guide](./setup-guide.md)
- See also: [Endpoints](../04-api/endpoints.md)
