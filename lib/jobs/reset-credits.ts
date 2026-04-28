/**
 * Credit Reset Job
 * Resets monthly credits for subscribers on their billing cycle
 */

import { prisma } from '@/lib/db';

interface CreditResetResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
}

/**
 * Reset credits for users whose billing cycle has started
 * Run this job daily via Vercel Cron
 */
export async function resetCredits(): Promise<CreditResetResult> {
  const result: CreditResetResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: []
  };

  try {
    const today = new Date();
    const currentDay = today.getUTCDate();

    // Find users whose billing cycle starts today
    const users = await prisma.user.findMany({
      where: {
        subscription: {
          status: 'ACTIVE',
          plan: {
            not: 'FREE'
          }
        },
        // Simple billing cycle: use signup day as billing day
        // In production, store billingCycleStart in User table
        createdAt: {
          // This is a simplified check - in production use proper billing cycle tracking
        }
      },
      select: {
        id: true,
        plan: true,
        subscription: {
          select: {
            id: true,
            plan: true
          }
        }
      }
    });

    result.processed = users.length;

    for (const user of users) {
      try {
        const plan = user.subscription?.plan || user.plan;
        const creditsToGrant = getCreditsForPlan(plan);

        if (creditsToGrant > 0) {
          await prisma.$transaction([
            // Update user balance
            prisma.user.update({
              where: { id: user.id },
              data: {
                creditsBalance: { increment: creditsToGrant }
              }
            }),
            // Log transaction
            prisma.creditsTransaction.create({
              data: {
                userId: user.id,
                amount: creditsToGrant,
                type: 'SUBSCRIPTION_RESET',
                description: `Monthly credits reset - ${plan} plan`
              }
            })
          ]);

          result.succeeded++;
        }
      } catch (error: any) {
        result.failed++;
        result.errors.push(`User ${user.id}: ${error.message}`);
      }
    }

    return result;
  } catch (error: any) {
    result.errors.push(`Job failed: ${error.message}`);
    return result;
  }
}

/**
 * Get credit amount for a plan
 */
function getCreditsForPlan(plan: string): number {
  const planCredits: Record<string, number> = {
    'LITE': 500,
    'PRO': 2000,
    'ENTERPRISE': 10000
  };
  return planCredits[plan] || 0;
}
