/**
 * Sentry Error Tracking Configuration
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const isEnabled = !!SENTRY_DSN && process.env.NODE_ENV === 'production';

if (isEnabled) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    beforeSend(event, hint) {
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
}

export { Sentry };

/**
 * Capture error with context
 */
export function captureError(error: Error, context?: Record<string, any>) {
  if (isEnabled) {
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
  if (isEnabled) {
    Sentry.captureMessage(message, level);
  } else {
    console[level]('Message:', message);
  }
}

/**
 * Set user context
 */
export function setUserContext(user: { id: string; email?: string; plan?: string }) {
  if (isEnabled) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      plan: user.plan
    });
  }
}
