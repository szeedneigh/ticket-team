/**
 * Database Health Check Script
 * 
 * Verifies that the database is properly set up and all tables exist.
 * Run with: npx tsx scripts/check-db.ts
 */

import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const REQUIRED_TABLES = [
  'users',
  'tickets',
  'ticket_comments',
  'ticket_activities',
  'ticket_feedback',
  'categories',
  'knowledge_articles',
  'article_votes',
  'ai_interactions',
  'attachments'
]

async function checkDatabase() {
  console.log('🔍 Checking database setup...\n')

  let allTablesExist = true

  for (const table of REQUIRED_TABLES) {
    try {
      const { error } = await supabase
        .from(table)
        .select('id', { count: 'exact', head: true })
        .limit(0)

      if (error) {
        console.error(`❌ Table '${table}' error: ${error.message}`)
        allTablesExist = false
      } else {
        console.log(`✅ Table '${table}' exists`)
      }
    } catch (err) {
      console.error(`❌ Error checking table '${table}':`, err)
      allTablesExist = false
    }
  }

  console.log('\n' + '='.repeat(50))
  
  if (allTablesExist) {
    console.log('✅ All required tables exist!')
    console.log('\nYour database is properly set up.')
  } else {
    console.log('❌ Some tables are missing!')
    console.log('\nTo fix this, run the migrations:')
    console.log('  1. Make sure Supabase is running: npx supabase start')
    console.log('  2. Apply migrations: npx supabase db reset')
    console.log('  3. Or push to remote: npx supabase db push')
  }
  
  console.log('='.repeat(50))
}

checkDatabase().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
