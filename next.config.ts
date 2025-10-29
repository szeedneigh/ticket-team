import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove turbopack config - it can cause webpack bundling issues
  // turbopack: {
  //   root: __dirname,
  // },
  
  // Enable React strict mode
  reactStrictMode: true,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  
  // Experimental features for package optimization
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
};

export default nextConfig;
