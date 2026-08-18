import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['tesseract.js', 'sharp'],
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
      allowedOrigins: ['*.onrender.com', 'localhost:3000', 'localhost:3001'],
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
