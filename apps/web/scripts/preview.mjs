#!/usr/bin/env node
// Server kecil di atas out/ (hasil `next build`) dengan aturan yang sama seperti deploy/nginx.conf:
// /j/<kode> dan /v/<nomor> → shell statis, .well-known sebagai JSON. `next dev` hanya mengenal /j/_ dan /v/_.
//   npm run build -w @tekosue/web && npm run preview -w @tekosue/web     # PORT=3000 default
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveShell } from "./shell-routes.mjs";

const OUT = fileURLToPath(new URL("../out", import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".glb": "model/gltf-binary",
};

async function file(path) {
  const full = normalize(join(OUT, path));
  if (!full.startsWith(OUT)) return null;
  try {
    return (await stat(full)).isFile() ? full : null;
  } catch {
    return null;
  }
}

/** Urutan sama dengan nginx: shell → file persis → .html → index.html. */
async function resolve(pathname) {
  const shell = resolveShell(pathname);
  if (shell) return file(shell);
  return (await file(pathname)) ?? (await file(`${pathname}.html`)) ?? (await file(join(pathname, "index.html")));
}

createServer(async (req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  } catch {
    pathname = "/";
  }
  const found = await resolve(pathname);
  const path = found ?? (await file("404.html"));
  const type = pathname.startsWith("/.well-known/") ? "application/json" : (TYPES[extname(path ?? "")] ?? "application/octet-stream");
  res.writeHead(found ? 200 : 404, { "Content-Type": type });
  res.end(path ? await readFile(path) : "Not found");
}).listen(PORT, () => console.log(`Preview out/ at http://localhost:${PORT}`));
