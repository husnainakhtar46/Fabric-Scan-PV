import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow using environment variables in server components
  serverExternalPackages: ['googleapis'],
};

export default nextConfig;
