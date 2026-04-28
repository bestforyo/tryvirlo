import { getUser } from "@/lib/auth/supabase";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

// Check if database is configured
const isDatabaseConfigured = () => {
  const url = process.env.DATABASE_URL
  return url && !url.includes('user:password@localhost')
}

export default async function GenerationsPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // Demo generations when database is not configured
  const demoGenerations = [
    {
      id: '1',
      type: 'TEXT_TO_VIDEO',
      prompt: 'Sunset over mountains with golden light and peaceful atmosphere',
      modelId: 'sora-2-pro',
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      resultUrl: null
    },
    {
      id: '2',
      type: 'TEXT_TO_IMAGE',
      prompt: 'Cyberpunk city at night with neon lights reflecting on wet streets',
      modelId: 'flux-pro',
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      resultUrl: null
    },
    {
      id: '3',
      type: 'IMAGE_TO_VIDEO',
      prompt: 'Product showcase with smooth camera movement and professional lighting',
      modelId: 'pollo-3.0',
      status: 'PROCESSING',
      createdAt: new Date(Date.now() - 10 * 60 * 1000),
      resultUrl: null
    },
    {
      id: '4',
      type: 'TEXT_TO_VIDEO',
      prompt: 'Abstract art with flowing colors and dynamic transitions',
      modelId: 'veo-3.1',
      status: 'FAILED',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      errorMessage: 'Provider timeout'
    }
  ]

  let generations: any[] = demoGenerations

  if (isDatabaseConfigured()) {
    try {
      generations = await prisma.generation.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 100
      })
    } catch {
      // Fall back to demo data
    }
  }

  return (
    <div className="container mx-auto px-6 py-20">
      {/* Breadcrumb */}
      <div className="text-sm text-[#9CA3AF] mb-4">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        {' > '}
        <span className="text-white">Generations</span>
      </div>

      {/* Demo Notice */}
      {!isDatabaseConfigured() && (
        <div className="mb-6 p-4 rounded-xl bg-[rgba(255,193,7,0.1)] border border-[rgba(255,193,7,0.3)] text-[#FFC107] text-sm">
          🎭 Demo Mode: Showing example generations. Configure DATABASE_URL to see your real generations.
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Generation History</h1>
          <p className="text-[#9CA3AF]">{generations.length} generations</p>
        </div>

        <div className="flex items-center gap-3">
          <select className="glass rounded-lg px-4 py-2 bg-transparent text-white border-0 outline-none">
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>

          <select className="glass rounded-lg px-4 py-2 bg-transparent text-white border-0 outline-none">
            <option value="all">All Types</option>
            <option value="TEXT_TO_VIDEO">Text to Video</option>
            <option value="IMAGE_TO_VIDEO">Image to Video</option>
            <option value="TEXT_TO_IMAGE">Text to Image</option>
            <option value="VIDEO_UPSCALE">Video Upscale</option>
          </select>
        </div>
      </div>

      {/* Generations List */}
      {generations.length > 0 ? (
        <div className="space-y-3">
          {generations.map((generation: any) => (
            <GenerationRow key={generation.id} generation={generation} />
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-xl font-semibold text-white mb-2">No generations yet</h3>
          <p className="text-[#9CA3AF] mb-6">
            Start creating amazing videos and images
          </p>
          <Link
            href="/text-to-video"
            className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-[#FF4081] to-[#E91E63] text-white font-semibold hover:translate-y-[-2px] hover:shadow-glow transition-all"
          >
            Start Creating
          </Link>
        </div>
      )}
    </div>
  );
}

function GenerationRow({ generation }: { generation: any }) {
  const typeConfig: Record<string, { emoji: string; label: string }> = {
    TEXT_TO_VIDEO: { emoji: '🎬', label: 'Text to Video' },
    IMAGE_TO_VIDEO: { emoji: '🎥', label: 'Image to Video' },
    TEXT_TO_IMAGE: { emoji: '🖼️', label: 'Text to Image' },
    VIDEO_UPSCALE: { emoji: '✨', label: 'Video Upscale' }
  };

  const statusConfig: Record<string, { label: string; className: string }> = {
    COMPLETED: { label: 'Completed', className: 'bg-[rgba(16,185,129,0.2)] text-[#10B981]' },
    PROCESSING: { label: 'Processing', className: 'bg-[rgba(59,130,246,0.2)] text-[#3B82F6]' },
    PENDING: { label: 'Queued', className: 'bg-[rgba(251,191,36,0.2)] text-[#FBBF24]' },
    FAILED: { label: 'Failed', className: 'bg-[rgba(239,68,68,0.2)] text-[#EF4444]' },
    CANCELLED: { label: 'Cancelled', className: 'bg-[rgba(156,163,175,0.2)] text-[#9CA3AF]' },
    TIMEOUT: { label: 'Timeout', className: 'bg-[rgba(239,68,68,0.2)] text-[#EF4444]' }
  };

  const typeInfo = typeConfig[generation.type] || { emoji: '📁', label: generation.type };
  const statusInfo = statusConfig[generation.status] || statusConfig.PENDING;

  return (
    <div className="glass rounded-xl p-4 flex items-center gap-4 hover:bg-white/5 transition-all">
      {/* Type Icon */}
      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-2xl flex-shrink-0">
        {typeInfo.emoji}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="text-white font-medium truncate">
          {generation.prompt.slice(0, 60)}{generation.prompt.length > 60 ? '...' : ''}
        </div>
        <div className="flex items-center gap-3 text-sm text-[#9CA3AF]">
          <span>{typeInfo.label}</span>
          <span>•</span>
          <span>{generation.modelId}</span>
          <span>•</span>
          <span>{formatTimeAgo(generation.createdAt)}</span>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
          {statusInfo.label}
        </span>

        {generation.status === 'COMPLETED' && generation.resultUrl && (
          <div className="flex items-center gap-2">
            <a
              href={generation.resultUrl}
              target="_blank"
              rel="noopener"
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#9CA3AF] transition-colors"
              title="View"
            >
              👁️
            </a>
            <a
              href={generation.resultUrl}
              download
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#9CA3AF] transition-colors"
              title="Download"
            >
              ⬇️
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}
