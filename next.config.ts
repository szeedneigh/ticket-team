import {withSentryConfig} from '@sentry/nextjs';
import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,
  
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
    // Development-specific optimizations
    if (dev) {
      // Enhanced cache config with proper file locking to prevent race conditions
      config.cache = {
        type: 'filesystem',
        cacheDirectory: path.resolve(process.cwd(), '.next/cache/webpack'),
        name: `${nextRuntime ?? (isServer ? 'node' : 'client')}-development`,
        // Use 'pack' store for proper file locking and atomic operations
        store: 'pack',
        version: '1',
        compression: 'gzip',
        // Build dependencies for automatic cache invalidation
        buildDependencies: {
          config: [__filename],
        },
        idleTimeout: 60000,
        idleTimeoutAfterLargeChanges: 1000,
        idleTimeoutForInitialStore: 0,
        maxMemoryGenerations: 3,
        memoryCacheUnaffected: true,
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