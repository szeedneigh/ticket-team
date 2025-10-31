#!/usr/bin/env node
/**
 * Environment Variable Checker
 *
 * Verifies that all required environment variables are set
 * Run this before starting the dev server to catch issues early
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Checking Environment Variables...\n');
console.log('=====================================\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ CRITICAL: .env.local file not found!');
  console.error('   Expected location:', envPath);
  console.error('\n   Create this file with your Supabase credentials.');
  process.exit(1);
}

console.log('✅ .env.local file exists');

// Read .env.local
const envContent = fs.readFileSync(envPath, 'utf8');

// Required variables
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

let allPresent = true;

console.log('\nChecking required variables:\n');

for (const varName of requiredVars) {
  const regex = new RegExp(`^${varName}=.+$`, 'm');
  const match = envContent.match(regex);

  if (match) {
    const value = match[0].split('=')[1];
    const isPlaceholder = value.includes('placeholder') || value.includes('your-') || value.length < 10;

    if (isPlaceholder) {
      console.log(`⚠️  ${varName}: Found but looks like a placeholder`);
      console.log(`   Value: ${value.substring(0, 30)}...`);
      allPresent = false;
    } else {
      console.log(`✅ ${varName}: Set (${value.substring(0, 30)}...)`);
    }
  } else {
    console.log(`❌ ${varName}: MISSING`);
    allPresent = false;
  }
}

console.log('\n=====================================\n');

if (allPresent) {
  console.log('✅ All environment variables are properly configured!\n');
  console.log('You can now start the dev server with: npm run dev\n');
  process.exit(0);
} else {
  console.log('❌ Some environment variables are missing or invalid!\n');
  console.log('Fix these issues in .env.local before starting the server.\n');
  process.exit(1);
}
