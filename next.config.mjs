/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  // Base path for deployments behind a subpath (default: root)
  basePath,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // When deployed under a basePath (e.g. /dev), the image optimizer
    // can request /<asset> without the basePath and fail. Disable for dev.
    unoptimized: Boolean(basePath),
  },

  // Compress output
  compress: true,

  // Production optimizations (swcMinify and optimizeFonts are enabled by default in Next.js 16)

  // React strict mode for better development experience
  reactStrictMode: true,

  // Production source maps (optional - disable for smaller bundle)
  productionBrowserSourceMaps: false,

  // Set outputFileTracingRoot to avoid workspace root warning
  outputFileTracingRoot: process.cwd(),

  // Experimental features for better performance
  // Note: optimizeCss requires 'critters' package - disabled to avoid build errors
  // experimental: {
  //   optimizeCss: true,
  // },

  // TypeScript
  typescript: {
    // Allow build to succeed even with type errors (for migration)
    ignoreBuildErrors: true,
  },

  // ESLint
  eslint: {
    // Allow build to succeed even with lint errors (for migration)
    ignoreDuringBuilds: true,
  },

  async rewrites() {
    return [
      {
        source: '/dev-api/:path*',
        destination: 'http://localhost:3002/api/:path*',
      },
    ]
  },
};

export default nextConfig;
