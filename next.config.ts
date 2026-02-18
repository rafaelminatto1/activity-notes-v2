import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    useCache: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "*.firebasestorage.app",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_FIRESTORE_FORCE_LONG_POLLING: "true",
  },
};

export default nextConfig;
