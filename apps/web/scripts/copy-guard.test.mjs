// Menjaga aturan "tanpa istilah kripto di layar user" (AGENTS.md root, aturan 4).
// Memindai src/**/*.{ts,tsx}, mengabaikan komentar, dan gagal kalau ada kata terlarang.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import assert from "node:assert/strict";

const SRC = fileURLToPath(new URL("../src", import.meta.url));
const FORBIDDEN = /\b(wallets?|gas|seed phrases?|blockchains?|tokens?|hash(?:es)?|transactions?)\b/i;

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

const stripComments = (code) =>
  code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");

test("no crypto vocabulary in user-facing source", () => {
  const hits = [];
  for (const file of files(SRC)) {
    stripComments(readFileSync(file, "utf8"))
      .split("\n")
      .forEach((line, i) => {
        // Import dan nama identifier (mis. `hashes`) bukan teks yang terlihat user.
        if (/^\s*(import|export .* from)\b/.test(line)) return;
        const m = FORBIDDEN.exec(line);
        if (m) hits.push(`${relative(SRC, file)}:${i + 1}  "${m[0]}"  →  ${line.trim()}`);
      });
  }
  assert.deepEqual(hits, [], `Kata terlarang ditemukan:\n${hits.join("\n")}`);
});
