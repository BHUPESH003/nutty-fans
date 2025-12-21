import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // React strict mode for development
  reactStrictMode: true,

  // Optimize production builds
  poweredByHeader: false,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd12yj2uf2lejnl.cloudfront.net',
        pathname: '/**',
      },
      // Add allowed image domains here as needed
    ],
  },

  // Typed routes for type-safe navigation
  typedRoutes: true,

  // Security headers (basic set)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
