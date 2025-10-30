#!/usr/bin/env tsx
/**
 * Safe Cache Cleanup Script
 * 
 * This script safely cleans the Next.js cache to resolve webpack cache corruption issues.
 * It ensures the dev server is not running before cleaning to prevent race conditions.
 * 
 * Usage:
 *   npm run clean:cache
 *   # or
 *   tsx scripts/clean-cache.ts
 */

import { existsSync } from 'fs';
import { rm } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function isDevServerRunning(): Promise<boolean> {
  try {
    // Check if port 3000 is in use (default Next.js dev port)
    if (process.platform === 'win32') {
      const { stdout } = await execAsync('netstat -ano | findstr :3000');
      return stdout.trim().length > 0;
    } else {
      const { stdout } = await execAsync('lsof -i :3000');
      return stdout.trim().length > 0;
    }
  } catch {
    // If command fails, assume server is not running
    return false;
  }
}

async function cleanCache() {
  const projectRoot = join(__dirname, '..');
  const nextDir = join(projectRoot, '.next');
  const nodeModulesCacheDir = join(projectRoot, 'node_modules', '.cache');

  log('\n🧹 Next.js Cache Cleanup Utility', 'cyan');
  log('================================\n', 'cyan');

  // Check if dev server is running
  log('Checking if development server is running...', 'blue');
  const isRunning = await isDevServerRunning();

  if (isRunning) {
    log('\n⚠️  WARNING: Development server appears to be running!', 'yellow');
    log('Please stop the dev server (Ctrl+C) before cleaning the cache.', 'yellow');
    log('This prevents race conditions and cache corruption.\n', 'yellow');
    process.exit(1);
  }

  log('✓ Development server is not running\n', 'green');

  const dirsToClean = [
    { path: nextDir, name: '.next directory' },
    { path: nodeModulesCacheDir, name: 'node_modules/.cache' },
  ];

  let cleanedCount = 0;
  let skippedCount = 0;

  for (const { path, name } of dirsToClean) {
    if (existsSync(path)) {
      try {
        log(`Cleaning ${name}...`, 'blue');
        await rm(path, { recursive: true, force: true });
        log(`✓ Cleaned ${name}`, 'green');
        cleanedCount++;
      } catch (error) {
        log(`✗ Failed to clean ${name}: ${error}`, 'red');
      }
    } else {
      log(`⊘ ${name} does not exist, skipping`, 'yellow');
      skippedCount++;
    }
  }

  log('\n================================', 'cyan');
  log(`\n✨ Cache cleanup complete!`, 'green');
  log(`   Cleaned: ${cleanedCount} directories`, 'green');
  if (skippedCount > 0) {
    log(`   Skipped: ${skippedCount} directories (already clean)`, 'yellow');
  }
  log('\n💡 You can now run: npm run dev\n', 'blue');
}

// Run the cleanup
cleanCache().catch((error) => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});
