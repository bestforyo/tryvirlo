import Link from "next/link";

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="min-h-[600px] flex flex-col items-center justify-center px-6 py-32 text-center relative">
        {/* Background gradient effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(255,64,129,0.15),transparent_70%)] blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(0,188,212,0.1),transparent_70%)] blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-8 animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-[#FF4081] to-[#E91E63] text-white mb-4">
            10+ AI Models, One Subscription
          </div>

          {/* Hero Title */}
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
            All AI Models, One Subscription
          </h1>

          {/* Hero Subtitle */}
          <p className="text-xl text-[#9CA3AF] max-w-2xl mx-auto">
            Generate videos and images with the best AI models
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/pricing"
              className="px-8 py-4 h-12 rounded-full bg-gradient-to-r from-[#FF4081] to-[#E91E63] text-white font-semibold hover:translate-y-[-2px] hover:shadow-glow transition-all duration-200"
            >
              Get Started Free
            </Link>
            <Link
              href="/text-to-video"
              className="px-8 py-4 h-12 rounded-full border border-white/20 text-white font-semibold hover:bg-white/5 transition-all duration-200"
            >
              Try Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Text to Video */}
          <Link href="/text-to-video">
            <ToolCard
              emoji="📝"
              title="Text to Video"
              description="Transform ideas into videos"
              models={4}
            />
          </Link>
          {/* Image to Video */}
          <Link href="/image-to-video">
            <ToolCard
              emoji="🖼️"
              title="Image to Video"
              description="Bring images to life"
              models={3}
            />
          </Link>
          {/* Text to Image */}
          <Link href="/text-to-image">
            <ToolCard
              emoji="🎨"
              title="Text to Image"
              description="Generate stunning images"
              models={4}
            />
          </Link>
          {/* Video Upscaler */}
          <Link href="/video-upscaler">
            <ToolCard
              emoji="⬆️"
              title="Video Upscaler"
              description="Enhance video quality"
              models={3}
            />
          </Link>
        </div>
      </section>

      {/* Value Props */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <ValueProp
            emoji="🔄"
            title="Multiple Models"
            description="Access 10+ AI models with one subscription"
          />
          <ValueProp
            emoji="💳"
            title="Simple Pricing"
            description="Credits-based system, use any model"
          />
          <ValueProp
            emoji="⚡"
            title="Fast Generation"
            description="No queues, instant results"
          />
        </div>
      </section>
    </>
  );
}

function ToolCard({ emoji, title, description, models }: {
  emoji: string;
  title: string;
  description: string;
  models: number;
}) {
  return (
    <div className="glass rounded-2xl p-6 hover:border-[rgba(255,64,129,0.3)] hover:translate-y-[-4px] hover:bg-white/8 transition-all duration-300 cursor-pointer h-full">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#FF4081] to-[#E91E63] flex items-center justify-center text-2xl mb-4">
        {emoji}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-[#9CA3AF] text-sm mb-4">{description}</p>
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[rgba(255,64,129,0.2)] text-[#FF4081]">
        {models} models
      </span>
    </div>
  );
}

function ValueProp({ emoji, title, description }: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center space-y-4">
      <div className="text-5xl">{emoji}</div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm text-[#9CA3AF]">{description}</p>
    </div>
  );
}
