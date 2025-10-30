// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://e240a1b4305d13f3be5bd37797261f40@o4510273786806272.ingest.us.sentry.io/4510273815052288",

  // Add optional integrations for additional features
  integrations: [
    Sentry.replayIntegration(),
  ],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Custom error fingerprinting for better grouping
  beforeSend(event) {
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

    // Group chunk loading errors
    if (errorMessage.includes('ChunkLoadError') || errorMessage.includes('Loading chunk')) {
      event.fingerprint = ['chunk-load-error'];
      event.tags = {
        ...event.tags,
        error_category: 'chunk_loading',
        build_corruption: 'true',
      };
    }

    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;