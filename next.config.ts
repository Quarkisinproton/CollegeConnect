import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
  // Default to the local Java backend which itself is configured to use the Firestore emulator.
  // Using the backend (8081) instead of the emulator (8080) ensures /api/* routes are handled
  // by the application server rather than directly hitting the emulator REST surface.
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8081';
    return process.env.NODE_ENV === 'development'
      ? [
          {
            source: '/api/:path*',
            destination: `${backend}/api/:path*`,
          },
        ]
      : [];
  },
};

export default nextConfig;
