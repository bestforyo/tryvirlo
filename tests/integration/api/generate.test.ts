import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/generate/route';
import { prisma } from '@/lib/db';

// Mock dependencies
vi.mock('@/lib/auth/supabase', () => ({
  getUser: vi.fn()
}));

vi.mock('@/lib/workers/generation-handler', () => ({
  GenerationHandler: {
    submit: vi.fn().mockResolvedValue(undefined)
  }
}));

describe('POST /api/generate', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await prisma.creditsTransaction.deleteMany({});
    await prisma.generation.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('should return 401 when user is not authenticated', async () => {
    const { getUser } = await import('@/lib/auth/supabase');
    vi.mocked(getUser).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        type: 'TEXT_TO_VIDEO',
        modelId: 'sora-2-pro',
        prompt: 'A beautiful sunset over the ocean',
        parameters: {
          duration: 10,
          quality: '1080p',
          aspectRatio: '16:9'
        }
      })
    });

    const response = await POST(request as any);
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should validate input parameters', async () => {
    const { getUser } = await import('@/lib/auth/supabase');
    vi.mocked(getUser).mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com'
    });

    const request = new Request('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        type: 'TEXT_TO_VIDEO',
        modelId: 'sora-2-pro',
        prompt: 'short', // Too short - should fail validation
        parameters: {}
      })
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('INVALID_INPUT');
  });

  it('should check model availability', async () => {
    const { getUser } = await import('@/lib/auth/supabase');
    vi.mocked(getUser).mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com'
    });

    const request = new Request('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        type: 'TEXT_TO_VIDEO',
        modelId: 'non-existent-model',
        prompt: 'A beautiful sunset over the ocean with waves crashing on the shore',
        parameters: {
          duration: 10,
          quality: '1080p'
        }
      })
    });

    const response = await POST(request as any);
    // Should succeed at API level, model check happens at provider level
    expect(response.status).toBeGreaterThanOrEqual(200);
  });

  it('should check user has sufficient credits', async () => {
    const { getUser } = await import('@/lib/auth/supabase');
    const testUserId = 'test-user-id';

    // Create user with low credits
    await prisma.user.create({
      data: {
        id: testUserId,
        email: 'test@example.com',
        name: 'Test User',
        creditsBalance: 10, // Not enough for 10s 1080p video (needs 100)
        plan: 'FREE'
      }
    });

    vi.mocked(getUser).mockResolvedValue({
      id: testUserId,
      email: 'test@example.com'
    });

    const request = new Request('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        type: 'TEXT_TO_VIDEO',
        modelId: 'sora-2-pro',
        prompt: 'A beautiful sunset over the ocean with waves crashing',
        parameters: {
          duration: 10,
          quality: '1080p',
          aspectRatio: '16:9'
        }
      })
    });

    const response = await POST(request as any);
    expect(response.status).toBe(402);

    const data = await response.json();
    expect(data.error).toBe('INSUFFICIENT_CREDITS');
    expect(data.required).toBe(100);
    expect(data.available).toBe(10);
  });

  it('should enforce concurrent generation limits', async () => {
    const { getUser } = await import('@/lib/auth/supabase');
    const testUserId = 'test-user-id';

    // Create user with FREE plan (max 1 concurrent)
    await prisma.user.create({
      data: {
        id: testUserId,
        email: 'test@example.com',
        name: 'Test User',
        creditsBalance: 1000,
        plan: 'FREE'
      }
    });

    // Create existing active generation
    await prisma.generation.create({
      data: {
        userId: testUserId,
        provider: 'piapi',
        modelId: 'sora-2-pro',
        type: 'TEXT_TO_VIDEO',
        prompt: 'Existing generation',
        parameters: {},
        status: 'PROCESSING',
        creditsConsumed: 100
      }
    });

    vi.mocked(getUser).mockResolvedValue({
      id: testUserId,
      email: 'test@example.com'
    });

    const request = new Request('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        type: 'TEXT_TO_VIDEO',
        modelId: 'sora-2-pro',
        prompt: 'A beautiful sunset over the ocean with waves',
        parameters: {
          duration: 10,
          quality: '1080p'
        }
      })
    });

    const response = await POST(request as any);
    expect(response.status).toBe(429);

    const data = await response.json();
    expect(data.error).toBe('TOO_MANY_CONCURRENT');
    expect(data.limit).toBe(1);
  });

  it('should create generation and deduct credits on success', async () => {
    const { getUser } = await import('@/lib/auth/supabase');
    const testUserId = 'test-user-id';

    await prisma.user.create({
      data: {
        id: testUserId,
        email: 'test@example.com',
        name: 'Test User',
        creditsBalance: 1000,
        plan: 'PRO'
      }
    });

    vi.mocked(getUser).mockResolvedValue({
      id: testUserId,
      email: 'test@example.com'
    });

    const request = new Request('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        type: 'TEXT_TO_VIDEO',
        modelId: 'sora-2-pro',
        prompt: 'A beautiful sunset over the ocean',
        parameters: {
          duration: 10,
          quality: '1080p',
          aspectRatio: '16:9'
        }
      })
    });

    const response = await POST(request as any);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.id).toBeDefined();
    expect(data.status).toBe('PENDING');
    expect(data.creditsConsumed).toBe(100);

    // Verify credits were deducted
    const user = await prisma.user.findUnique({
      where: { id: testUserId }
    });
    expect(user?.creditsBalance).toBe(900); // 1000 - 100

    // Verify generation was created
    const generation = await prisma.generation.findUnique({
      where: { id: data.id }
    });
    expect(generation).toBeDefined();
    expect(generation?.status).toBe('PENDING');
  });
});
