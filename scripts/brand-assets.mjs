/**
 * Generate semua aset brand (ikon app, adaptive icon Android, splash, favicon, ikon web, banner README)
 * dari SVG sumber di apps/mobile/assets (tekosoe-mark.svg, tekosoe-logo.svg).
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
/** Mark "t" + titik. Isi viewBox asli (18 18 84 84) berpusat di (60, 60), radius isi ±46. */
function mark({ stroke = C.teal, dot = C.orange } = {}) {
  return `<g transform="translate(-2.5 1)"><path d="M50 26V76a16 16 0 0 0 16 16h10" fill="none" stroke="${stroke}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/><path d="M31 48H73" fill="none" stroke="${stroke}" stroke-width="15" stroke-linecap="round"/><circle cx="92" cy="70" r="9.5" fill="${dot}"/></g>`;
}
/** Mark ditaruh berpusat di (cx, cy) dengan tinggi kotak 84 unit = `size` px. */
const placeMark = (cx, cy, size, opts) => {
  const s = size / 84;
  return `<g transform="translate(${cx - 60 * s} ${cy - 60 * s}) scale(${s})">${mark(opts)}</g>`;
};

const logoSvg = readFileSync(join(mobile, 'tekosoe-logo.svg'), 'utf8');
const wordPath = logoSvg.match(/<path d="([^"]+)"/)[1];
/** Wordmark (viewBox 379.68 × 74.06) dengan kiri-atas di (x, y) dan tinggi `h` px. */
const placeWordmark = (x, y, h, color = C.teal, dot = C.orange) => {
  const s = h / 74.06;
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="${wordPath}" fill="${color}"/><circle cx="363.95" cy="38.04" r="15.72" fill="${dot}"/></g>`;
};

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
const tealBg = (w, h, r = 0) =>
  `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26897b"/><stop offset="1" stop-color="${C.teal}"/></linearGradient></defs><rect width="${w}" height="${h}" rx="${r}" fill="url(#bg)"/>`;

const png = (s, file, size) => sharp(Buffer.from(s)).resize(size, size).png({ compressionLevel: 9 }).toFile(file);

// --- Ikon app ------------------------------------------------------------------------------------
const ICON = 1024;
/** Ikon utama: kotak teal, mark putih + titik oranye (iOS menambah sudut bulat sendiri). */
const appIcon = svg(ICON, ICON, tealBg(ICON, ICON) + placeMark(512, 512, 600, { stroke: C.white }));
/** Android adaptive: isi harus di dalam lingkaran aman 66/108 → radius ±313 px dari 1024. */
const fg = svg(ICON, ICON, placeMark(512, 512, 520, { stroke: C.white }));
const bg = svg(ICON, ICON, tealBg(ICON, ICON));
const mono = svg(ICON, ICON, placeMark(512, 512, 520, { stroke: C.white, dot: C.white }));
/** Splash: mark berwarna di atas latar ivory (warna latar diatur di app.json). */
const splash = svg(ICON, ICON, placeMark(512, 512, 1000));
/** Favicon kecil: kotak bulat supaya tetap terbaca di tab browser. */
const favicon = svg(ICON, ICON, tealBg(ICON, ICON, 224) + placeMark(512, 512, 640, { stroke: C.white }));

await png(appIcon, join(mobile, 'images/icon.png'), 1024);
await png(fg, join(mobile, 'images/android-icon-foreground.png'), 1024);
await png(bg, join(mobile, 'images/android-icon-background.png'), 1024);
await png(mono, join(mobile, 'images/android-icon-monochrome.png'), 1024);
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
function banner(w, h) {
  const pad = Math.round(w * 0.075);
  const wordH = Math.round(h * 0.15);
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

  const s = iconSize / ICON;
  return svg(
    w,
    h,
    `<rect width="${w}" height="${h}" fill="${C.ivory}"/>` +
      `<circle cx="${w - pad * 0.2}" cy="${h * 0.08}" r="${h * 0.42}" fill="${C.mint}" opacity="0.7"/>` +
      `<circle cx="${iconX - h * 0.02}" cy="${h * 0.86}" r="${h * 0.035}" fill="${C.orange}"/>` +
      placeWordmark(pad, top, wordH) +
      text('One pot for the whole trip.', pad, top + wordH + titleSize * 1.55, titleSize, C.ink) +
      text('It settles up by itself.', pad, top + wordH + titleSize * 2.55, titleSize, C.teal) +
      chipSvg +
      `<g transform="translate(${iconX} ${iconY + 10})"><rect width="${iconSize}" height="${iconSize}" rx="${iconSize * 0.225}" fill="${C.tealDeep}" opacity="0.18"/></g>` +
      `<defs><clipPath id="sq"><rect x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" rx="${iconSize * 0.225}"/></clipPath></defs>` +
      `<g clip-path="url(#sq)"><g transform="translate(${iconX} ${iconY}) scale(${s})">${tealBg(ICON, ICON)}${placeMark(512, 512, 600, { stroke: C.white })}</g></g>`,
  );
}

await sharp(Buffer.from(banner(1280, 640))).png({ compressionLevel: 9 }).toFile(out('docs/assets/banner.png'));
await sharp(Buffer.from(banner(1200, 630))).png({ compressionLevel: 9 }).toFile(webApp('opengraph-image.png'));

console.log('brand assets generated');
