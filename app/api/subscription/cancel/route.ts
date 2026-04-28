/**
 * Cancel Subscription
 * POST /api/subscription/cancel
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { prisma } from '@/lib/db';
import { creemPayment } from '@/lib/payment/creemio';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscription
    const subscription = await prisma.subscription.findFirst({
      where: { userId: user.id, status: 'ACTIVE' }
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Cancel via Creem.io
    if (subscription.providerSubscriptionId) {
      const cancelled = await creemPayment.cancelSubscription(
        subscription.providerSubscriptionId
      );

      if (!cancelled) {
        return NextResponse.json(
          { error: 'Failed to cancel subscription with provider' },
          { status: 500 }
        );
      }
    }

    // Update local subscription status
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELED',
        cancelAtPeriodEnd: true
      }
    });

    // Downgrade user to free plan at period end
    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: 'FREE'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });

  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
