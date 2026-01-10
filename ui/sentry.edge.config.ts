import * as Sentry from '@sentry/nextjs';

/**
 * Sentry edge runtime configuration
 * Only initializes if SENTRY_DSN is provided
 */
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
  });
}
