import * as Sentry from '@sentry/nextjs';

/**
 * Sentry server-side configuration
 * Only initializes if SENTRY_DSN is provided
 */
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
      ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE)
      : process.env.NODE_ENV === 'production'
      ? 0.1
      : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: process.env.NODE_ENV === 'development' && !!process.env.SENTRY_DEBUG,
  });
}
