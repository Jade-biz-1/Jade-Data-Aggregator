/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001',
  },

  // T036: Bundle splitting and optimization
  webpack: (config, { isServer }) => {
    // Preserve existing optimization settings and only augment them.
    if (config.optimization.splitChunks) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        // Recharts (large charting library)
        recharts: {
          test: /[\\/]node_modules[\\/](recharts|d3-)[\\/]/,
          name: 'recharts',
          priority: 20,
          reuseExistingChunk: true,
        },
        // React Flow (visual pipeline builder)
        reactflow: {
          test: /[\\/]node_modules[\\/](reactflow|@reactflow)[\\/]/,
          name: 'reactflow',
          priority: 20,
          reuseExistingChunk: true,
        },
      };
    }

    return config;
  },

  // T054: Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // T055: Compression and minification
  compress: true,
  productionBrowserSourceMaps: false, // Disable source maps in production

  // Experimental optimizations
  experimental: {
    optimizeCss: true, // CSS optimization
    optimizePackageImports: ['recharts', 'lucide-react', '@heroicons/react'], // Optimize heavy packages
  },

  // T037: CDN and static asset optimization
  assetPrefix: process.env.CDN_URL || '',

  // Headers for caching
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*', 
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Performance monitoring
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // 1 minute
    pagesBufferLength: 5,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;