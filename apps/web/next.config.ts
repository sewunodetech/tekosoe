import type { NextConfig } from "next";

// File asosiasi domain passkey harus dilayani sebagai JSON, tanpa redirect.
// apple-app-site-association tidak berekstensi, jadi tanpa header ini terkirim sebagai octet-stream.
const wellKnownHeaders = [
  { key: "Content-Type", value: "application/json" },
  { key: "Cache-Control", value: "public, max-age=300" },
];

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
