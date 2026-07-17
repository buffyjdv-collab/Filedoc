import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel handles the build output, no standalone mode needed
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  reactStrictMode: true,
};

export default nextConfig;
