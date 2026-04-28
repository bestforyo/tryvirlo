/**
 * Asset Cleanup Job
 * Deletes expired assets for free users and old generations
 */

import { prisma } from '@/lib/db';
import { r2Storage } from '@/lib/storage/r2';

interface CleanupResult {
  deletedAssets: number;
  deletedGenerations: number;
  freedSpace: number;
  errors: string[];
}

/**
 * Cleanup expired assets
 * - Free user assets expire after 7 days
 * - Failed generations are cleaned up after 30 days
 * Run this job daily via Vercel Cron
 */
export async function cleanupAssets(): Promise<CleanupResult> {
  const result: CleanupResult = {
    deletedAssets: 0,
    deletedGenerations: 0,
    freedSpace: 0,
    errors: []
  };

  try {
    const now = new Date();

    // 1. Find expired assets for free users (7 days old)
    const freeUserExpiryDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const expiredFreeUserAssets = await prisma.asset.findMany({
      where: {
        user: {
          plan: 'FREE'
        },
        createdAt: {
          lt: freeUserExpiryDate
        }
      },
      select: {
        id: true,
        storageKey: true,
        fileSize: true
      },
      take: 100 // Process in batches
    });

    // 2. Find old failed generations (30 days old)
    const failedGenExpiryDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const oldFailedGenerations = await prisma.generation.findMany({
      where: {
        status: 'FAILED',
        completedAt: {
          lt: failedGenExpiryDate
        }
      },
      select: {
        id: true
      },
      take: 100
    });

    // Delete expired assets
    for (const asset of expiredFreeUserAssets) {
      try {
        // Delete from R2
        if (asset.storageKey) {
          await r2Storage.delete(asset.storageKey);
        }

        // Delete from database
        await prisma.asset.delete({
          where: { id: asset.id }
        });

        result.deletedAssets++;
        result.freedSpace += Number(asset.fileSize || 0);
      } catch (error: any) {
        result.errors.push(`Asset ${asset.id}: ${error.message}`);
      }
    }

    // Delete old failed generations
    for (const gen of oldFailedGenerations) {
      try {
        await prisma.generation.delete({
          where: { id: gen.id }
        });

        result.deletedGenerations++;
      } catch (error: any) {
        result.errors.push(`Generation ${gen.id}: ${error.message}`);
      }
    }

    return result;
  } catch (error: any) {
    result.errors.push(`Cleanup failed: ${error.message}`);
    return result;
  }
}

/**
 * Get cleanup statistics
 */
export async function getCleanupStats(): Promise<{
  pendingDeletionAssets: number;
  pendingDeletionGenerations: number;
  estimatedFreeableSpace: number;
}> {
  const now = new Date();
  const freeUserExpiryDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const failedGenExpiryDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [expiredAssets, failedGens] = await Promise.all([
    prisma.asset.count({
      where: {
        user: {
          plan: 'FREE'
        },
        createdAt: {
          lt: freeUserExpiryDate
        }
      }
    }),
    prisma.generation.count({
      where: {
        status: 'FAILED',
        completedAt: {
          lt: failedGenExpiryDate
        }
      }
    })
  ]);

  // Estimate space
  const avgAssetSize = 50 * 1024 * 1024; // 50MB average
  const estimatedFreeableSpace = expiredAssets * avgAssetSize;

  return {
    pendingDeletionAssets: expiredAssets,
    pendingDeletionGenerations: failedGens,
    estimatedFreeableSpace
  };
}
