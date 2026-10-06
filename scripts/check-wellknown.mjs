#!/usr/bin/env node
// Cek file asosiasi domain untuk passkey native (Mera via react-native-passkey).
//
//   node scripts/check-wellknown.mjs                         # domain = EXPO_PUBLIC_PASSKEY_DOMAIN / www.tekosue.xyz
//   node scripts/check-wellknown.mjs www.tekosue.xyz --sha256 AB:CD:...   # pastikan fingerprint build EAS terdaftar
//   node scripts/check-wellknown.mjs http://localhost:3000   # cek build lokal sebelum deploy (lewati cek HTTPS/Google/Apple)
//
// Passkey Android butuh: https://<rpId>/.well-known/assetlinks.json → 200 langsung (tanpa redirect),
// JSON, relasi get_login_creds untuk package + SHA-256 sertifikat penandatangan APK.
// Passkey iOS butuh: https://<rpId>/.well-known/apple-app-site-association → webcredentials
// "<TEAMID>.<bundleId>", plus entitlement associatedDomains "webcredentials:<rpId>" di app.

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Debug keystore bawaan template React Native — hanya cocok untuk build lokal `expo run:android`.
const DEBUG_KEYSTORE_FP =
  "FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const sha256Args = [];
let target;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--sha256") sha256Args.push(normalizeFp(args[++i] ?? ""));
  else target = args[i];
}

target ??= readEnvDomain() ?? "www.tekosue.xyz";
const isLocal = /^http:\/\//.test(target);
const base = /^https?:\/\//.test(target) ? target.replace(/\/$/, "") : `https://${target}`;
const host = new URL(base).hostname;

const expo = JSON.parse(readFileSync(resolve(root, "apps/mobile/app.json"), "utf8")).expo;
const androidPackage = expo.android?.package;
const iosBundle = expo.ios?.bundleIdentifier;
// associatedDomains iOS dibentuk app.config.ts dari EXPO_PUBLIC_PASSKEY_DOMAIN (atau default di file itu).
const configDefault = readFileSync(resolve(root, "apps/mobile/app.config.ts"), "utf8").match(
  /EXPO_PUBLIC_PASSKEY_DOMAIN \|\| '([^']+)'/,
)?.[1];

let failed = 0;
const ok = (m) => console.log(`  ✔ ${m}`);
const bad = (m) => {
  failed++;
  console.log(`  ✘ ${m}`);
};
const warn = (m) => console.log(`  ! ${m}`);

console.log(`Domain passkey: ${base}`);
console.log(`App: android=${androidPackage} ios=${iosBundle}\n`);

console.log("apps/mobile (rpId)");
if (!isLocal) {
  const appDomain = readEnvDomain() ?? configDefault;
  appDomain === host
    ? ok(`rpId app & associatedDomains iOS = ${host}`)
    : bad(`domain app = ${appDomain} ≠ ${host} — set EXPO_PUBLIC_PASSKEY_DOMAIN=${host} (lokal & environment EAS)`);
}

const assetlinks = await fetchJson("assetlinks.json");
if (assetlinks) {
  const stmts = Array.isArray(assetlinks) ? assetlinks : [];
  const mine = stmts.filter(
    (s) => s?.target?.namespace === "android_app" && s.target.package_name === androidPackage,
  );
  if (!mine.length) bad(`tidak ada statement untuk package ${androidPackage}`);
  const creds = mine.filter((s) => s.relation?.includes("delegate_permission/common.get_login_creds"));
  creds.length ? ok("relasi get_login_creds ada") : bad("relasi delegate_permission/common.get_login_creds tidak ada");
  const fps = creds.flatMap((s) => s.target.sha256_cert_fingerprints ?? []).map(normalizeFp);
  for (const fp of fps) {
    if (!/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(fp)) bad(`format fingerprint salah: ${fp}`);
    if (fp === DEBUG_KEYSTORE_FP) warn("fingerprint debug keystore template RN terdaftar — build EAS TIDAK memakai ini");
  }
  for (const fp of sha256Args) {
    fps.includes(fp) ? ok(`fingerprint ${fp.slice(0, 11)}… terdaftar`) : bad(`fingerprint ${fp} belum ada di assetlinks.json`);
  }
  if (!sha256Args.length) warn("tambahkan --sha256 <fingerprint build EAS> untuk memastikan APK yang dipasang cocok");

  if (!isLocal) {
    for (const fp of sha256Args.length ? sha256Args : fps) await googleCheck(fp);
  }
}

