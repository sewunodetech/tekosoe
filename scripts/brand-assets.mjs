/**
 * Generate semua aset brand (ikon app, adaptive icon Android, splash, favicon, ikon web, banner README)
 * dari SVG sumber di apps/mobile/assets (tekosue-mark.svg, tekosue-mark-mono.svg, tekosue-logo.svg).
 *
 * Butuh sharp + opentype.js + font Manrope (tidak dipasang di workspace supaya lockfile tetap ramping):
 *   mkdir /tmp/brand && cd /tmp/brand && npm i sharp opentype.js @expo-google-fonts/manrope
 *   BRAND_DEPS=/tmp/brand node scripts/brand-assets.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(resolve(process.env.BRAND_DEPS ?? root), 'package.json'));
const sharp = require('sharp');
const opentype = require('opentype.js');
const loadFont = (p) => { const b = readFileSync(require.resolve(p)); return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const manrope = loadFont('@expo-google-fonts/manrope/700Bold/Manrope_700Bold.ttf');
const manropeSemi = loadFont('@expo-google-fonts/manrope/600SemiBold/Manrope_600SemiBold.ttf');

const C = { ivory: '#faf8f3', ink: '#1d2426', slate: '#5f6b6d', teal: '#1f7a6e', tealDeep: '#16574e', mint: '#dcf0ea', orange: '#ff9a62', white: '#ffffff' };

const mobile = join(root, 'apps/mobile/assets');
const out = (...p) => {
  const f = join(root, ...p);
  mkdirSync(dirname(f), { recursive: true });
  return f;
};

// --- Sumber -------------------------------------------------------------------------------------
// Semua bentuk diambil apa adanya dari file SVG di apps/mobile/assets, jadi ganti logo = ganti file
// lalu jalankan ulang skrip ini.
const readSvg = (name) => {
  const src = readFileSync(join(mobile, name), 'utf8');
  return { viewBox: src.match(/viewBox="([^"]+)"/)[1], body: src.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '') };
};
const markColor = readSvg('tekosue-mark.svg');
const markMono = readSvg('tekosue-mark-mono.svg');
const logo = readSvg('tekosue-logo.svg');

/** SVG sumber ditaruh di kotak persegi `size` px yang berpusat di (cx, cy). */
const place = (src, cx, cy, size) =>
  `<svg x="${cx - size / 2}" y="${cy - size / 2}" width="${size}" height="${size}" viewBox="${src.viewBox}">${src.body}</svg>`;

/** Wordmark saja (logo tanpa grup Teko di depannya), dipotong rapat ke isinya, sebagai PNG. */
async function wordmarkPng(height) {
  const textOnly = logo.body.replace(/^<g[\s\S]*?<\/g>/, '');
  const [, , w, h] = logo.viewBox.split(/\s+/).map(Number);
  const src = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * 8}" height="${h * 8}" viewBox="${logo.viewBox}">${textOnly}</svg>`;
  const trimmed = await sharp(Buffer.from(src)).trim().png().toBuffer();
  return sharp(trimmed).resize({ height }).png().toBuffer();
}

/** `Path.toPathData` di opentype.js 2.0 kadang menulis `NaN` saat membulatkan, jadi serialisasi sendiri. */
function pathData(path) {
  const n = (v) => Math.round(v * 100) / 100;
  return path.commands
    .map((c) => {
      switch (c.type) {
        case 'M':
        case 'L':
          return `${c.type}${n(c.x)} ${n(c.y)}`;
        case 'Q':
          return `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
        case 'C':
          return `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
        default:
          return 'Z';
      }
    })
    .join('');
}

/** Teks → path (librsvg tidak punya font Manrope). `x` = kiri, `y` = baseline. */
function text(str, x, y, size, color, font = manrope) {
  return `<path d="${pathData(font.getPath(str, x, y, size))}" fill="${color}"/>`;
}
const textWidth = (str, size, font = manrope) => font.getAdvanceWidth(str, size);

const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
/** Latar ikon: teal dengan cahaya mint lembut di tengah supaya Teko (badan mint) tetap menonjol. */
const iconBg = (w, h, r = 0, shadow = true) =>
  `<defs><radialGradient id="bg" cx="0.5" cy="0.42" r="0.75"><stop offset="0" stop-color="#2a9583"/><stop offset="1" stop-color="${C.teal}"/></radialGradient></defs><rect width="${w}" height="${h}" rx="${r}" fill="url(#bg)"/>` +
  (shadow ? `<ellipse cx="${w / 2}" cy="${h * 0.79}" rx="${w * 0.27}" ry="${h * 0.035}" fill="${C.tealDeep}" opacity="0.45"/>` : '');

const png = (s, file, size) => sharp(Buffer.from(s)).resize(size, size).png({ compressionLevel: 9 }).toFile(file);

