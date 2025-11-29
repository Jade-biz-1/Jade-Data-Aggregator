/**
 * Sentry Integration for Frontend Error Tracking
 * Next.js client and server-side error monitoring
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Initialize Sentry for client-side
 */
export function initSentryClient() {
  const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!SENTRY_DSN) {
    console.warn('SENTRY_DSN not configured - Sentry error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
    release: `data-aggregator-frontend@${process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}`,

    // Performance monitoring
    tracesSampleRate: getTracesSampleRate(),
    tracePropagationTargets: [
      'localhost',
      /^\//,
      process.env.NEXT_PUBLIC_API_URL || '',
    ],

    // Integrations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Filtering
    beforeSend(event, hint) {
      return beforeSendHook(event, hint);
    },

    beforeBreadcrumb(breadcrumb, hint) {
      return beforeBreadcrumbHook(breadcrumb, hint);
    },

    // Ignore specific errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'originalPrompt',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'atomicFindClose',

      // Network errors that are expected
      'NetworkError',
      'Non-Error promise rejection captured',

      // React hydration errors (expected in development)
      'Hydration failed',
      'There was an error while hydrating',
    ],

    // Don't report certain URLs
    denyUrls: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
    ],
  });
}

/**
 * Initialize Sentry for server-side
 */
export function initSentryServer() {
  const SENTRY_DSN = process.env.SENTRY_DSN;

  if (!SENTRY_DSN) {
    console.warn('SENTRY_DSN not configured - Sentry error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.ENVIRONMENT || 'development',
    release: `data-aggregator-frontend@${process.env.APP_VERSION || '1.0.0'}`,

    // Performance monitoring
    tracesSampleRate: getTracesSampleRate(),

    // Node.js specific
    integrations: [
      Sentry.httpIntegration(),
    ],

    // Filtering
    beforeSend(event, hint) {
      return beforeSendHook(event, hint);
    },
  });
}

/**
 * Get traces sample rate based on environment
 */
function getTracesSampleRate(): number {
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.ENVIRONMENT || 'development';

  switch (environment) {
    case 'production':
      return 0.1; // 10% of transactions
    case 'staging':
      return 0.5; // 50% of transactions
    default:
      return 1.0; // 100% in development
  }
}

/**
 * Before send hook to filter and modify events
 */
function beforeSendHook(event: Sentry.ErrorEvent, hint: Sentry.EventHint): Sentry.ErrorEvent | null {
  // Don't send events in development unless explicitly enabled
  if (
    (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' || process.env.ENVIRONMENT === 'development') &&
    process.env.NEXT_PUBLIC_SENTRY_DEV_ENABLED !== 'true'
  ) {
    return null;
  }

  // Add custom context
  event.contexts = event.contexts || {};
  event.contexts.custom = {
    app_name: 'Data Aggregator Platform',
    component: 'frontend',
  };

  // Filter sensitive data from request
  const request = event.request;
  if (request) {
    // Remove sensitive headers
    if (request.headers) {
      const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
      sensitiveHeaders.forEach(header => {
        if (request.headers?.[header]) {
          request.headers[header] = '[REDACTED]';
        }
      });
    }

    // Remove sensitive data from body
    if (request.data && typeof request.data === 'object') {
      const sensitiveFields = ['password', 'token', 'secret', 'api_key', 'creditCard'];
      sensitiveFields.forEach(field => {
        if ((request.data as any)?.[field]) {
          (request.data as any)[field] = '[REDACTED]';
        }
      });
    }
  }

  // Filter sensitive data from extra
  if (event.extra) {
    const sensitiveKeys = ['password', 'token', 'secret', 'api_key'];
    Object.keys(event.extra).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        event.extra![key] = '[REDACTED]';
      }
    });
  }

  return event;
}

/**
 * Before breadcrumb hook to filter breadcrumbs
 */
function beforeBreadcrumbHook(breadcrumb: Sentry.Breadcrumb, hint?: Sentry.BreadcrumbHint): Sentry.Breadcrumb | null {
  // Don't log console breadcrumbs in production
  if (breadcrumb.category === 'console' && process.env.NEXT_PUBLIC_ENVIRONMENT === 'production') {
    return null;
  }

  // Don't log fetch breadcrumbs for health checks
  if (breadcrumb.category === 'fetch' && breadcrumb.data?.url?.includes('/health')) {
    return null;
  }

  return breadcrumb;
}

/**
 * Set user context
 */
export function setUser(userId: string, email?: string, username?: string) {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUser() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(message: string, category: string, level: Sentry.SeverityLevel = 'info', data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
    }
    Sentry.captureException(error);
  });
}

/**
 * Capture message manually
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
    }
    Sentry.captureMessage(message, level);
  });
}

/**
 * Set tags
 */
export function setTags(tags: Record<string, string>) {
  Sentry.setTags(tags);
}

/**
 * Set context
 */
export function setContext(name: string, context: Record<string, any>) {
  Sentry.setContext(name, context);
}

/**
 * Start performance transaction
 */
export function startTransaction(name: string, op: string) {
  const span = Sentry.startInactiveSpan({ name, op });
  return {
    finish: () => span.end(),
    ...span,
  };
}

/**
 * Track page view
 */
export function trackPageView(pageName: string, properties?: Record<string, any>) {
  addBreadcrumb(`Page view: ${pageName}`, 'navigation', 'info', properties);
}

/**
 * Track user action
 */
export function trackUserAction(action: string, properties?: Record<string, any>) {
  addBreadcrumb(action, 'user', 'info', properties);
}

/**
 * Track API call
 */
export function trackApiCall(endpoint: string, method: string, status: number, duration: number) {
  addBreadcrumb(
    `API ${method} ${endpoint}`,
    'http',
    status >= 400 ? 'error' : 'info',
    {
      endpoint,
      method,
      status,
      duration,
    }
  );
}

/**
 * Error boundary fallback component
 */
export function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" >
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6" >
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full" >
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        < h2 className="mt-4 text-center text-2xl font-bold text-gray-900" >
          Something went wrong
        </h2>

        < p className="mt-2 text-center text-sm text-gray-600" >
          We've been notified and are working on a fix.
        </p>

        {
          process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' && (
            <pre className="mt-4 p-4 bg-gray-100 rounded text-xs overflow-auto" >
              {error.message}
            </pre>
          )
        }

        <div className="mt-6 flex gap-3" >
          <button
            onClick={resetError}
            className="flex-1 bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
          < button
            onClick={() => window.location.href = '/'
            }
            className="flex-1 bg-gray-200 text-gray-700 rounded-md px-4 py-2 hover:bg-gray-300 transition-colors"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}
