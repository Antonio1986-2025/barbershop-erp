import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.4', '192.168.1.6'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
      {
        source: '/health',
        destination: 'http://localhost:3001/health',
      },
    ];
  },
};

export default nextConfig;