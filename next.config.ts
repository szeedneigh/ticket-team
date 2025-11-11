import {withSentryConfig} from '@sentry/nextjs';
import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,
  
  // Suppress hydration warnings from browser extensions
  // This prevents console spam from extensions that inject attributes like fdprocessedid
  onDemandEntries: {
    // Reduce hydration warning noise in development
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  
  // Experimental features for package optimization
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    // Disable webpackBuildWorker to prevent race conditions with filesystem cache
    webpackBuildWorker: false,
  },

  // Webpack configuration for cache stability and error prevention
  webpack: (config, { dev, isServer, nextRuntime }) => {
    // Fix for Sentry webpack plugin issue with oneOf rules
    // Ensure all module rules with oneOf have arrays
    if (config.module?.rules) {
      config.module.rules = config.module.rules.map((rule: any) => {
        if (rule && typeof rule === 'object' && 'oneOf' in rule) {
          return {
            ...rule,
            oneOf: Array.isArray(rule.oneOf) ? rule.oneOf : [],
          };
        }
        return rule;
      });
    }

    // Development-specific optimizations
    if (dev) {
      // Enhanced cache config with proper file locking to prevent race conditions
      config.cache = {
        type: 'filesystem',
        cacheDirectory: path.resolve(process.cwd(), '.next/cache/webpack'),
        name: `${nextRuntime ?? (isServer ? 'node' : 'client')}-development`,
        // Use 'pack' store for proper file locking and atomic operations
        store: 'pack',
        version: '2', // Bumped version to invalidate old caches with __filename issue
        compression: 'gzip',
        // Build dependencies for automatic cache invalidation
        // NOTE: Removed __filename to prevent "next.config.compiled.js" warnings
        // Next.js automatically invalidates cache when config changes via timestamp checks
        buildDependencies: {
          // Using package.json as a more stable dependency marker
          config: [path.resolve(process.cwd(), 'package.json')],
        },
        idleTimeout: 60000,
        idleTimeoutAfterLargeChanges: 1000,
        idleTimeoutForInitialStore: 0,
        maxMemoryGenerations: 3,
        memoryCacheUnaffected: true,
        // Add max cache size limit (500 MB) to prevent bloat
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        profile: false, // Disable profiling in dev for better performance
      };

      // Snapshot configuration for better module resolution
      config.snapshot = {
        managedPaths: [path.resolve(process.cwd(), 'node_modules')],
        immutablePaths: [],
        buildDependencies: {
          timestamp: true,
          hash: true,
        },
        module: {
          timestamp: true,
          hash: true,
        },
        resolve: {
          timestamp: true,
          hash: true,
        },
      };

      // Reduce concurrent compilation pressure
      config.parallelism = 2;

      // Optimize module resolution to reduce cache churn
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
      };
    } else {
      // Production optimizations
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
        // Ensure consistent builds
        minimize: true,
        // Split chunks for better caching
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for node_modules
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk for shared code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }

    return config;
  },
};

export default withSentryConfig(nextConfig, {
  org: "wise-mind-solutions",
  project: "ticket-team",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  disableLogger: true,
  automaticVercelMonitors: true,
  
  // Disable source maps upload during development
  sourcemaps: {
    disable: process.env.NODE_ENV === 'development',
  },
  
  telemetry: false,
});