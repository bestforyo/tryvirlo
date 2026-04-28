import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0D0D0D] py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#FF4081] to-[#E91E63] flex items-center justify-center">
                <span className="text-white font-bold text-sm">TV</span>
              </div>
              <span className="text-lg font-bold text-white">tryvirlo</span>
            </div>
            <p className="text-sm text-[#9CA3AF]">
              All AI Models, One Subscription
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li><Link href="/text-to-video" className="text-sm text-[#9CA3AF] hover:text-[#FF4081] transition-colors">Text to Video</Link></li>
              <li><Link href="/image-to-video" className="text-sm text-[#9CA3AF] hover:text-[#FF4081] transition-colors">Image to Video</Link></li>
              <li><Link href="/text-to-image" className="text-sm text-[#9CA3AF] hover:text-[#FF4081] transition-colors">Text to Image</Link></li>
              <li><Link href="/pricing" className="text-sm text-[#9CA3AF] hover:text-[#FF4081] transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-[#9CA3AF] hover:text-[#FF4081] transition-colors">About</Link></li>
              <li><Link href="/contact" className="text-sm text-[#9CA3AF] hover:text-[#FF4081] transition-colors">Contact</Link></li>
              <li><Link href="https://github.com/anthropics/tryvirlo" className="text-sm text-[#9CA3AF] hover:text-[#FF4081] transition-colors">GitHub</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/terms" className="text-sm text-[#9CA3AF] hover:text-[#FF4081] transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-sm text-[#9CA3AF] hover:text-[#FF4081] transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-[#9CA3AF]">
          <p>&copy; 2025 tryvirlo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
