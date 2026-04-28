import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, DELETE } from '@/app/api/status/[id]/route';
import { prisma } from '@/lib/db';

// Mock dependencies
vi.mock('@/lib/auth/supabase', () => ({
  getUser: vi.fn()
}));

vi.mock('@/lib/workers/generation-handler', () => ({
  GenerationHandler: {
    cancel: vi.fn()
  }
}));

describe('GET /api/status/[id]', () => {
  let testUserId: string;
  let testGenerationId: string;

  beforeEach(async () => {
    // Clean up
    await prisma.generation.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user and generation
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        creditsBalance: 1000,
        plan: 'PRO'
      }
    });
    testUserId = user.id;

    const generation = await prisma.generation.create({
      data: {
        userId: testUserId,
        provider: 'piapi',
        modelId: 'sora-2-pro',
        type: 'TEXT_TO_VIDEO',
        prompt: 'A beautiful sunset',
        parameters: {},
        status: 'PROCESSING',
        creditsConsumed: 100
      }
    });
    testGenerationId = generation.id;
  });

  it('should return 401 when user is not authenticated', async () => {
    const { getUser } = await import('@/lib/auth/supabase');
    vi.mocked(getUser).mockResolvedValue(null);

    const request = new Request(`http://localhost:3000/api/status/${testGenerationId}`);
    const response = await GET(request as any, { params: { id: testGenerationId } });

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent generation', async () => {
    const { getUser } = await import('@/lib/auth/supabase');
    vi.mocked(getUser).mockResolvedValue({ id: testUserId, email: 'test@example.com' });

    const request = new Request('http://localhost:3000/api/status/non-existent-id');
    const response = await GET(request as any, { params: { id: 'non-existent-id' } });

    expect(response.status).toBe(404);
  });

  it('should return 403 when user does not own the generation', async () => {
    const otherUser = await prisma.user.create({
      data: {
        email: 'other@example.com',
        name: 'Other User',
        creditsBalance: 100,
        plan: 'FREE'
      }
    });

    const { getUser } = await import('@/lib/auth/supabase');
    vi.mocked(getUser).mockResolvedValue({ id: otherUser.id, email: 'other@example.com' });

    const request = new Request(`http://localhost:3000/api/status/${testGenerationId}`);
    const response = await GET(request as any, { params: { id: testGenerationId } });

    expect(response.status).toBe(403);
  });

  it('should return generation status with progress', async () => {
    const { getUser } = await import('@/lib/auth/supabase');
    vi.mocked(getUser).mockResolvedValue({ id: testUserId, email: 'test@example.com' });

    const request = new Request(`http://localhost:3000/api/status/${testGenerationId}`);
    const response = await GET(request as any, { params: { id: testGenerationId } });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.id).toBe(testGenerationId);
    expect(data.status).toBe('PROCESSING');
    expect(data.progress).toBeDefined();
    expect(data.message).toBeDefined();
  });

  it('should return different messages for different statuses', async () => {
    const { getUser } = await import('@/lib/auth/supabase');
    vi.mocked(getUser).mockResolvedValue({ id: testUserId, email: 'test@example.com' });

    // Test COMPLETED status
    await prisma.generation.update({
      where: { id: testGenerationId },
      data: {
        status: 'COMPLETED',
        resultUrl: 'https://example.com/result.mp4'
      }
    });

    const request = new Request(`http://localhost:3000/api/status/${testGenerationId}`);
    const response = await GET(request as any, { params: { id: testGenerationId } });

    const data = await response.json();
    expect(data.status).toBe('COMPLETED');
    expect(data.progress).toBe(100);
    expect(data.message).toBe('Completed');
    expect(data.resultUrl).toBe('https://example.com/result.mp4');
  });

  it('should generate preview URL from result URL', async () => {
    const { getUser } = await import('@/lib/auth/supabase');
    vi.mocked(getUser).mockResolvedValue({ id: testUserId, email: 'test@example.com' });

    await prisma.generation.update({
      where: { id: testGenerationId },
      data: {
        status: 'COMPLETED',
        resultUrl: 'https://storage.example.com/videos/result.mp4'
      }
    });

    const request = new Request(`http://localhost:3000/api/status/${testGenerationId}`);
    const response = await GET(request as any, { params: { id: testGenerationId } });

    const data = await response.json();
    expect(data.previewUrl).toBe('https://storage.example.com/videos/result-preview.jpg');
  });
});

describe('DELETE /api/status/[id] (Cancel)', () => {
  let testUserId: string;
  let testGenerationId: string;

  beforeEach(async () => {
    await prisma.generation.deleteMany({});
    await prisma.user.deleteMany({});

    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        creditsBalance: 1000,
        plan: 'PRO'
      }
    });
    testUserId = user.id;

    const generation = await prisma.generation.create({
      data: {
        userId: testUserId,
        provider: 'piapi',
        modelId: 'sora-2-pro',
        type: 'TEXT_TO_VIDEO',
        prompt: 'A beautiful sunset',
        parameters: {},
        status: 'PENDING',
        creditsConsumed: 100
      }
    });
    testGenerationId = generation.id;
  });

  it('should cancel a pending generation and refund credits', async () => {
    const { getUser } = await import('@/lib/auth/supabase');
    vi.mocked(getUser).mockResolvedValue({ id: testUserId, email: 'test@example.com' });

    const { GenerationHandler } = await import('@/lib/workers/generation-handler');
    vi.mocked(GenerationHandler.cancel).mockResolvedValue(true);

    const request = new Request(`http://localhost:3000/api/status/${testGenerationId}`, {
      method: 'DELETE'
    });
    const response = await DELETE(request as any, { params: { id: testGenerationId } });

    expect(response.status).toBe(200);

    // Verify generation was cancelled
    const generation = await prisma.generation.findUnique({
      where: { id: testGenerationId }
    });
    expect(generation?.status).toBe('CANCELLED');

    // Verify credits were refunded
    const user = await prisma.user.findUnique({
      where: { id: testUserId }
    });
    expect(user?.creditsBalance).toBe(1100); // 1000 + 100 refund

    // Verify transaction was logged
    const transaction = await prisma.creditsTransaction.findFirst({
      where: {
        userId: testUserId,
        type: 'REFUND_GENERATION',
        referenceId: testGenerationId
      }
    });
    expect(transaction).toBeDefined();
    expect(transaction?.amount).toBe(100);
  });

  it('should not allow cancelling processing generations', async () => {
    const { getUser } = await import('@/lib/auth/supabase');
    vi.mocked(getUser).mockResolvedValue({ id: testUserId, email: 'test@example.com' });

    await prisma.generation.update({
      where: { id: testGenerationId },
      data: { status: 'PROCESSING' }
    });

    const request = new Request(`http://localhost:3000/api/status/${testGenerationId}`, {
      method: 'DELETE'
    });
    const response = await DELETE(request as any, { params: { id: testGenerationId } });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('CANNOT_CANCEL');
  });

  it('should return 401 for unauthenticated requests', async () => {
    const { getUser } = await import('@/lib/auth/supabase');
    vi.mocked(getUser).mockResolvedValue(null);

    const request = new Request(`http://localhost:3000/api/status/${testGenerationId}`, {
      method: 'DELETE'
    });
    const response = await DELETE(request as any, { params: { id: testGenerationId } });

    expect(response.status).toBe(401);
  });
});
