#!/usr/bin/env tsx
/**
 * Pre-Development Health Check
 *
 * Automatically runs before `npm run dev` to ensure cache health.
 * Cleans cache if corruption is detected or if cache is too large/old.
 *
 * This prevents the common "CSS not loading" and webpack cache issues.
 *
 * Usage:
 *   npm run pre-dev (runs automatically via predev script)
 */

import { existsSync, statSync, readdirSync, readFileSync } from 'fs';
import { rm } from 'fs/promises';
import { join } from 'path';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const projectRoot = join(__dirname, '..');
const nextDir = join(projectRoot, '.next');
const cacheDir = join(nextDir, 'cache', 'webpack');

/**
 * Calculate total cache size in bytes
 */
function calculateCacheSize(): number {
  if (!existsSync(cacheDir)) {
    return 0;
  }

  let totalSize = 0;

  function calcSize(dir: string) {
    try {
      const files = readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        const filePath = join(dir, file.name);
        try {
          if (file.isDirectory()) {
            calcSize(filePath);
          } else {
            totalSize += statSync(filePath).size;
          }
        } catch {
          // Skip files that can't be accessed
        }
      }
    } catch {
      // Skip directories that can't be accessed
    }
  }

  calcSize(cacheDir);
  return totalSize;
}

/**
 * Check if cache is healthy
 */
interface CacheHealth {
  isHealthy: boolean;
  reasons: string[];
  cacheSizeMB: number;
  cacheAgeDays: number;
}

function checkCacheHealth(): CacheHealth {
  const health: CacheHealth = {
    isHealthy: true,
    reasons: [],
    cacheSizeMB: 0,
    cacheAgeDays: 0,
  };

  // Check if cache directory exists
  if (!existsSync(cacheDir)) {
    log('✓ No cache exists - clean slate', 'green');
    return health;
  }

  // Calculate cache size
  const totalBytes = calculateCacheSize();
  health.cacheSizeMB = totalBytes / (1024 * 1024);

  // Check cache age
  try {
    const cacheStats = statSync(cacheDir);
    health.cacheAgeDays = (Date.now() - cacheStats.mtimeMs) / (1000 * 60 * 60 * 24);
  } catch (error) {
    health.isHealthy = false;
    health.reasons.push('Failed to read cache metadata');
    return health;
  }

  // Rule 1: Cache too large (> 500 MB)
  if (health.cacheSizeMB > 500) {
    health.isHealthy = false;
    health.reasons.push(`Cache too large (${health.cacheSizeMB.toFixed(0)} MB)`);
  }

  // Rule 2: Cache too old (> 7 days)
  if (health.cacheAgeDays > 7) {
    health.isHealthy = false;
    health.reasons.push(`Cache too old (${health.cacheAgeDays.toFixed(1)} days)`);
  }

  // Rule 3: Check for manifest corruption
  const buildManifest = join(nextDir, 'build-manifest.json');
  if (existsSync(buildManifest)) {
    try {
      const content = readFileSync(buildManifest, 'utf-8');
      JSON.parse(content);
    } catch {
      health.isHealthy = false;
      health.reasons.push('Corrupted build manifest detected');
    }
  }

  return health;
}

/**
 * Clean cache directories
 */
async function cleanCache(): Promise<void> {
  const dirsToClean = [
    { path: nextDir, name: '.next' },
    { path: join(projectRoot, 'node_modules', '.cache'), name: 'node_modules/.cache' },
  ];

  for (const { path, name } of dirsToClean) {
    if (existsSync(path)) {
      try {
        log(`  Removing ${name}...`, 'blue');
        await rm(path, { recursive: true, force: true });
        log(`  ✓ Cleaned ${name}`, 'green');
      } catch (error) {
        log(`  ✗ Failed to clean ${name}: ${error}`, 'red');
      }
    }
  }
}

/**
 * Main execution
 */
async function main() {
  log('\n🔍 Pre-Development Cache Check', 'cyan');
  log('===============================\n', 'cyan');

  const health = checkCacheHealth();

  if (health.isHealthy) {
    if (health.cacheSizeMB > 0) {
      log(`✓ Cache is healthy (${health.cacheSizeMB.toFixed(0)} MB, ${health.cacheAgeDays.toFixed(1)} days old)`, 'green');
    }
    log('✓ Ready to start development server\n', 'green');
    process.exit(0);
  }

  // Cache is unhealthy - clean it
  log('⚠ Cache health issues detected:', 'yellow');
  health.reasons.forEach((reason) => {
    log(`  • ${reason}`, 'yellow');
  });

  log('\n🧹 Auto-cleaning cache...\n', 'cyan');
  await cleanCache();

  log('\n✨ Cache cleaned successfully!', 'green');
  log('✓ Ready to start development server\n', 'green');
  process.exit(0);
}

// Run the check
main().catch((error) => {
  log(`\n❌ Pre-dev check failed: ${error.message}`, 'red');
  log('⚠ Continuing anyway, but you may experience issues\n', 'yellow');
  // Don't block dev server startup
  process.exit(0);
});
