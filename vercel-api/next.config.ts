import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Tell Turbopack this subfolder is its own root, not the parent Hunger-Cafe/
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Allow the phone's LAN IP to access dev HMR resources
  allowedDevOrigins: ['192.168.1.10'],
};

export default nextConfig;
