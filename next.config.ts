import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";
import path from "node:path";

import bundleAnalyzer from '@next/bundle-analyzer';

// Bundle analyzer - enable with ANALYZE=true npm run build
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/7.x/**',
      },
      {
        protocol: 'https',
        hostname: 'nytvyigrpxcqcyqbulww.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Experimental features for package optimization
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'recharts',
      'framer-motion',
      'react-hook-form',
      'date-fns',
    ],
    // Disable webpackBuildWorker to prevent race conditions with filesystem cache
    webpackBuildWorker: false,
  },

  // Webpack configuration for cache stability and error prevention
  webpack: (config, { dev, isServer, nextRuntime }) => {
    // Fix for Sentry webpack plugin issue with oneOf rules
    // Ensure all module rules with oneOf have arrays
    if (config.module?.rules) {
      config.module.rules = config.module.rules.map((rule: { oneOf?: unknown[] } | null | undefined | false | '' | 0 | string) => {
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
        // Enable tree-shaking
        usedExports: true,
        // Split chunks for better caching and loading performance
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          maxAsyncRequests: 25,
          minSize: 20000,
          cacheGroups: {
            default: false,
            vendors: false,
            // Framework chunk - React, React-DOM, Next.js (highest priority)
            framework: {
              name: 'framework',
              test: /[\\/]node_modules[\\/](react|react-dom|next|scheduler)[\\/]/,
              priority: 50,
              enforce: true,
              reuseExistingChunk: true,
            },
            // UI libraries - Radix UI components
            ui: {
              name: 'ui',
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              priority: 40,
              enforce: true,
              reuseExistingChunk: true,
            },
            // Charts - Recharts is heavy, separate chunk
            charts: {
              name: 'charts',
              test: /[\\/]node_modules[\\/](recharts|d3-[\w-]+)[\\/]/,
              priority: 35,
              enforce: true,
              reuseExistingChunk: true,
            },
            // Rich text editor - TipTap and dependencies
            editor: {
              name: 'editor',
              test: /[\\/]node_modules[\\/](@tiptap|prosemirror-|lowlight)[\\/]/,
              priority: 30,
              enforce: true,
              reuseExistingChunk: true,
            },
            // Animation libraries
            animations: {
              name: 'animations',
              test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
              priority: 28,
              enforce: true,
              reuseExistingChunk: true,
            },
            // Form libraries
            forms: {
              name: 'forms',
              test: /[\\/]node_modules[\\/](react-hook-form|@hookform)[\\/]/,
              priority: 27,
              enforce: true,
              reuseExistingChunk: true,
            },
            // Utilities - date-fns, clsx, etc.
            utils: {
              name: 'utils',
              test: /[\\/]node_modules[\\/](date-fns|clsx|class-variance-authority|tailwind-merge|zod)[\\/]/,
              priority: 25,
              enforce: true,
              reuseExistingChunk: true,
            },
            // Supabase and AI clients
            services: {
              name: 'services',
              test: /[\\/]node_modules[\\/](@supabase|@google\/gen)[\\/]/,
              priority: 23,
              enforce: true,
              reuseExistingChunk: true,
            },
            // Other vendor libraries
            vendor: {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              priority: 20,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            // Common shared code across pages
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };

      // Performance budgets
      config.performance = {
        maxEntrypointSize: 512000, // 512 KB
        maxAssetSize: 512000, // 512 KB
        hints: 'warning',
      };
    }

    return config;
  },
};

export default withBundleAnalyzer(withSentryConfig(nextConfig, {
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
}));