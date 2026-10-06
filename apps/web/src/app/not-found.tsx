import { Inter } from "next/font/google";
import Link from "next/link";
import { TekoMark } from "@/components/Logo";
import { TekoScene } from "@/components/landing/three/lazy";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"] });

/*
 * 404 untuk URL yang tidak cocok dengan rute mana pun, bergaya landing (full-bleed, dua warna,
 * Teko 3D yang bisa diklik). 404 dari dalam dashboard memakai `(phone)/not-found.tsx`.
 * Tanpa Navbar/Footer landing: tautan `#bagian` di sana hanya berlaku di `/`.
 */
export default function NotFound() {
  return (
    <div className={`${inter.className} landing flex min-h-dvh flex-col bg-[#f6f6f4] text-black`}>
      <header className="px-3 pt-3">
        <nav aria-label="Main" className="lg-glass mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full pr-2 pl-5">
          <Link href="/" className="flex items-center gap-2" aria-label="Tekosue home">
            <TekoMark className="h-7 w-7" />
            <span className="text-lg font-semibold">Tekosue</span>
          </Link>
          <Link href="/trips" className="lg-btn rounded-full px-5 py-2.5 text-sm font-medium whitespace-nowrap text-white">
            Open dashboard
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 items-center px-6 py-12">
        <div className="lg-scene relative isolate mx-auto grid w-full max-w-6xl items-center overflow-hidden rounded-[2.5rem] md:grid-cols-2">
          {/* Teko 3D: di atas pada ponsel, di kanan pada layar lebar. Klik untuk membuatnya melompat. */}
          <div className="h-64 md:order-2 md:h-[480px]">
            <TekoScene />
          </div>
          <div className="px-6 pb-14 text-center md:px-10 md:py-20 md:text-left lg:px-14">
            <p className="lg-glass mb-5 inline-block rounded-full px-3.5 py-1 text-xs font-medium text-gray-700">Error 404</p>
            <h1 className="mb-4 text-4xl leading-[1.1] font-normal tracking-tight md:text-5xl lg:text-6xl">This page went on its own trip</h1>
            <p className="mb-8 text-lg text-gray-700">The link may be old or mistyped. Nothing in your pot has changed.</p>
            <div className="flex flex-col items-center gap-3 whitespace-nowrap sm:flex-row sm:flex-wrap sm:justify-center md:justify-start">
              <Link href="/" className="lg-btn rounded-full px-8 py-3 text-base font-medium text-white transition-transform hover:-translate-y-0.5">
                Back to home
              </Link>
              <Link href="/trips" className="lg-glass rounded-full px-8 py-3 text-base font-medium text-black transition-transform hover:-translate-y-0.5">
                See the demo trips
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
