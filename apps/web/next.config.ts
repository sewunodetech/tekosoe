import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @tekosoe/shared dikonsumsi sebagai source TypeScript
  transpilePackages: ["@tekosoe/shared"],
};

export default nextConfig;
