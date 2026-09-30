"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, Star, X } from "lucide-react";
import { GET_APP_HREF } from "@/lib/links";

/** Tautan ke bagian-bagian landing. Urutannya sama dengan urutan di halaman. */
export const SECTIONS = [
  { id: "how", label: "How it works" },
  { id: "good-to-know", label: "Good to know" },
  { id: "built-with", label: "Built with" },
  { id: "demo", label: "Try the demo" },
  { id: "faq", label: "FAQ" },
] as const;

/**
 * Navbar landing: menempel di atas, bagian yang sedang dibaca disorot, menu penuh di ponsel.
 * Tautan bagian memakai anchor biasa (`#how`), jadi tetap jalan tanpa JavaScript.
 */
export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);

  // Garis bawah navbar muncul setelah halaman digulir.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Sorot tautan untuk bagian yang sedang terlihat di tengah layar.
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setCurrent(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => observer.observe(el));
    const top = document.getElementById("top");
    const topObserver = new IntersectionObserver(([e]) => e?.isIntersecting && setCurrent(null), { rootMargin: "-45% 0px -50% 0px" });
    if (top) topObserver.observe(top);
    return () => {
      observer.disconnect();
      topObserver.disconnect();
    };
  }, []);

  // Menu ponsel: Escape menutup, halaman tidak ikut bergulir saat menu terbuka.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 px-3 pt-3">
      <a
        href="#main"
        className="sr-only rounded-full bg-black px-4 py-2 text-sm text-white focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
      >
        Skip to content
      </a>

      <nav
        aria-label="Main"
        className={`lg-glass mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 rounded-full pr-2 pl-5 transition-[box-shadow] duration-300 ${
          scrolled || open ? "" : "[--lg-shadow:0_2px_10px_-6px_rgba(15,23,42,0.12)]"
        }`}
      >
        <Link href="/" className="flex items-center gap-2" aria-label="Tekosoe home">
          <Star className="h-5 w-5 fill-black" aria-hidden="true" />
          <span className="text-lg font-semibold whitespace-nowrap">Tekosoe</span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={current === s.id ? "true" : undefined}
                className={`rounded-full px-3.5 py-2 text-sm transition-colors ${
                  current === s.id ? "bg-white/80 font-medium text-black shadow-[0_2px_8px_-3px_rgba(15,23,42,0.2),inset_0_1px_0_#fff]" : "text-gray-700 hover:bg-white/40 hover:text-black"
                }`}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link href={GET_APP_HREF} className="hidden rounded-full px-4 py-2.5 text-sm whitespace-nowrap text-gray-700 hover:text-black sm:inline-block">
            Get the app
          </Link>
          <Link
            href="/trips"
            className="lg-btn hidden rounded-full px-5 py-2.5 text-sm font-medium whitespace-nowrap text-white sm:inline-block"
          >
            Open dashboard
          </Link>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-800 hover:bg-white/60 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="landing-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      <div
        id="landing-menu"
        hidden={!open}
        className="lg-glass animate-fade-in-overlay mx-auto mt-2 max-h-[calc(100dvh-6rem)] max-w-6xl overflow-y-auto rounded-3xl px-5 pt-2 pb-5 [--lg-blur:30px] [--lg-tint:rgba(255,255,255,0.78)] lg:hidden"
      >
        <ul className="flex flex-col">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} onClick={() => setOpen(false)} className="block border-b border-black/5 py-4 text-lg text-gray-900">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-3">
          <Link href="/trips" onClick={() => setOpen(false)} className="lg-btn rounded-full py-3 text-center text-base font-medium text-white">
            Open dashboard
          </Link>
          <Link href={GET_APP_HREF} onClick={() => setOpen(false)} className="rounded-full border border-black/10 bg-white/60 py-3 text-center text-base font-medium text-black">
            Get the app
          </Link>
        </div>
      </div>
    </header>
  );
}
