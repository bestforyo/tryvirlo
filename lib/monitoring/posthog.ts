/**
 * PostHog Analytics Configuration
 */

export interface PostHogEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
}

const POSTHOG_KEY = process.env.POSTHOG_KEY;
const POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://app.posthog.com';
const isEnabled = !!POSTHOG_KEY;

/**
 * Track event
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (isEnabled && typeof window !== 'undefined') {
    // Client-side tracking
    if ((window as any).posthog) {
      (window as any).posthog.capture(eventName, properties);
    }
  }
}

/**
 * Identify user
 */
export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (isEnabled && typeof window !== 'undefined') {
    if ((window as any).posthog) {
      (window as any).posthog.identify(userId, properties);
    }
  }
}

/**
 * Reset user (on logout)
 */
export function resetUser() {
  if (isEnabled && typeof window !== 'undefined') {
    if ((window as any).posthog) {
      (window as any).posthog.reset();
    }
  }
}

/**
 * Common event names
 */
export const Events = {
  // Authentication
  USER_SIGNED_UP: 'user_signed_up',
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_OUT: 'user_signed_out',

  // Generation
  GENERATION_STARTED: 'generation_started',
  GENERATION_COMPLETED: 'generation_completed',
  GENERATION_FAILED: 'generation_failed',
  GENERATION_CANCELLED: 'generation_cancelled',

  // Subscription
  SUBSCRIPTION_CHECKOUT_STARTED: 'subscription_checkout_started',
  SUBSCRIPTION_COMPLETED: 'subscription_completed',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',

  // Tools
  TOOL_OPENED: 'tool_opened',
  TOOL_SETTINGS_CHANGED: 'tool_settings_changed',

  // Assets
  ASSET_DOWNLOADED: 'asset_downloaded',
  ASSET_DELETED: 'asset_deleted',

  // Pricing
  PRICING_VIEWED: 'pricing_viewed',
  PRICING_CYCLE_CHANGED: 'pricing_cycle_changed'
};

/**
 * Track generation event
 */
export function trackGeneration(type: string, modelId: string, creditsCost: number) {
  trackEvent(Events.GENERATION_STARTED, {
    type,
    modelId,
    creditsCost
  });
}

/**
 * Track subscription event
 */
export function trackSubscription(plan: string, billingCycle: string) {
  trackEvent(Events.SUBSCRIPTION_CHECKOUT_STARTED, {
    plan,
    billingCycle
  });
}
