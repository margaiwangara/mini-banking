import * as Sentry from '@sentry/node';

/**
 * Initialize Sentry for error tracking and performance monitoring
 * Only initializes if SENTRY_DSN is provided in environment variables
 */
export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';

  if (!dsn) {
    console.log('⚠️  Sentry DSN not provided, error tracking disabled');
    return;
  }

  // Try to include profiling integration, but make it optional
  let integrations: any[] = [];
  
  try {
    // Only include profiling if the module is available and native bindings work
    const { ProfilingIntegration } = require('@sentry/profiling-node');
    integrations.push(new ProfilingIntegration());
  } catch (error) {
    // Profiling not available (native bindings missing or module not installed)
    // This is fine - we'll just use error tracking and performance monitoring without profiling
    console.log('⚠️  Sentry profiling not available, continuing without it');
  }

  const config: Sentry.NodeOptions = {
    dsn,
    environment,
    // Performance Monitoring
    tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
      ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE)
      : environment === 'production'
      ? 0.1
      : 1.0,
  };

  // Only add profiling config if profiling integration is available
  if (integrations.length > 0) {
    config.integrations = integrations;
    config.profilesSampleRate = process.env.SENTRY_PROFILES_SAMPLE_RATE
      ? parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE)
      : environment === 'production'
      ? 0.1
      : 1.0;
  }

  Sentry.init(config);

  console.log('✅ Sentry initialized for error tracking');
}
