"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export function Navbar() {
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    setIsDemoMode(true); // Demo mode by default
  }, []);

  return (
    <>
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="bg-[rgba(255,193,7,0.2)] border-b border-[rgba(255,193,7,0.3)] text-[#FFC107] text-sm py-2 px-4 text-center">
          🎭 Demo Mode - Configure environment variables to enable full functionality
        </div>
      )}

      <nav className="border-b border-white/10 bg-[#0D0D0D]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#FF4081] to-[#E91E63] flex items-center justify-center">
                <span className="text-white font-bold text-sm">TV</span>
              </div>
              <span className="text-xl font-bold text-white">tryvirlo</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-[#E5E5E5] hover:text-[#FF4081] transition-colors text-sm font-medium">Home</Link>
              <Link href="/pricing" className="text-[#E5E5E5] hover:text-[#FF4081] transition-colors text-sm font-medium">Pricing</Link>
              <Link href="/text-to-video" className="text-[#E5E5E5] hover:text-[#FF4081] transition-colors text-sm font-medium">Tools</Link>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login" className="text-[#E5E5E5] hover:text-white transition-colors text-sm font-medium">Sign In</Link>
              <Link href="/pricing" className="px-4 py-2 rounded-full bg-gradient-to-r from-[#FF4081] to-[#E91E63] text-white text-sm font-semibold hover:translate-y-[-2px] hover:shadow-glow transition-all">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
