import { getUser } from "@/lib/auth/supabase";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

// Check if we have proper database connection
const isDatabaseConfigured = () => {
  const url = process.env.DATABASE_URL
  return url && !url.includes('user:password@localhost')
}

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // Demo mode data when database is not configured
  const demoData = {
    creditsBalance: 1250,
    plan: 'PRO',
    subscriptions: [{
      plan: 'PRO',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }],
    recentGenerations: [
      {
        id: '1',
        type: 'TEXT_TO_VIDEO',
        prompt: 'Sunset over mountains with golden light',
        modelId: 'sora-2-pro',
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: '2',
        type: 'TEXT_TO_IMAGE',
        prompt: 'Cyberpunk city at night with neon lights',
        modelId: 'flux-pro',
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
      },
      {
        id: '3',
        type: 'IMAGE_TO_VIDEO',
        prompt: 'Product showcase with smooth camera movement',
        modelId: 'pollo-3.0',
        status: 'PROCESSING',
        createdAt: new Date(Date.now() - 10 * 60 * 1000)
      }
    ],
    assetCount: 156,
    monthlyGenerationCount: 48
  }

  let userData, recentGenerations, assetCount, monthlyGenerationCount

  if (isDatabaseConfigured()) {
    // Fetch real data from database
    userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        creditsBalance: true,
        plan: true,
        subscriptions: {
          select: {
            plan: true,
            status: true,
            currentPeriodEnd: true
          }
        }
      }
    }).catch(() => demoData)

    recentGenerations = await prisma.generation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        type: true,
        prompt: true,
        modelId: true,
        status: true,
        createdAt: true,
        completedAt: true
      }
    }).catch(() => demoData.recentGenerations)

    assetCount = await prisma.asset.count({
      where: { userId: user.id }
    }).catch(() => demoData.assetCount)

    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    monthlyGenerationCount = await prisma.generation.count({
      where: {
        userId: user.id,
        createdAt: { gte: currentMonth }
      }
    }).catch(() => demoData.monthlyGenerationCount)
  } else {
    // Use demo data
    userData = demoData
    recentGenerations = demoData.recentGenerations
    assetCount = demoData.assetCount
    monthlyGenerationCount = demoData.monthlyGenerationCount
  }

  // Get plan details
  const subscription = userData?.subscriptions?.[0]
  const plan = subscription?.plan || userData?.plan || 'FREE'
  const creditsBalance = userData?.creditsBalance || 0
  const maxCredits = plan === 'FREE' ? 100 : plan === 'LITE' ? 500 : plan === 'PRO' ? 2000 : 10000

  // Calculate progress percentage
  const progress = Math.min((creditsBalance / maxCredits) * 100, 100)

  return (
    <div className="container mx-auto px-6 py-20">
      {!isDatabaseConfigured() && (
        <div className="mb-6 p-4 rounded-xl bg-[rgba(255,193,7,0.1)] border border-[rgba(255,193,7,0.3)] text-[#FFC107] text-sm">
          🎭 Demo Mode: Configure DATABASE_URL and NEXT_PUBLIC_SUPABASE_URL in .env to use real data.
        </div>
      )}

      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {(user as any).name || 'User'}
          </h1>
          <p className="text-[#9CA3AF]">Manage your creations and credits</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon="💳"
            label="Credits"
            value={creditsBalance.toLocaleString()}
            subtext={`of ${maxCredits.toLocaleString()} this month`}
            progress={progress}
          />
          <StatsCard
            icon="⭐"
            label="Plan"
            value={plan.charAt(0) + plan.slice(1).toLowerCase()}
            subtext={subscription?.currentPeriodEnd
              ? `Renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
              : 'Free plan'}
          />
          <StatsCard
            icon="⚡"
            label="Generations"
            value={monthlyGenerationCount.toString()}
            subtext="this month"
          />
          <StatsCard
            icon="📁"
            label="Assets"
            value={assetCount.toString()}
            subtext="total stored"
          />
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <QuickActionCard
              icon="📝"
              label="Text to Video"
              href="/text-to-video"
            />
            <QuickActionCard
              icon="🖼️"
              label="Image to Video"
              href="/image-to-video"
            />
            <QuickActionCard
              icon="🎨"
              label="Text to Image"
              href="/text-to-image"
            />
            <QuickActionCard
              icon="💾"
              label="My Assets"
              href="/assets"
            />
          </div>
        </div>

        {/* Recent Generations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Generations</h2>
            <a href="/generations" className="text-sm text-[#FF4081] hover:underline">
              View All →
            </a>
          </div>
          <div className="space-y-3">
            {recentGenerations.length > 0 ? (
              recentGenerations.map((gen: any) => (
                <GenerationItem
                  key={gen.id}
                  emoji={gen.type.includes('VIDEO') ? '🎬' : '🖼️'}
                  title={gen.prompt.slice(0, 50) + (gen.prompt.length > 50 ? '...' : '')}
                  model={gen.modelId}
                  time={formatTimeAgo(gen.createdAt)}
                  status={gen.status}
                />
              ))
            ) : (
              <div className="glass rounded-xl p-8 text-center text-[#9CA3AF]">
                No generations yet. Start creating!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatsCard({
  icon,
  label,
  value,
  subtext,
  progress
}: {
  icon: string
  label: string
  value: string | number
  subtext?: string
  progress?: number
}) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-8 h-8 rounded-lg bg-[rgba(255,64,129,0.1)] flex items-center justify-center text-lg">
          {icon}
        </div>
      </div>

      <div>
        <div className="text-sm text-[#9CA3AF] mb-1">{label}</div>
        <div className="text-2xl font-bold text-white">{value}</div>
        {subtext && (
          <div className="text-xs text-[#9CA3AF]">{subtext}</div>
        )}
      </div>

      {typeof progress === 'number' && (
        <div className="mt-4">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FF4081] to-[#E91E63]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function QuickActionCard({
  icon,
  label,
  href
}: {
  icon: string
  label: string
  href: string
}) {
  return (
    <a
      href={href}
      className="glass rounded-xl p-4 text-center hover:bg-white/8 transition-all cursor-pointer"
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-sm font-medium text-white">{label}</div>
    </a>
  )
}

function GenerationItem({
  emoji,
  title,
  model,
  time,
  status
}: {
  emoji: string
  title: string
  model: string
  time: string
  status?: string
}) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    COMPLETED: { label: '✓ completed', className: 'bg-[rgba(16,185,129,0.2)] text-[#10B981]' },
    PROCESSING: { label: '⏳ processing', className: 'bg-[rgba(59,130,246,0.2)] text-[#3B82F6]' },
    PENDING: { label: '⏸ queued', className: 'bg-[rgba(251,191,36,0.2)] text-[#FBBF24]' },
    FAILED: { label: '✗ failed', className: 'bg-[rgba(239,68,68,0.2)] text-[#EF4444]' }
  }

  const statusInfo = status ? statusConfig[status] || statusConfig.PENDING : null

  return (
    <div className="glass rounded-xl p-4 flex items-center gap-4 hover:bg-white/8 transition-all">
      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-2xl flex-shrink-0">
        {emoji}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-white font-medium truncate">{title}</div>
        <div className="text-sm text-[#9CA3AF]">
          {model} • {time}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {statusInfo && (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        )}
        {status === 'COMPLETED' && (
          <button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#9CA3AF] transition-colors">
            ⬇️
          </button>
        )}
      </div>
    </div>
  )
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(date).toLocaleDateString()
}
