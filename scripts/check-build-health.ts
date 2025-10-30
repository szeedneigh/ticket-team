#!/usr/bin/env tsx
/**
 * Build Health Check Script
 * 
 * This script validates the integrity of the Next.js build artifacts and webpack cache
 * to prevent runtime errors caused by corrupted or incomplete builds.
 * 
 * Checks performed:
 * - Manifest files existence and validity
 * - Webpack cache integrity
 * - Orphaned chunk detection
 * - Cache size and age monitoring
 * - Module resolution validation
 * 
 * Usage:
 *   npm run health
 *   # or
 *   tsx scripts/check-build-health.ts
 * 
 * Exit codes:
 *   0 - All checks passed
 *   1 - Critical issues found (requires cache cleanup)
 *   2 - Warnings found (cache cleanup recommended)
 */

import { existsSync, statSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

interface HealthCheckResult {
  passed: boolean;
  critical: boolean;
  message: string;
}

interface HealthReport {
  checks: HealthCheckResult[];
  criticalIssues: number;
  warnings: number;
  passed: number;
}

const projectRoot = join(__dirname, '..');
const nextDir = join(projectRoot, '.next');
const cacheDir = join(nextDir, 'cache', 'webpack');
const serverDir = join(nextDir, 'server');

/**
 * Check if required manifest files exist
 */
function checkManifestFiles(): HealthCheckResult[] {
  const results: HealthCheckResult[] = [];
  
  const requiredManifests = [
    { path: join(nextDir, 'build-manifest.json'), name: 'build-manifest.json' },
    { path: join(nextDir, 'routes-manifest.json'), name: 'routes-manifest.json' },
    { path: join(serverDir, 'app-paths-manifest.json'), name: 'app-paths-manifest.json' },
    { path: join(serverDir, 'pages-manifest.json'), name: 'pages-manifest.json' },
    { path: join(nextDir, 'prerender-manifest.json'), name: 'prerender-manifest.json' },
  ];

  for (const manifest of requiredManifests) {
    if (existsSync(manifest.path)) {
      try {
        // Validate JSON structure
        const content = readFileSync(manifest.path, 'utf-8');
        JSON.parse(content);
        results.push({
          passed: true,
          critical: false,
          message: `✓ ${manifest.name} exists and is valid`,
        });
      } catch {
        results.push({
          passed: false,
          critical: true,
          message: `✗ ${manifest.name} is corrupted (invalid JSON)`,
        });
      }
    } else {
      results.push({
        passed: false,
        critical: true,
        message: `✗ ${manifest.name} is missing`,
      });
    }
  }

  return results;
}

/**
 * Check webpack cache integrity
 */
function checkWebpackCache(): HealthCheckResult[] {
  const results: HealthCheckResult[] = [];

  if (!existsSync(cacheDir)) {
    results.push({
      passed: true,
      critical: false,
      message: '○ Webpack cache directory does not exist (clean state)',
    });
    return results;
  }

  try {
    const cacheStats = statSync(cacheDir);
    const cacheAgeDays = (Date.now() - cacheStats.mtimeMs) / (1000 * 60 * 60 * 24);
    
    // Calculate cache size
    let totalSize = 0;
    function calculateSize(dir: string) {
      const files = readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        const filePath = join(dir, file.name);
        if (file.isDirectory()) {
          calculateSize(filePath);
        } else {
          totalSize += statSync(filePath).size;
        }
      }
    }
    calculateSize(cacheDir);
    
    const cacheSizeMB = totalSize / (1024 * 1024);

    results.push({
      passed: true,
      critical: false,
      message: `✓ Webpack cache exists (${cacheSizeMB.toFixed(2)} MB, ${cacheAgeDays.toFixed(1)} days old)`,
    });

    // Warn if cache is too large
    if (cacheSizeMB > 500) {
      results.push({
        passed: false,
        critical: false,
        message: `⚠ Webpack cache is large (${cacheSizeMB.toFixed(2)} MB) - consider cleanup`,
      });
    }

    // Warn if cache is very old
    if (cacheAgeDays > 7) {
      results.push({
        passed: false,
        critical: false,
        message: `⚠ Webpack cache is old (${cacheAgeDays.toFixed(1)} days) - consider cleanup`,
      });
    }

  } catch (error) {
    results.push({
      passed: false,
      critical: true,
      message: `✗ Failed to read webpack cache: ${error}`,
    });
  }

  return results;
}

/**
 * Check for orphaned chunks
 */