const aasa = await fetchJson("apple-app-site-association");
if (aasa) {
  const apps = aasa.webcredentials?.apps ?? [];
  const mine = apps.filter((a) => a.endsWith(`.${iosBundle}`));
  if (!mine.length) bad(`webcredentials.apps tidak memuat "<TEAMID>.${iosBundle}" (isi sekarang: ${JSON.stringify(apps)})`);
  for (const id of mine) {
    /^[A-Z0-9]{10}\./.test(id) ? ok(`webcredentials ${id}`) : bad(`Team ID di "${id}" masih placeholder (harus 10 karakter dari Apple Developer)`);
  }
  if (!isLocal) await appleCdnCheck();
}

console.log(failed ? `\n${failed} masalah ditemukan.` : "\nSemua cek lolos.");
process.exit(failed ? 1 : 0);

// ---------------------------------------------------------------------------

async function fetchJson(name) {
  const url = `${base}/.well-known/${name}`;
  console.log(`\n${url}`);
  let res;
  try {
    res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(10_000) });
  } catch (err) {
    bad(`tidak bisa diakses: ${err.cause?.code ?? err.message} (DNS/HTTPS/server belum siap?)`);
    return null;
  }
  if (res.status >= 300 && res.status < 400) {
    bad(`redirect ${res.status} → ${res.headers.get("location")} (Android & Apple menolak redirect)`);
    return null;
  }
  if (res.status !== 200) {
    bad(`status ${res.status}`);
    return null;
  }
  ok("200 tanpa redirect");
  const type = res.headers.get("content-type") ?? "";
  type.includes("application/json") ? ok(`Content-Type ${type}`) : bad(`Content-Type "${type}" — harus application/json`);
  try {
    const json = JSON.parse(await res.text());
    ok("JSON valid");
    return json;
  } catch {
    bad("bukan JSON valid");
    return null;
  }
}

// Validator resmi Google — ini yang dipakai Credential Manager.
async function googleCheck(fp) {
  const q = new URLSearchParams({
    "source.web.site": `https://${host}`,
    relation: "delegate_permission/common.get_login_creds",
    "target.android_app.package_name": androidPackage,
    "target.android_app.certificate.sha256_fingerprint": fp,
  });
  try {
    const res = await fetch(`https://digitalassetlinks.googleapis.com/v1/assetlinks:check?${q}`, {
      signal: AbortSignal.timeout(15_000),
    });
    const body = await res.json();
    body.linked
      ? ok(`Google Digital Asset Links: linked (${fp.slice(0, 11)}…)`)
      : bad(`Google Digital Asset Links: TIDAK linked untuk ${fp.slice(0, 11)}… ${body.debugString ? "— " + body.debugString.split("\n")[0] : ""}`);
  } catch (err) {
    warn(`Google Digital Asset Links tidak bisa dicek: ${err.message}`);
  }
}

// iOS mengambil AASA lewat CDN Apple, bukan langsung dari server (cache bisa tertinggal ~24 jam).
async function appleCdnCheck() {
  try {
    const res = await fetch(`https://app-site-association.cdn-apple.com/a/v1/${host}`, {
      signal: AbortSignal.timeout(15_000),
    });
    res.ok ? ok("CDN Apple sudah punya AASA") : warn(`CDN Apple: status ${res.status} (belum di-cache, atau server belum terjangkau Apple)`);
  } catch (err) {
    warn(`CDN Apple tidak bisa dicek: ${err.message}`);
  }
}

function readEnvDomain() {
  if (process.env.EXPO_PUBLIC_PASSKEY_DOMAIN) return process.env.EXPO_PUBLIC_PASSKEY_DOMAIN;
  const file = resolve(root, "apps/mobile/.env");
  if (!existsSync(file)) return undefined;
  return readFileSync(file, "utf8").match(/^EXPO_PUBLIC_PASSKEY_DOMAIN=(.+)$/m)?.[1].trim() || undefined;
}

function normalizeFp(fp) {
  return fp.trim().toUpperCase();
}
