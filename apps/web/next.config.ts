import type { NextConfig } from "next";

// Static export nyata (ADR 0012): `next build` menulis out/, dilayani nginx (deploy/nginx.conf).
// Header .well-known (JSON, tanpa redirect) dan rewrite /j/* /v/* ke shell statis diatur di nginx,
// karena headers()/rewrites() tidak didukung static export.
const nextConfig: NextConfig = {
  // @tekosue/shared dikonsumsi sebagai source TypeScript
  transpilePackages: ["@tekosue/shared"],
  async headers() {
    return [
      { source: "/.well-known/apple-app-site-association", headers: wellKnownHeaders },
      { source: "/.well-known/assetlinks.json", headers: wellKnownHeaders },
    ];
  },
};

export default nextConfig;
