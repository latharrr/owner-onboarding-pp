import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Strict mode for development
  reactStrictMode: true,

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  // Allowed origins for hot-module reloading in dev
  allowedDevOrigins: ['192.168.31.100', '192.168.31.100:3001', 'localhost:3001'],
};

export default nextConfig;
