// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isProduction = process.env.NODE_ENV === 'production';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Define how likely traces are sampled. Lower in production to reduce overhead.
  tracesSampleRate: isProduction ? 0.1 : 1.0,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Disable sending user PII in production for privacy
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: !isProduction,

  // Set environment
  environment: process.env.NODE_ENV || 'development',

  // Filter sensitive data and group build-related errors
  beforeSend(event) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }

    // Custom error fingerprinting for better grouping
    const errorMessage = event.exception?.values?.[0]?.value || '';
    const errorType = event.exception?.values?.[0]?.type || '';

    // Group webpack missing module errors
    if (errorMessage.includes('Cannot find module') || errorMessage.includes('MODULE_NOT_FOUND')) {
      event.fingerprint = ['webpack-missing-module'];
      event.tags = {
        ...event.tags,
        error_category: 'webpack_cache',
        build_corruption: 'true',
      };
    }

    // Group manifest file errors
    if (errorMessage.includes('manifest.json') || errorMessage.includes('ENOENT')) {
      event.fingerprint = ['missing-manifest-file'];
      event.tags = {
        ...event.tags,
        error_category: 'build_artifacts',
        build_corruption: 'true',
      };
    }

    // Group webpack bootstrap errors
    if (errorMessage.includes('webpack/bootstrap') || errorMessage.includes('__webpack_require__')) {
      event.fingerprint = ['webpack-bootstrap-error'];
      event.tags = {
        ...event.tags,
        error_category: 'webpack_runtime',
        build_corruption: 'true',
      };
    }

    // Group module resolution errors
    if (errorType === 'TypeError' && errorMessage.includes('Cannot read properties of undefined')) {
      event.fingerprint = ['module-resolution-error'];
      event.tags = {
        ...event.tags,
        error_category: 'module_resolution',
        build_corruption: 'true',
      };
    }

    return event;
  },
});
