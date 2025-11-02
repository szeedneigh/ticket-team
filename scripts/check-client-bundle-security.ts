#!/usr/bin/env tsx
/**
 * Client Bundle Security Checker
 *
 * Scans the Next.js client bundle to detect accidentally exposed server secrets.
 * This prevents critical security vulnerabilities where server-only environment
 * variables (like SUPABASE_SERVICE_ROLE_KEY) are bundled into client JavaScript.
 *
 * Run after build: npm run build && npm run check-bundle-security
 *
 * @module scripts/check-client-bundle-security
 */

import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

interface SecurityIssue {
  file: string
  secret: string
  context: string
}

/**
 * Server-only secrets that should NEVER appear in client bundles
 */
const FORBIDDEN_SECRETS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'GEMINI_API_KEY',
  'SERVICE_ROLE',
  'PRIVATE_KEY',
  'SECRET_KEY',
  'API_SECRET',
]

/**
 * Allowed patterns that may contain the secret names but are safe
 */
const ALLOWED_PATTERNS = [
  /\/\*\*.*?\*\//s, // JSDoc comments
  /\/\/.*$/m, // Single-line comments
  /['"]use (client|server)['"]/g, // React directives
  /process\.env\[['"][^'"]+['"]\]/g, // Dynamic env access (safe if handled correctly)
]

/**
 * Check if content contains forbidden secrets
 */
function checkForSecrets(content: string, filePath: string): SecurityIssue[] {
  const issues: SecurityIssue[] = []

  // Remove allowed patterns
  let cleanedContent = content
  for (const pattern of ALLOWED_PATTERNS) {
    cleanedContent = cleanedContent.replace(pattern, '')
  }

  for (const secret of FORBIDDEN_SECRETS) {
    const regex = new RegExp(secret, 'gi')
    const matches = [...cleanedContent.matchAll(regex)]

    for (const match of matches) {
      const index = match.index!
      const start = Math.max(0, index - 50)
      const end = Math.min(cleanedContent.length, index + secret.length + 50)
      const context = cleanedContent.slice(start, end).replace(/\n/g, ' ')

      issues.push({
        file: filePath,
        secret,
        context: `...${context}...`,
      })
    }
  }

  return issues
}

/**
 * Scan client bundle files for secrets
 */
async function scanClientBundle(): Promise<SecurityIssue[]> {
  const buildDir = path.join(process.cwd(), '.next')
  const staticDir = path.join(buildDir, 'static', 'chunks')

  if (!fs.existsSync(staticDir)) {
    console.error('❌ Build directory not found. Run `npm run build` first.')
    process.exit(1)
  }

  console.log('🔍 Scanning client bundle for exposed secrets...\n')

  // Find all JavaScript chunks
  const jsFiles = await glob('**/*.js', {
    cwd: staticDir,
    absolute: true,
  })

  console.log(`📦 Found ${jsFiles.length} JavaScript chunks to scan\n`)

  const allIssues: SecurityIssue[] = []

  for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    const issues = checkForSecrets(content, path.relative(buildDir, file))

    if (issues.length > 0) {
      allIssues.push(...issues)
    }
  }

  return allIssues
}

/**
 * Main execution
 */
async function main() {
  console.log('🛡️  Client Bundle Security Check\n')
  console.log('=' .repeat(60))
  console.log()

  try {
    const issues = await scanClientBundle()

    if (issues.length === 0) {
      console.log('✅ No security issues found!')
      console.log('   All server secrets are properly isolated.\n')
      process.exit(0)
    }

    console.error('❌ CRITICAL SECURITY ISSUES DETECTED!\n')
    console.error(`Found ${issues.length} potential secret exposure(s):\n`)

    // Group by secret type
    const groupedIssues = issues.reduce((acc, issue) => {
      if (!acc[issue.secret]) {
        acc[issue.secret] = []
      }
      acc[issue.secret].push(issue)
      return acc
    }, {} as Record<string, SecurityIssue[]>)

    for (const [secret, secretIssues] of Object.entries(groupedIssues)) {
      console.error(`🚨 ${secret}:`)
      for (const issue of secretIssues) {
        console.error(`   File: ${issue.file}`)
        console.error(`   Context: ${issue.context}`)
        console.error()
      }
    }

    console.error('⚠️  SECURITY RECOMMENDATIONS:\n')
    console.error('1. Check that server-only code is not imported in client components')
    console.error('2. Verify @/lib/env/server is not imported in "use client" files')
    console.error('3. Ensure API keys are only accessed in API routes or server actions')
    console.error('4. Review the listed files for accidental imports')
    console.error()
    console.error('See CLAUDE.md for proper environment variable patterns.\n')

    process.exit(1)
  } catch (error) {
    console.error('❌ Error during security check:', error)
    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  main()
}
