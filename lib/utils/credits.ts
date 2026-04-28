// Credit rates per generation type and configuration
// Based on SPEC section 7.1

export const CREDIT_RATES = {
  'TEXT_TO_VIDEO': {
    '5s-720p': 25,
    '5s-1080p': 50,
    '10s-720p': 50,
    '10s-1080p': 100,
    '15s-720p': 75,
    '15s-1080p': 150
  },
  'IMAGE_TO_VIDEO': {
    '5s-720p': 15,
    '5s-1080p': 30
  },
  'TEXT_TO_IMAGE': {
    'standard': 5
  },
  'VIDEO_UPSCALE': {
    '720p-to-1080p': 50,
    '1080p-to-4k': 100
  }
} as const;

// Subscription plan credits
export const SUBSCRIPTION_CREDITS = {
  'LITE_MONTHLY': 500,
  'LITE_YEARLY': 6000, // 500 × 12
  'PRO_MONTHLY': 2000,
  'PRO_YEARLY': 24000, // 2000 × 12
  'ENTERPRISE_MONTHLY': -1 // Unlimited
} as const;

// Max concurrent generations per plan
export const MAX_CONCURRENT = {
  'FREE': 1,
  'LITE': 2,
  'PRO': 3,
  'ENTERPRISE': 5
} as const;

// Video file size estimates (in bytes)
export const FILE_SIZE_ESTIMATES = {
  '720p': {
    '5s': 0.6 * 1024 * 1024,    // ~0.6 MB
    '10s': 1.25 * 1024 * 1024,  // ~1.25 MB
    '15s': 1.875 * 1024 * 1024  // ~1.875 MB
  },
  '1080p': {
    '5s': 1.25 * 1024 * 1024,   // ~1.25 MB
    '10s': 2.5 * 1024 * 1024,   // ~2.5 MB
    '15s': 3.75 * 1024 * 1024   // ~3.75 MB
  }
} as const;

export type GenerationType = keyof typeof CREDIT_RATES;
export type SubscriptionPlan = keyof typeof SUBSCRIPTION_CREDITS;
export type Plan = 'FREE' | 'LITE' | 'PRO' | 'ENTERPRISE';

/**
 * Calculate credits required for a generation
 */
export function calculateCredits(
  type: GenerationType,
  duration: number,
  quality: string
): number {
  if (type === 'TEXT_TO_IMAGE') {
    return CREDIT_RATES[type]['standard'];
  }

  if (type === 'VIDEO_UPSCALE') {
    return CREDIT_RATES[type][`${quality}-to-4k` as keyof typeof CREDIT_RATES[typeof type]] ||
           CREDIT_RATES[type][`${quality}-to-1080p` as keyof typeof CREDIT_RATES[typeof type]] || 0;
  }

  const key = `${duration}s-${quality}` as keyof typeof CREDIT_RATES[typeof type];
  return CREDIT_RATES[type][key] || 0;
}

/**
 * Calculate estimated file size for a video
 */
export function calculateFileSize(
  duration: number,
  quality: '720p' | '1080p'
): number {
  // Base: ~1.25 MB per second for 1080p, ~0.6 MB per second for 720p
  const basePerSecond = quality === '1080p' ? 1.25 : 0.6;
  return Math.round(basePerSecond * duration * 1024 * 1024);
}

/**
 * Format credits for display
 */
export function formatCredits(credits: number): string {
  if (credits === -1) return 'Unlimited';
  return credits.toLocaleString();
}

/**
 * Check if user has sufficient credits
 */
export function hasSufficientCredits(
  balance: number,
  required: number
): boolean {
  return balance >= required;
}

/**
 * Calculate remaining credits after generation
 */
export function calculateRemainingCredits(
  balance: number,
  consumed: number
): number {
  return Math.max(0, balance - consumed);
}
