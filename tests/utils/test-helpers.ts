import { PrismaClient } from '@prisma/client';

/**
 * Test utility functions
 */

export async function createTestUser(overrides: Partial<any> = {}) {
  const prisma = new PrismaClient();

  return prisma.user.create({
    data: {
      email: overrides.email || `test-${Date.now()}@example.com`,
      name: overrides.name || 'Test User',
      creditsBalance: overrides.creditsBalance ?? 1000,
      plan: overrides.plan || 'PRO',
      ...overrides
    }
  });
}

export async function createTestGeneration(userId: string, overrides: Partial<any> = {}) {
  const prisma = new PrismaClient();

  return prisma.generation.create({
    data: {
      userId,
      provider: overrides.provider || 'piapi',
      modelId: overrides.modelId || 'sora-2-pro',
      type: overrides.type || 'TEXT_TO_VIDEO',
      prompt: overrides.prompt || 'Test generation prompt',
      parameters: overrides.parameters || {},
      status: overrides.status || 'PENDING',
      creditsConsumed: overrides.creditsConsumed || 100,
      ...overrides
    }
  });
}

export async function createTestSubscription(userId: string, overrides: Partial<any> = {}) {
  const prisma = new PrismaClient();

  return prisma.subscription.create({
    data: {
      userId,
      provider: overrides.provider || 'CREEMIO',
      providerSubscriptionId: overrides.providerSubscriptionId || `sub_${Date.now()}`,
      providerCustomerId: overrides.providerCustomerId || `cus_${Date.now()}`,
      plan: overrides.plan || 'PRO',
      status: overrides.status || 'ACTIVE',
      currentPeriodStart: overrides.currentPeriodStart || new Date(),
      currentPeriodEnd: overrides.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ...overrides
    }
  });
}

export async function cleanupTestData(userId: string) {
  const prisma = new PrismaClient();

  await prisma.$transaction([
    prisma.creditsTransaction.deleteMany({ where: { userId } }),
    prisma.generation.deleteMany({ where: { userId } }),
    prisma.asset.deleteMany({ where: { userId } }),
    prisma.subscription.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } })
  ]);
}

export function mockAuth(user: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.name
  };
}

export const CREDIT_RATES = {
  TEXT_TO_VIDEO: {
    '720p': 5,
    '1080p': 10,
    '4K': 25
  },
  IMAGE_TO_VIDEO: {
    '720p': 3,
    '1080p': 6,
    '4K': 15
  },
  TEXT_TO_IMAGE: 5,
  VIDEO_UPSCALE: {
    '720p': 25,
    '1080p': 50,
    '4K': 100
  }
};

export function calculateExpectedCredits(
  type: string,
  duration: number,
  quality: string
): number {
  if (type === 'TEXT_TO_IMAGE') {
    return CREDIT_RATES.TEXT_TO_IMAGE;
  }

  if (type === 'VIDEO_UPSCALE') {
    return CREDIT_RATES.VIDEO_UPSCALE[quality as keyof typeof CREDIT_RATES.VIDEO_UPSCALE] || 50;
  }

  const rates = CREDIT_RATES[type as keyof typeof CREDIT_RATES];
  if (rates && typeof rates === 'object') {
    return duration * (rates[quality as keyof typeof rates] || 10);
  }

  return duration * 10;
}
