/**
 * Health Check Endpoint
 * GET /api/health
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: 'healthy' | 'unhealthy';
    providers: 'healthy' | 'degraded' | 'unhealthy';
    storage: 'healthy' | 'unhealthy';
  };
}

export async function GET(request: NextRequest) {
  const checks: {
    database: 'healthy' | 'unhealthy';
    providers: 'healthy' | 'degraded' | 'unhealthy';
    storage: 'healthy' | 'unhealthy';
  } = {
    database: 'healthy',
    providers: 'healthy',
    storage: 'healthy'
  };

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error('Database health check failed:', error);
    checks.database = 'unhealthy';
  }

  // Check providers (basic check - verify API keys exist)
  const providers = ['PIAPI', 'GRSAI', 'PIC2API', 'APIMART', 'APIPOD'];
  const availableProviders = providers.filter(p => process.env[`${p}_API_KEY`]);

  if (availableProviders.length === 0) {
    checks.providers = 'unhealthy';
  } else if (availableProviders.length < 3) {
    checks.providers = 'degraded';
  }

  // Check storage (R2)
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID) {
    checks.storage = 'unhealthy';
  }

  // Determine overall status
  const allHealthy = Object.values(checks).every(c => c === 'healthy');
  const anyUnhealthy = Object.values(checks).some(c => c === 'unhealthy');

  const status: HealthStatus = {
    status: anyUnhealthy ? 'unhealthy' : allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks
  };

  // Return appropriate status code
  const statusCode = anyUnhealthy ? 503 : allHealthy ? 200 : 200;

  return NextResponse.json(status, { status: statusCode });
}
