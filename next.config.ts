import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Slim production image for Docker.
  output: "standalone",
};

export default nextConfig;
