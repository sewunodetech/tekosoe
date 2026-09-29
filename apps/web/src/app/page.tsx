import Link from "next/link";
import { Inter } from "next/font/google";
import type { CSSProperties } from "react";
import { Nav } from "@/components/landing/nav";
import s from "@/components/landing/landing.module.css";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260808_075824_7c8a2ef3-826c-43ca-81a1-162429faa306.mp4";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

const d = (v: string) => ({ "--d": v }) as CSSProperties;

function Arrow() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10h10.2M10.4 5.6 15.2 10l-4.8 4.4" />
    </svg>
  );
}

// Landing satu layar (tanpa scroll di desktop), mengikuti spesifikasi hero 1:1. Responsif: menu burger di ≤820px.
export default function LandingPage() {
  return (
    <div className={`${s.page} ${inter.variable}`}>
      <div className={s.bg} aria-hidden="true">
        <video className={s.bgVideo} autoPlay muted loop playsInline>
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
      </div>

      <Nav />

      <section className={s.hero} aria-labelledby="hero-title">
        <p className={`${s.badge} ${s.wipe}`} style={d("0.18s")}>
          <span className={s.badgeMark} />
          Shared pot for group trips
        </p>

        <h1 id="hero-title" className={s.headline}>
          <span className={s.headlineMask}>
            <span className={s.headlineRise} style={d("0.26s")}>
              Chip in together,
            </span>
          </span>
          <span className={s.headlineMask}>
            <span className={`${s.headlineRise} ${s.headlineLine}`} style={d("0.4s")}>
              <span className={s.headlineMuted}>and Teko settles </span>
              <span className={s.headlineAccent} data-text="everyone up.">
                everyone up.
              </span>
            </span>
          </span>
        </h1>

        <div className={s.actions}>
          <Link href="/trips" className={`${s.btn} ${s.btnLight} ${s.wipe}`} style={d("0.56s")}>
            <span>Open dashboard</span>
            <span className={s.btnIcon}>
              <Arrow />
            </span>
          </Link>
          <Link href="/trips/japan" className={`${s.btn} ${s.btnGhost} ${s.wipe}`} style={d("0.66s")}>
            <span>See a trip in action</span>
          </Link>
        </div>

      </section>

      <div className={s.lede}>
        <p className={s.ledeRise}>
          Friends from any country put dollars into one shared pot and spend from it together. On the last day Tekosoe works out who owes whom and evens it out, with no passwords and nothing to chase.
        </p>
      </div>
    </div>
  );
}
