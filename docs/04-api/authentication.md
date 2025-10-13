# Authentication

> How users authenticate and authorize with the API.

## Table of Contents
- [Overview](#overview)
- [Token Acquisition](#token-acquisition)
- [Token Usage](#token-usage)
- [Scopes and Roles](#scopes-and-roles)
- [References](#references)

## Overview
Supabase Auth handles authentication using secure password hashing (e.g., bcrypt) and managed sessions/tokens. See Security for RLS and RBAC policies.

## Token Acquisition
```http
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "user@example.com", "password": "••••••••" }
```

## Token Usage
```http
Authorization: Bearer <jwt>
```

## Scopes and Roles
Role-based access aligns with `employee`, `staff`, `admin`, and `super_admin`. Row-Level Security (RLS) enforces record-level permissions.

- Admin can manage users (create/update/deactivate) except `super_admin` governance, which is reserved for Super Administrator.
- Feedback data is readable/manageable only by `super_admin`; employees can submit feedback but cannot view it.
- Comments/history are immutable (no edits/deletes); attachments use soft-delete.

## References
- See also: [Security Considerations](../02-architecture/system-architecture.md#1-b6-security-considerations)
- See also: [Endpoints](./endpoints.md)