// --- Ikon app ------------------------------------------------------------------------------------
const ICON = 1024;
// Isi Teko berpusat di tengah viewBox mark; titik terjauh (corong) ±0.51 × sisi viewBox dari pusat.
/** Ikon utama: Teko di atas teal (iOS menambah sudut bulat sendiri). */
const appIcon = svg(ICON, ICON, iconBg(ICON, ICON) + place(markColor, 512, 500, 860));
/** Android adaptive: isi harus di dalam lingkaran aman 66/108 → radius ±313 px dari 1024. */
const fg = svg(ICON, ICON, place(markColor, 512, 512, 600));
const bg = svg(ICON, ICON, iconBg(ICON, ICON, 0, false));
/** Splash: Teko berwarna di atas latar ivory (warna latar diatur di app.json). */
const splash = svg(ICON, ICON, place(markColor, 512, 512, 1024));
/** Favicon kecil: kotak bulat supaya tetap terbaca di tab browser. */
const favicon = svg(ICON, ICON, iconBg(ICON, ICON, 224) + place(markColor, 512, 500, 900));

/** Monokrom Android = garis tinta dari versi mono (tinta → buram, putih → transparan), diwarnai putih. */
async function monochrome(file) {
  const lines = await sharp(Buffer.from(svg(ICON, ICON, `<rect width="${ICON}" height="${ICON}" fill="#fff"/>` + place(markMono, 512, 512, 600))))
    .greyscale()
    .negate({ alpha: false })
    .extractChannel(0)
    .toBuffer();
  await sharp({ create: { width: ICON, height: ICON, channels: 3, background: '#ffffff' } })
    .joinChannel(lines)
    .png({ compressionLevel: 9 })
    .toFile(file);
}

await png(appIcon, join(mobile, 'images/icon.png'), 1024);
await png(fg, join(mobile, 'images/android-icon-foreground.png'), 1024);
await png(bg, join(mobile, 'images/android-icon-background.png'), 1024);
await monochrome(join(mobile, 'images/android-icon-monochrome.png'));
await png(splash, join(mobile, 'images/splash-icon.png'), 1024);
await png(favicon, join(mobile, 'images/favicon.png'), 48);

// --- Web (Next.js file conventions di src/app) --------------------------------------------------
const webApp = (f) => out('apps/web/src/app', f);
await png(favicon, webApp('icon.png'), 512);
await png(appIcon, webApp('apple-icon.png'), 180);

/** favicon.ico berisi PNG 16/32/48 (format ICO mengizinkan payload PNG). */
const icoSizes = [16, 32, 48];
const icoPngs = await Promise.all(icoSizes.map((s) => sharp(Buffer.from(favicon)).resize(s, s).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * icoSizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icoSizes.length, 4);
let offset = header.length;
icoSizes.forEach((s, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(s, e);
  header.writeUInt8(s, e + 1);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(icoPngs[i].length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += icoPngs[i].length;
});
writeFileSync(webApp('favicon.ico'), Buffer.concat([header, ...icoPngs]));

// --- Banner README + gambar Open Graph ----------------------------------------------------------
async function banner(w, h, file) {
  const pad = Math.round(w * 0.075);
  const wordH = Math.round(h * 0.13);
  const titleSize = Math.round(h * 0.075);
  const subSize = Math.round(h * 0.036);
  const iconSize = Math.round(h * 0.56);
  const iconX = w - pad - iconSize;
  const iconY = (h - iconSize) / 2;
  const top = h * 0.25;

  const chips = ['Passkey sign-in', 'Dollars (AUSD)', 'Settles itself on Monad'];
  let chipX = pad;
  const chipY = top + wordH + titleSize * 2.9;
  const chipH = subSize * 2;
  const chipSvg = chips
    .map((label) => {
      const tw = textWidth(label, subSize, manropeSemi);
      const cw = tw + subSize * 1.6;
      const g = `<rect x="${chipX}" y="${chipY}" width="${cw}" height="${chipH}" rx="${chipH / 2}" fill="${C.mint}"/>${text(label, chipX + subSize * 0.8, chipY + chipH * 0.68, subSize, C.tealDeep, manropeSemi)}`;
      chipX += cw + subSize * 0.6;
      return g;
    })
    .join('');

  const tekoSize = iconSize * 1.15;
  const base = svg(
    w,
    h,
    `<rect width="${w}" height="${h}" fill="${C.ivory}"/>` +
      `<circle cx="${iconX + iconSize / 2}" cy="${h / 2}" r="${iconSize * 0.55}" fill="${C.mint}"/>` +
      `<circle cx="${iconX - h * 0.02}" cy="${h * 0.86}" r="${h * 0.03}" fill="${C.orange}"/>` +
      `<circle cx="${w - pad * 0.6}" cy="${h * 0.16}" r="${h * 0.018}" fill="${C.orange}" opacity="0.7"/>` +
      text('One pot for the whole trip.', pad, top + wordH + titleSize * 1.55, titleSize, C.ink) +
      text('It settles up by itself.', pad, top + wordH + titleSize * 2.55, titleSize, C.teal) +
      chipSvg +
      place(markColor, iconX + iconSize / 2, h / 2 + iconSize * 0.02, tekoSize),
  );
  await sharp(Buffer.from(base))
    .composite([{ input: await wordmarkPng(wordH), left: pad, top: Math.round(top) }])
    .png({ compressionLevel: 9 })
    .toFile(file);
}

await banner(1280, 640, out('docs/assets/banner.png'));
await banner(1200, 630, webApp('opengraph-image.png'));

console.log('brand assets generated');
