import { Star } from "lucide-react";

/*
 * Teknologi sponsor Monad Metropolis yang dipakai Tekosoe (docs/01-brd.md › pihak berkepentingan,
 * docs/ROADMAP.md › lapisan P0–P3). Ini integrasi teknologi, bukan kemitraan — jangan ditulis "partner".
 * `planned` = belum dikerjakan menurut docs/STATUS.md; hapus tandanya setelah jalan di testnet.
 * Nama ditampilkan sebagai teks, bukan logo: repo ini tidak punya aset logo resmi mereka.
 */
export const INTEGRATIONS: { name: string; by?: string; role: string; planned?: boolean }[] = [
  { name: "Monad", role: "The network every payment runs on. It confirms in about a second." },
  { name: "AUSD", by: "Agora", role: "The digital dollar inside every pot, the same in every country." },
  { name: "Mera", by: "Category Labs", role: "Passkey sign-in. Your account opens with your face, with no password." },
  { name: "Envio", role: "Keeps balances and the activity feed up to date as friends spend." },
  { name: "Alchemy", role: "Covers the network fees, so you never have to think about them.", planned: true },
];

/** Baris nama yang berjalan pelan di bawah hero. Berhenti saat disentuh; diam bila gerakan dikurangi. */
export function IntegrationMarquee() {
  const names = INTEGRATIONS.map((i) => (i.by ? `${i.name} by ${i.by}` : i.name));
  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-sm font-medium text-gray-500">Built for Monad Metropolis with</p>
      <div className="lg-marquee w-full" aria-label={`Built with ${names.join(", ")}`} role="img">
        <div className="lg-marquee-track" aria-hidden="true">
          {[0, 1].map((copy) => (
            <ul key={copy} className="lg-marquee-group">
              {names.map((n) => (
                <li key={n} className="flex items-center gap-3 text-2xl font-semibold tracking-tight whitespace-nowrap text-gray-900 md:text-3xl">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal" />
                  {n}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Diagram "Built with": Tekosoe di tengah, tersambung ke tiap teknologi dengan titik yang mengalir. */
export function BuiltWith() {
  return (
    <section id="built-with" className="scroll-mt-24 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="lg-reveal mx-auto mb-12 max-w-2xl text-center">
          <p className="lg-glass mb-4 inline-block rounded-full px-3.5 py-1 text-xs font-medium text-gray-700">Built with</p>
          <h2 className="text-4xl leading-[1.1] font-normal tracking-tight md:text-5xl">The pieces behind every pot</h2>
          <p className="mt-4 text-lg text-gray-600">Tekosoe was built for the Monad Metropolis hackathon on technology from these teams.</p>
        </div>

        <div className="lg-reveal">
          {/* Simpul pusat */}
          <div className="flex justify-center">
            <div className="lg-btn flex items-center gap-2 rounded-full px-6 py-3 text-base font-semibold text-white">
              <Star className="h-4 w-4 fill-white" aria-hidden="true" />
              Tekosoe
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
                  <h3 className="text-3xl font-semibold tracking-tight">{it.name}</h3>
                  <p className="mt-1 min-h-5 text-sm font-medium text-teal">{it.by ? `by ${it.by}` : " "}</p>
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
