import { PrismaClient } from '@prisma/client';
import { vi, afterEach } from 'vitest';

// Mock environment variables for testing
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/tryvirlo_test';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-secret';
process.env.CREEMIO_API_KEY = 'test-creemio-key';
process.env.PIAPI_API_KEY = 'test-piapi-key';
process.env.GRSAI_API_KEY = 'test-grsai-key';
process.env.PIC2API_API_KEY = 'test-pic2api-key';
process.env.APIMART_API_KEY = 'test-apimart-key';
process.env.APIPOD_API_KEY = 'test-apipod-key';
process.env.R2_ACCOUNT_ID = 'test-r2-account';
process.env.R2_ACCESS_KEY_ID = 'test-r2-key';
process.env.R2_SECRET_ACCESS_KEY = 'test-r2-secret';
process.env.CRON_SECRET = 'test-cron-secret';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Mock Prisma Client for unit tests (no database needed)
const mockPrisma = {
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn()
  },
  generation: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn()
  },
  creditsTransaction: {
    create: vi.fn(),
    findMany: vi.fn(),
    deleteMany: vi.fn()
  },
  asset: {
    create: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn()
  },
  subscription: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  $transaction: vi.fn(),
  $queryRaw: vi.fn()
};

// Global test utilities
(globalThis as any).prisma = mockPrisma;

// For integration tests that need real database, create real client
let realPrisma: PrismaClient | null = null;

export function getTestPrisma(): PrismaClient {
  if (!realPrisma) {
    realPrisma = new PrismaClient();
  }
  return realPrisma;
}

// Cleanup after each test (only for integration tests)
afterEach(async () => {
  // Only cleanup if we have a real database connection
  if (realPrisma) {
    try {
      await realPrisma.creditsTransaction.deleteMany({});
      await realPrisma.generation.deleteMany({});
      await realPrisma.asset.deleteMany({});
      await realPrisma.subscription.deleteMany({});
      await realPrisma.user.deleteMany({});
    } catch (error) {
      // Database not available, skip cleanup
    }
  }
});
