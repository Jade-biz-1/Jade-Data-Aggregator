/**
 * OBS-002: Next.js instrumentation hook
 *
 * This file is the recommended way to run code on Next.js server startup
 * and to initialise Sentry for both the Node.js server runtime and the Edge
 * runtime.  It is loaded automatically by Next.js when
 * `experimental.instrumentationHook` is enabled in next.config.js (Next 13)
 * or unconditionally in Next 14+.
 *
 * The exports here must be named exactly `register` (called once on startup)
 * and optionally `onRequestError` (called for unhandled request errors).
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initSentryServer } = await import('./lib/sentry');
    initSentryServer();
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime uses the same client initialiser
    const { initSentryClient } = await import('./lib/sentry');
    initSentryClient();
  }
}
