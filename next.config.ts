import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['tesseract.js', 'sharp'],
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
    },
  },
  outputFileTracingIncludes: {
    '/**': [
      './eng.traineddata',
      './public/eng.traineddata',
      './public/tessdata/**/*',
    ],
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
