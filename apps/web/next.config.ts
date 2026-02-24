import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@bingo-planner/shared'],
};

export default nextConfig;