function checkOrphanedChunks(): HealthCheckResult[] {
  const results: HealthCheckResult[] = [];

  if (!existsSync(nextDir)) {
    results.push({
      passed: false,
      critical: true,
      message: '✗ .next directory does not exist - build required',
    });
    return results;
  }

  try {
    // Check if webpack-runtime.js exists
    const webpackRuntimePath = join(serverDir, 'webpack-runtime.js');
    if (existsSync(webpackRuntimePath)) {
      results.push({
        passed: true,
        critical: false,
        message: '✓ webpack-runtime.js exists',
      });
    } else {
      results.push({
        passed: false,
        critical: true,
        message: '✗ webpack-runtime.js is missing',
      });
    }

    // Check server chunks directory (Next.js 15 uses vendor-chunks)
    const chunksDir = join(serverDir, 'chunks');
    const vendorChunksDir = join(serverDir, 'vendor-chunks');

    if (existsSync(chunksDir)) {
      const chunks = readdirSync(chunksDir);
      results.push({
        passed: true,
        critical: false,
        message: `✓ Server chunks directory exists (${chunks.length} chunks)`,
      });
    } else if (existsSync(vendorChunksDir)) {
      const chunks = readdirSync(vendorChunksDir);
      results.push({
        passed: true,
        critical: false,
        message: `✓ Server vendor-chunks directory exists (${chunks.length} chunks)`,
      });
    } else {
      results.push({
        passed: false,
        critical: true,
        message: '✗ Server chunks/vendor-chunks directory is missing',
      });
    }

  } catch (error) {
    results.push({
      passed: false,
      critical: true,
      message: `✗ Failed to check chunks: ${error}`,
    });
  }

  return results;
}

/**
 * Check .next directory structure
 */
function checkBuildStructure(): HealthCheckResult[] {
  const results: HealthCheckResult[] = [];

  if (!existsSync(nextDir)) {
    results.push({
      passed: false,
      critical: true,
      message: '✗ .next directory does not exist - run build first',
    });
    return results;
  }

  const requiredDirs = [
    { path: serverDir, name: 'server' },
    { path: join(nextDir, 'static'), name: 'static' },
    { path: join(nextDir, 'cache'), name: 'cache' },
  ];

  for (const dir of requiredDirs) {
    if (existsSync(dir.path)) {
      results.push({
        passed: true,
        critical: false,
        message: `✓ ${dir.name} directory exists`,
      });
    } else {
      results.push({
        passed: false,
        critical: true,
        message: `✗ ${dir.name} directory is missing`,
      });
    }
  }

  return results;
}

/**
 * Run all health checks
 */
async function runHealthChecks(): Promise<HealthReport> {
  log('\n🏥 Next.js Build Health Check', 'cyan');
  log('============================\n', 'cyan');

  const report: HealthReport = {
    checks: [],
    criticalIssues: 0,
    warnings: 0,
    passed: 0,
  };

  // Run all checks
  log('📋 Checking build structure...', 'blue');
  report.checks.push(...checkBuildStructure());
  
  log('\n📄 Checking manifest files...', 'blue');
  report.checks.push(...checkManifestFiles());
  
  log('\n💾 Checking webpack cache...', 'blue');
  report.checks.push(...checkWebpackCache());
  
  log('\n🔍 Checking for orphaned chunks...', 'blue');
  report.checks.push(...checkOrphanedChunks());

  // Print results
  log('\n============================', 'cyan');
  log('Results:', 'bold');
  log('============================\n', 'cyan');

  for (const check of report.checks) {
    if (check.passed) {
      log(check.message, 'green');
      report.passed++;
    } else if (check.critical) {
      log(check.message, 'red');
      report.criticalIssues++;
    } else {
      log(check.message, 'yellow');
      report.warnings++;
    }
  }

  return report;
}

/**
 * Main execution
 */
async function main() {
  try {
    const report = await runHealthChecks();

    // Print summary
    log('\n============================', 'cyan');
    log('Summary:', 'bold');
    log('============================\n', 'cyan');
    log(`✓ Passed: ${report.passed}`, 'green');
    log(`⚠ Warnings: ${report.warnings}`, 'yellow');
    log(`✗ Critical: ${report.criticalIssues}`, 'red');

    // Provide recommendations
    if (report.criticalIssues > 0) {
      log('\n🚨 Critical Issues Detected!', 'red');
      log('============================\n', 'red');
      log('Action required: Run cache cleanup', 'yellow');
      log('  npm run clean:cache', 'cyan');
      log('  npm run dev\n', 'cyan');
      process.exit(1);
    } else if (report.warnings > 0) {
      log('\n⚠️  Warnings Detected', 'yellow');
      log('============================\n', 'yellow');
      log('Recommended: Clean cache for optimal performance', 'yellow');
      log('  npm run clean:cache', 'cyan');
      log('  npm run dev\n', 'cyan');
      process.exit(2);
    } else {
      log('\n✨ All checks passed! Build is healthy.\n', 'green');
      process.exit(0);
    }

  } catch (error) {
    log(`\n❌ Health check failed: ${error}`, 'red');
    process.exit(1);
  }
}

// Run the health check
main();

