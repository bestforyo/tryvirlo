/**
 * Generation Handler
 * Orchestrates the video/image generation workflow
 */

import { prisma } from '@/lib/db';
import { providerRouter } from '@/lib/providers/router';
import { GenerationParams } from '@/lib/providers/base';
import { r2Storage } from '@/lib/storage/r2';

interface GenerationJob {
  generationId: string;
  modelId: string;
  type: string;
  params: GenerationParams;
}

export class GenerationHandler {
  /**
   * Submit a new generation job
   */
  static async submit(job: GenerationJob): Promise<void> {
    const { generationId, modelId, type, params } = job;

    // Get provider for model
    const provider = providerRouter.getProviderForModel(modelId);

    if (!provider) {
      await this.failGeneration(
        generationId,
        'No provider available for this model'
      );
      return;
    }

    try {
      // Validate parameters
      provider.validateParams(modelId, type, params);

      // Submit to provider
      const jobId = await provider.submitGeneration(modelId, type, params);

      // Update generation record with job ID
      await prisma.generation.update({
        where: { id: generationId },
        data: {
          jobId: jobId,
          status: 'PROCESSING'
        }
      });

      // Start polling for completion (in production, use background job)
      this.pollStatus(generationId, provider, jobId);
    } catch (error: any) {
      await this.failGeneration(generationId, error.message);
    }
  }

  /**
   * Poll for generation status
   */
  private static async pollStatus(
    generationId: string,
    provider: any,
    jobId: string,
    maxAttempts: number = 30
  ): Promise<void> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        const status = await provider.checkStatus(jobId);

        if (status.status === 'COMPLETED' && status.result) {
          await this.completeGeneration(generationId, status.result);
          return;
        }

        if (status.status === 'FAILED') {
          await this.failGeneration(generationId, status.error || 'Generation failed');
          return;
        }

        // Update progress - progress tracking is done via status polling
        if (status.status === 'PROCESSING') {
          // Progress is calculated client-side based on status
          // In production, you might want to add a progress field to the schema
        }
      } catch (error: any) {
        console.error(`Polling error for ${generationId}:`, error);
      }
    }

    // Timeout
    await this.failGeneration(generationId, 'Generation timeout');
  }

  /**
   * Mark generation as completed
   */
  private static async completeGeneration(
    generationId: string,
    resultUrl: string
  ): Promise<void> {
    const generation = await prisma.generation.findUnique({
      where: { id: generationId },
      select: { userId: true, type: true }
    });

    if (!generation) {
      return;
    }

    const assetType = ['TEXT_TO_VIDEO', 'IMAGE_TO_VIDEO', 'VIDEO_UPSCALE'].includes(generation.type)
      ? 'video'
      : 'image';

    const uploadResult = await r2Storage.uploadFromUrl(
      generation.userId,
      resultUrl,
      assetType === 'video' ? 'video' : 'image'
    );

    if (!uploadResult.success || !uploadResult.url) {
      await this.failGeneration(
        generationId,
        `Failed to store generated asset in R2: ${uploadResult.error || 'Unknown error'}`
      );
      return;
    }

    const fileSize = uploadResult.size ? BigInt(uploadResult.size) : undefined;

    await prisma.$transaction([
      prisma.generation.update({
        where: { id: generationId },
        data: {
          status: 'COMPLETED',
          resultUrl: uploadResult.url,
          resultStorageKey: uploadResult.key,
          fileSize,
          completedAt: new Date()
        }
      }),
      prisma.asset.create({
        data: {
          userId: generation.userId,
          generationId,
          type: assetType === 'video' ? 'VIDEO' : 'IMAGE',
          storageKey: uploadResult.key,
          storageProvider: 'r2',
          fileSize,
          metadata: {
            sourceUrl: resultUrl,
            storageUrl: uploadResult.url,
            assetType
          }
        }
      })
    ]);
  }

  /**
   * Mark generation as failed and refund credits
   */
  private static async failGeneration(
    generationId: string,
    errorMessage: string
  ): Promise<void> {
    const generation = await prisma.generation.findUnique({
      where: { id: generationId },
      select: { userId: true, creditsConsumed: true }
    });

    if (!generation) return;

    await prisma.$transaction([
      // Update generation status
      prisma.generation.update({
        where: { id: generationId },
        data: {
          status: 'FAILED',
          errorMessage,
          completedAt: new Date()
        }
      }),
      // Refund credits
      prisma.user.update({
        where: { id: generation.userId },
        data: {
          creditsBalance: { increment: generation.creditsConsumed || 0 }
        }
      }),
      // Log refund transaction
      prisma.creditsTransaction.create({
        data: {
          userId: generation.userId,
          amount: generation.creditsConsumed || 0,
          type: 'REFUND_GENERATION',
          referenceId: generationId,
          description: `Failed generation refund: ${errorMessage}`
        }
      })
    ]);
  }

  /**
   * Cancel a pending generation
   */
  static async cancel(generationId: string): Promise<boolean> {
    const generation = await prisma.generation.findUnique({
      where: { id: generationId },
      select: { modelId: true, jobId: true, status: true }
    });

    if (!generation || generation.status !== 'PENDING') {
      return false;
    }

    const provider = providerRouter.getProviderForModel(generation.modelId);

    if (provider && generation.jobId) {
      const cancelled = await provider.cancelJob(generation.jobId);

      if (cancelled) {
        await prisma.generation.update({
          where: { id: generationId },
          data: { status: 'CANCELLED' }
        });
        return true;
      }
    }

    return false;
  }

  /**
   * Get estimated generation time
   */
  static getEstimatedTime(
    modelId: string,
    params: GenerationParams
  ): number {
    const provider = providerRouter.getProviderForModel(modelId);

    if (!provider) {
      return 45; // Default estimate
    }

    return provider.estimateTime(params);
  }
}
