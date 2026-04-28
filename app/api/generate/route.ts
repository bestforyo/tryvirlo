import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { prisma } from '@/lib/db';
import { calculateCredits } from '@/lib/utils/credits';
import { GenerationHandler } from '@/lib/workers/generation-handler';
import { z } from 'zod';

const generationSchema = z.object({
  type: z.enum(['TEXT_TO_VIDEO', 'IMAGE_TO_VIDEO', 'TEXT_TO_IMAGE', 'VIDEO_UPSCALE']),
  modelId: z.string().min(1),
  prompt: z.string().min(10).max(1000),
  parameters: z.object({
    duration: z.number().int().refine(v => [5, 10, 15].includes(v), { message: 'Duration must be 5, 10, or 15' }).optional(),
    quality: z.enum(['720p', '1080p', '4K']).optional(),
    aspectRatio: z.enum(['16:9', '9:16', '1:1']).optional(),
    negativePrompt: z.string().max(500).optional(),
    seed: z.number().int().optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = generationSchema.parse(body);

    const { type, modelId, prompt, parameters } = validatedData;

    // Get model from database
    const model = await prisma.model.findUnique({
      where: { id: modelId, isActive: true }
    });

    if (!model) {
      return NextResponse.json(
        { error: 'Model not found or inactive', available: [] },
        { status: 400 }
      );
    }

    // Calculate credits required
    const duration = parameters.duration || 10;
    const quality = parameters.quality || '1080p';
    const creditsRequired = calculateCredits(type, duration, quality);

    // Check user credits
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { creditsBalance: true, plan: true }
    });

    if (!userData || userData.creditsBalance < creditsRequired) {
      return NextResponse.json(
        {
          error: 'INSUFFICIENT_CREDITS',
          required: creditsRequired,
          available: userData?.creditsBalance || 0
        },
        { status: 402 }
      );
    }

    // Check concurrent generations
    const activeGenerations = await prisma.generation.count({
      where: {
        userId: user.id,
        status: { in: ['PENDING', 'PROCESSING'] }
      }
    });

    const maxConcurrent: Record<string, number> = {
      'FREE': 1,
      'LITE': 2,
      'PRO': 3,
      'ENTERPRISE': 5
    };

    if (activeGenerations >= (maxConcurrent[userData.plan] || 1)) {
      return NextResponse.json(
        {
          error: 'TOO_MANY_CONCURRENT',
          limit: maxConcurrent[userData.plan] || 1,
          current: activeGenerations
        },
        { status: 429 }
      );
    }

    // Create generation record
    const generation = await prisma.generation.create({
      data: {
        userId: user.id,
        provider: model.provider,
        modelId,
        type,
        prompt,
        parameters,
        status: 'PENDING',
        creditsConsumed: creditsRequired,
        startedAt: new Date()
      }
    });

    // Deduct credits
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { creditsBalance: { decrement: creditsRequired } }
      }),
      prisma.creditsTransaction.create({
        data: {
          userId: user.id,
          amount: -creditsRequired,
          type: 'GENERATION',
          referenceId: generation.id,
          description: `${type} - ${model.name}`
        }
      })
    ]);

    // Submit generation job (async, don't await)
    GenerationHandler.submit({
      generationId: generation.id,
      modelId,
      type,
      params: {
        prompt,
        negativePrompt: parameters.negativePrompt,
        duration: parameters.duration,
        quality: parameters.quality,
        aspectRatio: parameters.aspectRatio,
        seed: parameters.seed
      }
    }).catch(error => {
      console.error('Generation submission error:', error);
    });

    const estimatedTime = GenerationHandler.getEstimatedTime(modelId, {
      prompt,
      duration: parameters.duration,
      quality: parameters.quality
    });

    return NextResponse.json({
      id: generation.id,
      status: 'PENDING',
      creditsConsumed: creditsRequired,
      estimatedTime,
      createdAt: generation.createdAt
    });

  } catch (error: any) {
    console.error('Generation error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'INVALID_INPUT', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
