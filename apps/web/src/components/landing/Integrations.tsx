import Image from "next/image";
import { TekoMark } from "@/components/Logo";
import { OrbitScene } from "./three/lazy";

/*
 * Teknologi sponsor Monad Metropolis yang dipakai Tekosue (docs/01-brd.md › pihak berkepentingan,
 * docs/ROADMAP.md › lapisan P0–P3). Ini integrasi teknologi, bukan kemitraan — jangan ditulis "partner".
 * `planned` = belum dikerjakan menurut docs/STATUS.md; hapus tandanya setelah jalan di testnet.
 */
export const INTEGRATIONS: {
  name: string;
  by?: string;
  role: string;
  planned?: boolean;
  /** Logo resmi dari situs pemiliknya (lihat public/sponsors/README.md), ditampilkan satu warna. */
  logo: { src: string; alt: string; w: number; h: number };
}[] = [
  { name: "Monad", role: "The network every payment runs on. It confirms in about a second.", logo: { src: "/sponsors/monad.svg", alt: "Monad", w: 126, h: 24 } },
  { name: "AUSD", by: "Agora", role: "The digital dollar inside every pot, the same in every country.", logo: { src: "/sponsors/agora.svg", alt: "Agora", w: 126, h: 28 } },
  {
    name: "Mera",
    by: "Category Labs",
    role: "Passkey sign-in. Your account opens with your face, with no password.",
    logo: { src: "/sponsors/category-labs.svg", alt: "Category Labs", w: 1344, h: 234 },
  },
  { name: "Envio", role: "Keeps balances and the activity feed up to date as friends spend.", logo: { src: "/sponsors/envio.svg", alt: "Envio", w: 390, h: 94 } },
  {
    name: "Alchemy",
    role: "Covers the network fees, so you never have to think about them.",
    planned: true,
    logo: { src: "/sponsors/alchemy.svg", alt: "Alchemy", w: 160, h: 35 },
  },
];

/** Logo sponsor satu warna (hitam) supaya landing tetap dua warna. Tinggi diatur lewat `className`. */
function SponsorLogo({ logo, className }: { logo: (typeof INTEGRATIONS)[number]["logo"]; className: string }) {
  return <Image src={logo.src} alt={logo.alt} width={logo.w} height={logo.h} unoptimized className={`w-auto brightness-0 ${className}`} />;
}

/** Baris nama yang berjalan pelan di bawah hero. Berhenti saat disentuh; diam bila gerakan dikurangi. */
export function IntegrationMarquee() {
  const names = INTEGRATIONS.map((i) => (i.by ? `${i.name} by ${i.by}` : i.name));
  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm font-medium text-gray-500">Built for Monad Metropolis with</p>
      <div className="lg-marquee w-full" aria-label={`Built with ${names.join(", ")}`} role="img">
        <div className="lg-marquee-track" aria-hidden="true">
          {[0, 1].map((copy) => (
            <ul key={copy} className="lg-marquee-group">
              {INTEGRATIONS.map((it) => (
                <li key={it.name} className="flex shrink-0 items-center gap-3">
                  <SponsorLogo logo={it.logo} className="h-7 md:h-8" />
                  {/* Produk yang dipakai kalau berbeda dari nama perusahaannya (AUSD, Mera). */}
                  {it.by && <span className="text-xl font-semibold tracking-tight whitespace-nowrap text-gray-900 md:text-2xl">{it.name}</span>}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Diagram "Built with": Tekosue di tengah, tersambung ke tiap teknologi dengan titik yang mengalir. */
export function BuiltWith() {
  return (
    <section id="built-with" className="scroll-mt-24 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="lg-reveal mx-auto mb-12 max-w-2xl text-center">
          <p className="lg-glass mb-4 inline-block rounded-full px-3.5 py-1 text-xs font-medium text-gray-700">Built with</p>
          <h2 className="text-4xl leading-[1.1] font-normal tracking-tight md:text-5xl">The pieces behind every pot</h2>
          <p className="mt-4 text-lg text-gray-600">Tekosue was built for the Monad Metropolis hackathon on technology from these teams.</p>
        </div>

        <div className="lg-reveal">
          {/* Simpul pusat: planet 3D Tekosue dengan logo yang mengorbit (dekoratif; daftar lengkapnya di kartu bawah). */}
          <div className="lg-scene relative mx-auto h-72 max-w-3xl overflow-hidden rounded-[2.5rem] md:h-96">
            <OrbitScene logos={INTEGRATIONS.map((it) => ({ name: it.name, src: it.logo.src, w: it.logo.w, h: it.logo.h }))} />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div className="lg-btn flex items-center gap-2 rounded-full px-6 py-3 text-base font-semibold text-white">
                <TekoMark className="h-6 w-6" />
                Tekosue
              </div>
            </div>
          </div>
          <div className="lg-wire" aria-hidden="true" />
          {/* Rel mendatar (hanya di layar lebar): titik mengalir dari tengah ke kedua ujung */}
          <div className="relative hidden lg:block" aria-hidden="true">
            <div className="lg-bus" />
          </div>

          <ul className="mx-auto grid max-w-md grid-cols-1 lg:max-w-none lg:grid-cols-5 lg:gap-4">
            {INTEGRATIONS.map((it, i) => (
              <li key={it.name} className="flex flex-col">
                {/* Di ponsel kartu pertama sudah tersambung ke simpul pusat lewat kabel di atas. */}
                <div className={`lg-wire ${i === 0 ? "hidden lg:block" : ""}`} style={{ ["--delay" as string]: `${0.6 + i * 0.25}s` }} aria-hidden="true" />
                <div className="lg-glass flex flex-1 flex-col rounded-3xl p-6 text-center lg:text-left">
                  <SponsorLogo logo={it.logo} className="mx-auto mb-5 h-7 lg:mx-0" />
                  <h3 className="text-2xl font-semibold tracking-tight">{it.name}</h3>
                  {/* Baris "by" tetap mengambil tempat di layar lebar supaya kelima kartu sejajar. */}
                  <p className={`mt-1 min-h-5 text-sm font-medium text-teal ${it.by ? "" : "hidden lg:block"}`}>{it.by ? `by ${it.by}` : "\u00a0"}</p>
                  <p className="mt-4 text-sm leading-relaxed text-gray-600">{it.role}</p>
                  {it.planned && (
                    <span className="mt-4 self-center rounded-full border border-black/10 px-2.5 py-0.5 text-xs font-medium text-gray-600 lg:self-start">
                      Planned
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
