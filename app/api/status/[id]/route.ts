import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { prisma } from '@/lib/db';
import { GenerationHandler } from '@/lib/workers/generation-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: generationId } = await params;

    const generation = await prisma.generation.findUnique({
      where: { id: generationId }
    });

    if (!generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
    }

    // Verify ownership
    if (generation.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Return generation status
    // TODO: Poll actual AI provider for real-time status
    let progress = 0;
    let message = '';

    switch (generation.status) {
      case 'PENDING':
        progress = 0;
        message = 'Queued...';
        break;
      case 'PROCESSING':
        progress = 45;
        message = 'Generating frames...';
        break;
      case 'COMPLETED':
        progress = 100;
        message = 'Completed';
        break;
      case 'FAILED':
        progress = 0;
        message = 'Failed';
        break;
      case 'CANCELLED':
        progress = 0;
        message = 'Cancelled';
        break;
      case 'TIMEOUT':
        progress = 0;
        message = 'Timeout';
        break;
    }

    return NextResponse.json({
      id: generation.id,
      status: generation.status,
      resultUrl: generation.resultUrl,
      previewUrl: generation.resultUrl?.replace('.mp4', '-preview.jpg'),
      progress,
      message,
      error: generation.errorMessage,
      creditsRefunded: generation.status === 'FAILED' ? generation.creditsConsumed : undefined,
      completedAt: generation.completedAt
    });

  } catch (error: any) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to cancel generation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: generationId } = await params;

    const generation = await prisma.generation.findUnique({
      where: { id: generationId }
    });

    if (!generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
    }

    // Verify ownership
    if (generation.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow cancel if pending
    if (generation.status !== 'PENDING') {
      return NextResponse.json(
        {
          error: 'CANNOT_CANCEL',
          reason: 'Generation already processing'
        },
        { status: 400 }
      );
    }

    // Cancel via generation handler
    const cancelled = await GenerationHandler.cancel(generationId);

    if (!cancelled) {
      return NextResponse.json(
        { error: 'Failed to cancel generation' },
        { status: 500 }
      );
    }

    // Refund credits
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { creditsBalance: { increment: generation.creditsConsumed! } }
      }),
      prisma.creditsTransaction.create({
        data: {
          userId: user.id,
          amount: generation.creditsConsumed!,
          type: 'REFUND_GENERATION',
          referenceId: generationId,
          description: 'Cancelled generation refund'
        }
      })
    ]);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Cancel error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
