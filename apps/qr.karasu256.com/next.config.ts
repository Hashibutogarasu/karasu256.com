import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@Hashibutogarasu/ui', '@Hashibutogarasu/utils'],
  devIndicators: false,
};

export default nextConfig;
