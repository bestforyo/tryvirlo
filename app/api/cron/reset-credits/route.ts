/**
 * Cron Job: Reset Credits
 * Called by Vercel Cron daily at midnight UTC
 * Endpoint: /api/cron/reset-credits
 */

import { NextRequest, NextResponse } from 'next/server';
import { resetCredits } from '@/lib/jobs/reset-credits';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await resetCredits();

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Credit reset cron error:', error);
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
