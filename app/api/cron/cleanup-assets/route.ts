/**
 * Cron Job: Cleanup Assets
 * Called by Vercel Cron daily at 2 AM UTC
 * Endpoint: /api/cron/cleanup-assets
 */

import { NextRequest, NextResponse } from 'next/server';
import { cleanupAssets } from '@/lib/jobs/cleanup-assets';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await cleanupAssets();

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Asset cleanup cron error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
