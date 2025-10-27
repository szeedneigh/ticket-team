# Database Migration Instructions

This folder contains all migrations for the Ticket Team application database.

## Option 1: Run via Supabase Dashboard (Recommended for now)

Since the Supabase CLI requires authentication, the easiest way to apply these migrations is through the Supabase Dashboard:

### Steps:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Navigate to your project: `ticket-team` (nytvyigrpxcqcyqbulww)

2. **Open SQL Editor**
   - In the left sidebar, click on "SQL Editor"
   - Click "New Query"

3. **Run Migrations in Order**

   **Step 1:** Copy and paste `run_all_migrations.sql`
   - Click "Run" button
   - Wait for completion (should show "Success")

   **Step 2:** Copy and paste `run_all_migrations_part2.sql`
   - Click "Run" button
   - Wait for completion

   **Step 3:** Copy and paste `run_all_migrations_part3.sql`
   - Click "Run" button  
   - Wait for completion
   - You should see: "Database setup completed successfully!"

4. **Verify Tables Created**
   - Go to "Table Editor" in the sidebar
   - You should see 10 tables: users, tickets, categories, etc.

5. **Create Super Admin User**
   - Go to "Authentication" > "Users"
   - Click "Add user" > "Create new user"
   - Email: `systemadmin@laverdad.edu.ph`
   - Password: (choose a secure password)
   - Auto-confirm user: YES
   - Click "Create user"
   - The user profile will be auto-created with 'super_admin' role via trigger

## Option 2: Run via Supabase CLI (After Authentication)

If you prefer using the CLI:

```bash
# Login to Supabase
npx supabase login

# Link to remote project
npx supabase link --project-ref nytvyigrpxcqcyqbulww

# Apply migrations (in order)
npx supabase db push
```

## Individual Migration Files

If you prefer to run migrations individually:

1. `20250114000001_create_custom_types.sql` - PostgreSQL ENUM types
2. `20250114000002_create_core_tables.sql` - All 10 tables with constraints
3. `20250114000003_create_indexes.sql` - Performance indexes + vector search
4. `20250114000004_create_rls_policies.sql` - Row Level Security policies
5. `20250114000005_create_functions_triggers.sql` - Functions and triggers (including auth trigger)
6. `20250114000006_seed_initial_data.sql` - Categories and super admin seed

## After Migration

Once migrations are complete:

### Verify Setup
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check vector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check categories seeded
SELECT COUNT(*) FROM categories;  -- Should return 30

-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Next Steps
- Generate TypeScript types (see Phase 2 in main README)
- Install Supabase client libraries
- Create client utilities
- Start building the application

## Troubleshooting

### "Extension vector does not exist"
- The pgvector extension should be created automatically
- If not, run in SQL Editor: `CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;`

### "Auth user not found" for super admin
- First create the auth user in Authentication > Users
- Then the trigger will automatically create the profile

### RLS Policy Errors
- Ensure you're running queries as an authenticated user
- Check that the `get_user_role()` function exists
- Verify RLS is enabled on all tables

## Migration Status

✅ Custom Types (user_role, ticket_status, ticket_priority, article_status)
✅ Core Tables (10 tables with full constraints)
✅ Performance Indexes (30+ indexes including HNSW vector search)
✅ Row Level Security (Complete security policies for all tables)
✅ Functions & Triggers (Auto-update timestamps, activity logging, auth integration)
✅ Seed Data (Categories taxonomy + super admin placeholder)

