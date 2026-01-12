const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next.js 15 App Router optimizations
  experimental: {
    // Enable optimizations for App Router
    optimizePackageImports: ['@tanstack/react-query', 'react-hot-toast'],
  },
};

// Only wrap with Sentry if DSN is provided
const sentryWebpackPluginOptions = {
  silent: true, // Suppresses source map uploading logs during build
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Only upload source maps if Sentry is configured
  hideSourceMaps: !process.env.SENTRY_DSN,
};

// Conditionally apply Sentry configuration
module.exports =
  process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
    ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
    : nextConfig;
