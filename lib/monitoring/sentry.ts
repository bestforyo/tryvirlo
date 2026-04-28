/**
 * Sentry Error Tracking Configuration
 * @sentry/nextjs is optional - only installs in production
 */

// Stub implementation when Sentry is not installed
const stubSentry = {
  init: () => {},
  captureException: () => {},
  captureMessage: () => {},
  setUser: () => {}
};

let Sentry: any = stubSentry;

const SENTRY_DSN = process.env.SENTRY_DSN;
const isEnabled = !!SENTRY_DSN && process.env.NODE_ENV === 'production';

// Lazy initialization - only import Sentry when actually enabled
if (isEnabled) {
  // We'll initialize this at runtime to avoid build-time errors
  // @ts-ignore - Optional dependency
  import('@sentry/nextjs').then((mod: any) => {
    Sentry = mod;

    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
      beforeSend(event: any, hint: any) {
        // Filter out sensitive data
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers;
        }

        // Filter out specific error types
        if (event.exception) {
          const error = hint.originalException as any;

          // Don't report validation errors
          if (error?.name === 'ZodError') {
            return null;
          }

          // Don't report 404s
          if (error?.statusCode === 404) {
            return null;
          }
        }

        return event;
      }
    });
  }).catch(() => {
    // Sentry not installed, that's fine
    Sentry = stubSentry;
  });
}

export { Sentry };

/**
 * Capture error with context
 */
export function captureError(error: Error, context?: Record<string, any>) {
  if (isEnabled && Sentry.captureException) {
    Sentry.captureException(error, {
      extra: context
    });
  } else {
    console.error('Error:', error, context);
  }
}

/**
 * Capture message
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (isEnabled && Sentry.captureMessage) {
    Sentry.captureMessage(message, level);
  } else {
    const consoleMethod = level === 'warning' ? 'warn' : level;
    (console as any)[consoleMethod]('Message:', message);
  }
}

/**
 * Set user context
 */
export function setUserContext(user: { id: string; email?: string; plan?: string }) {
  if (isEnabled && Sentry.setUser) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      plan: user.plan
    });
  }
}
