/**
 * Payment Webhook Handler
 * POST /api/webhooks/payment
 * Handles webhooks from Creem.io
 */

import { NextRequest, NextResponse } from 'next/server';
import { creemPayment } from '@/lib/payment/creemio';
import { prisma } from '@/lib/db';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Get headers
    const headersList = await headers();
    const signature = headersList.get('x-creem-signature') || '';
    const webhookSecret = process.env.CREEMIO_WEBHOOK_SECRET || '';

    // Get raw body
    const rawBody = await request.text();

    // Verify signature
    if (!creemPayment.verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse webhook event
    const event = creemPayment.parseWebhook(rawBody);

    if (!event) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.event) {
      case 'checkout.completed':
      case 'subscription.created':
        await handleSubscriptionCreated(event);
        break;

      case 'subscription.updated':
        await handleSubscriptionUpdated(event);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event);
        break;

      case 'payment.failed':
        await handlePaymentFailed(event);
        break;

      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    // Log webhook
    await prisma.webhookLog.create({
      data: {
        provider: 'CREEMIO',
        eventType: event.event,
        payload: rawBody,
        processed: true
      }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle subscription created/checkout completed
 */
async function handleSubscriptionCreated(event: any) {
  const { customer_id, plan_id, metadata, id } = event.data;

  if (!metadata?.userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  const basePlan = creemPayment.mapPlan(plan_id);
  const credits = creemPayment.getCreditsForPlan(basePlan);

  // Map base plan to schema enum (determine monthly/yearly from plan_id)
  const isYearly = plan_id?.includes('yearly');
  const plan = `${basePlan}_${isYearly ? 'YEARLY' : 'MONTHLY'}` as any;

  await prisma.$transaction([
    // Create subscription (using providerSubscriptionId as unique key)
    prisma.subscription.upsert({
      where: { providerSubscriptionId: id },
      create: {
        userId: metadata.userId,
        provider: 'CREEMIO',
        providerSubscriptionId: id,
        providerCustomerId: customer_id,
        plan: plan,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      update: {
        providerCustomerId: customer_id,
        plan: plan,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    }),

    // Update user plan
    prisma.user.update({
      where: { id: metadata.userId },
      data: { plan }
    }),

    // Grant initial credits
    prisma.user.update({
      where: { id: metadata.userId },
      data: {
        creditsBalance: { increment: credits }
      }
    }),

    // Log credit transaction
    prisma.creditsTransaction.create({
      data: {
        userId: metadata.userId,
        amount: credits,
        type: 'SUBSCRIPTION',
        referenceId: id,
        description: `Initial credits - ${plan} plan`
      }
    })
  ]);
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(event: any) {
  const { id, plan_id, status } = event.data;

  const subscription = await prisma.subscription.findFirst({
    where: { providerSubscriptionId: id }
  });

  if (!subscription) {
    console.error('Subscription not found for update');
    return;
  }

  const basePlan = creemPayment.mapPlan(plan_id);
  const isYearly = plan_id?.includes('yearly');
  const plan = `${basePlan}_${isYearly ? 'YEARLY' : 'MONTHLY'}` as any;

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      plan,
      status: status === 'active' ? 'ACTIVE' : status.toUpperCase()
    }
  });
}

/**
 * Handle subscription cancelled
 */
async function handleSubscriptionCancelled(event: any) {
  const { id } = event.data;

  const subscription = await prisma.subscription.findFirst({
    where: { providerSubscriptionId: id }
  });

  if (!subscription) {
    console.error('Subscription not found for cancellation');
    return;
  }

  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELED',
        cancelAtPeriodEnd: true
      }
    }),
    prisma.user.update({
      where: { id: subscription.userId },
      data: { plan: 'FREE' }
    })
  ]);
}

/**
 * Handle payment failed
 */
async function handlePaymentFailed(event: any) {
  const { id } = event.data;

  const subscription = await prisma.subscription.findFirst({
    where: { providerSubscriptionId: id }
  });

  if (!subscription) {
    console.error('Subscription not found for payment failure');
    return;
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'PAST_DUE'
    }
  });
}
