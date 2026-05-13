import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Disable tracing to avoid readlink issues on Windows/Network drives
  outputFileTracing: false,
  // Force Turbopack to ignore symlinks
  experimental: {
    turbo: {
      resolveAlias: {
        '@': './src',
      },
    },
  },
};

export default nextConfig;
