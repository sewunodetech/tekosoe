import type { NextConfig } from "next";

// Static export nyata (ADR 0012): `next build` menulis out/, dilayani nginx (deploy/nginx.conf).
// Header .well-known (JSON, tanpa redirect) dan rewrite /j/* /v/* ke shell statis diatur di nginx,
// karena headers()/rewrites() tidak didukung static export.
const nextConfig: NextConfig = {
  output: "export",
  // @tekosue/shared dikonsumsi sebagai source TypeScript
  transpilePackages: ["@tekosue/shared"],
  // Tidak ada server untuk optimasi gambar di static export; gambar dilayani apa adanya dari public/.
  images: { unoptimized: true },
};

export default nextConfig;
