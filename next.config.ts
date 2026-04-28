import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.tryvirlo.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudflarestorage.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['tryvirlo.com', 'www.tryvirlo.com'],
    },
  },
};

export default nextConfig;
