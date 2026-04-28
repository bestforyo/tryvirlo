/**
 * Create Subscription Checkout
 * POST /api/subscription/create
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { creemPayment } from '@/lib/payment/creemio';
import { z } from 'zod';

const createCheckoutSchema = z.object({
  plan: z.enum(['LITE', 'PRO', 'ENTERPRISE']),
  billingCycle: z.enum(['monthly', 'yearly'])
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createCheckoutSchema.parse(body);

    const { plan, billingCycle } = validatedData;

    // Create checkout session
    const result = await creemPayment.createCheckout({
      userId: user.id,
      userEmail: user.email || '',
      plan,
      billingCycle,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=cancelled`
    });

    if (!result.success || !result.checkoutUrl) {
      return NextResponse.json(
        { error: result.error || 'Failed to create checkout' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: result.checkoutUrl,
      sessionId: result.sessionId
    });

  } catch (error: any) {
    console.error('Create checkout error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
