import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['tesseract.js', 'sharp'],
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
