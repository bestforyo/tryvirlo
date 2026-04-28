import { getUser } from "@/lib/auth/supabase";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

// Check if database is configured
const isDatabaseConfigured = () => {
  const url = process.env.DATABASE_URL
  return url && !url.includes('user:password@localhost')
}

export default async function AssetsPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // Demo assets when database is not configured
  const demoAssets = [
    {
      id: '1',
      type: 'VIDEO',
      originalFilename: 'sunset-over-mountains.mp4',
      fileSize: 2.5 * 1024 * 1024,
      previewUrl: null,
      storageUrl: null,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: '2',
      type: 'IMAGE',
      originalFilename: 'cyberpunk-city.jpg',
      fileSize: 0.8 * 1024 * 1024,
      previewUrl: null,
      storageUrl: null,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
    },
    {
      id: '3',
      type: 'VIDEO',
      originalFilename: 'product-showcase.mp4',
      fileSize: 3.2 * 1024 * 1024,
      previewUrl: null,
      storageUrl: null,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  ]

  let assets = demoAssets

  if (isDatabaseConfigured()) {
    try {
      assets = await prisma.asset.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 50
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
        <span className="text-white">My Assets</span>
      </div>

      {/* Demo Notice */}
      {!isDatabaseConfigured() && (
        <div className="mb-6 p-4 rounded-xl bg-[rgba(255,193,7,0.1)] border border-[rgba(255,193,7,0.3)] text-[#FFC107] text-sm">
          🎭 Demo Mode: Showing example assets. Configure DATABASE_URL to see your real assets.
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">My Assets</h1>
          <p className="text-[#9CA3AF]">{assets.length} items stored</p>
        </div>

        <div className="flex items-center gap-3">
          <select className="glass rounded-lg px-4 py-2 bg-transparent text-white border-0 outline-none">
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="largest">Largest Files</option>
          </select>

          <select className="glass rounded-lg px-4 py-2 bg-transparent text-white border-0 outline-none">
            <option value="all">All Types</option>
            <option value="video">Videos</option>
            <option value="image">Images</option>
          </select>
        </div>
      </div>

      {/* Assets Grid */}
      {assets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {assets.map((asset: any) => (
            <AssetCard
              key={asset.id}
              asset={asset}
            />
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-xl font-semibold text-white mb-2">No assets yet</h3>
          <p className="text-[#9CA3AF] mb-6">
            Your generated videos and images will appear here
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

function AssetCard({ asset }: { asset: any }) {
  const isVideo = asset.type === 'VIDEO';
  const sizeInMB = (asset.fileSize / (1024 * 1024)).toFixed(1);

  return (
    <div className="glass rounded-xl overflow-hidden group hover:bg-white/5 transition-all">
      {/* Preview */}
      <div className="aspect-video bg-white/5 relative">
        {asset.previewUrl ? (
          <img
            src={asset.previewUrl}
            alt={asset.originalFilename}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {isVideo ? '🎬' : '🖼️'}
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          {asset.storageUrl ? (
            <>
              <a
                href={asset.storageUrl}
                target="_blank"
                rel="noopener"
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                title="View"
              >
                👁️
              </a>
              <a
                href={asset.storageUrl}
                download
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                title="Download"
              >
                ⬇️
              </a>
            </>
          ) : (
            <div className="text-sm text-white px-4">Demo Asset</div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="text-white font-medium truncate mb-1">
          {asset.originalFilename || `Asset ${asset.id.slice(0, 8)}`}
        </div>
        <div className="flex items-center justify-between text-sm text-[#9CA3AF]">
          <span>{isVideo ? 'Video' : 'Image'}</span>
          <span>{sizeInMB} MB</span>
        </div>
        <div className="text-xs text-[#9CA3AF] mt-2">
          {new Date(asset.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
