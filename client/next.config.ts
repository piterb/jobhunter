import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["shared"],
  ...(isDev && {
    // Suppress warning about cross-origin requests during local development
    allowedDevOrigins: ["localhost:3000", "127.0.0.1:3000"],
  } as any),
};

export default nextConfig;
