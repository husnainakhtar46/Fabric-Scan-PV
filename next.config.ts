import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow using environment variables in server components
  serverExternalPackages: ['googleapis'],
  allowedDevOrigins: ['192.168.10.140'],
  
};

export default nextConfig;
