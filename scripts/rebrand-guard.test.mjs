// Menjaga rebrand Tekosoe → Tekosue (ADR 0011): "tekosoe" hanya boleh tersisa sebagai identifier
// yang sengaja dipertahankan (identitas native, kunci perangkat, domain kriptografi, …) atau catatan riwayat.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

/** File yang dikecualikan utuh: catatan riwayat, spec rebrand, guard ini, lockfile. */
const EXCLUDED_PATHS = [
  /^\.kiro\//,
  /^docs\/decisions\/00(0[1-9]|1[0-2])-/,
  /^docs\/STATUS\.md$/,
  /^scripts\/rebrand-guard\.test\.mjs$/,
  /^package-lock\.json$/,
];

/** Identifier lama yang sengaja dipertahankan (lihat tabel di ADR 0011). */
const ALLOWED = [
  "tekosoe://", // skema deep link app terpasang
  'scheme": "tekosoe"',
  "scheme: tekosoe",
  'slug": "tekosoe"', // proyek EAS
  "kyy27/tekosoe", // akun/proyek EAS
  "projects/tekosoe",
  "com.tekosoe.xyz", // bundle iOS / package Android
  "com.daffaradhitya.tekosoe",
  "tekosoe.wav", // suara + kanal notifikasi
  "tekosoe-chime",
  "tekosoe-default",
  "'tekosoe']",
  "tekosoe_", // kunci penyimpanan perangkat
  "tekosoe:invoice-share", // audience kode akses invoice yang sudah terbit
  "Tekosoe receipts", // domain kriptografi struk
  "tekosoe/trip-key-wrap",
  "tekosoe/receipt/",
  "Sign in to Tekosoe.", // pernyataan SIWE build lama
  "tekosoe-indexer",
  "tekosoe-mark", // nama file aset sumber
  "tekosoe-logo",
  "Tekosoe — Dokumen Produk", // judul dokumen live di Claude Docs
  "Tekosoe_-_Dokumen_Produk",
  "Tekosoe — Wireframe", // judul canvas desain
  "sewunodetech/tekosoe", // repo git
  "tekosoe/\n",
];

test("no leftover Tekosoe outside the allowlist", () => {
  const out = execFileSync("git", ["grep", "-n", "-i", "tekosoe"], { encoding: "utf8" }).trim();
  const hits = out
    .split("\n")
    .filter(Boolean)
    .filter((line) => {
      const [path] = line.split(":");
      if (EXCLUDED_PATHS.some((re) => re.test(path))) return false;
      let rest = `${line.slice(line.indexOf(":", path.length + 1) + 1)}\n`;
      for (const allowed of ALLOWED) rest = rest.split(allowed).join("");
      return /tekosoe/i.test(rest);
    });
  assert.deepEqual(hits, [], `"tekosoe" di luar allowlist:\n${hits.join("\n")}`);
});

test("lockfile only references @tekosue workspaces", () => {
  assert.equal(readFileSync("package-lock.json", "utf8").includes("@tekosoe/"), false);
});
