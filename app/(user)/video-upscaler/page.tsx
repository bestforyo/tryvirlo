"use client";

import Link from "next/link";

export default function VideoUpscalerPage() {
  return (
    <div className="container mx-auto px-6 py-20">
      {/* Breadcrumb */}
      <div className="text-sm text-[#9CA3AF] mb-4">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        {' > '}
        <Link href="/tools" className="hover:text-white transition-colors">Tools</Link>
        {' > '}
        <span className="text-white">Video Upscaler</span>
      </div>

      {/* Demo Notice */}
      <div className="mb-6 p-4 rounded-xl bg-[rgba(255,193,7,0.1)] border border-[rgba(255,193,7,0.3)] text-[#FFC107] text-sm">
        🎭 Demo Mode: This feature requires API keys. Configure APIPOD_API_KEY in .env to enable.
      </div>

      <div className="max-w-3xl mx-auto text-center space-y-8">
        <h1 className="text-4xl font-bold text-white mb-4">Video Upscaler</h1>
        <p className="text-xl text-[#9CA3AF]">
          Enhance your videos to 4K resolution with AI
        </p>

        <div className="glass rounded-2xl p-12 space-y-6">
          <div className="text-6xl">📺 ➔ 🎬</div>
          <h2 className="text-2xl font-semibold text-white">Coming Soon</h2>
          <p className="text-[#9CA3AF]">
            Upscale your videos to higher resolutions while maintaining quality.
          </p>
          <div className="text-sm text-[#9CA3AF] space-y-2">
            <p>• 720p → 1080p upscaling</p>
            <p>• 1080p → 4K upscaling</p>
            <p>• AI-powered enhancement</p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-[#FF4081] to-[#E91E63] text-white font-semibold hover:translate-y-[-2px] hover:shadow-glow transition-all"
          >
            View Pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
