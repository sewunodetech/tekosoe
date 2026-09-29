"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GET_APP_HREF } from "@/lib/links";
import s from "./landing.module.css";

const LINKS = [
  { label: "Dashboard", href: "/trips" },
  { label: "Invite", href: "/j/japan" },
  { label: "Invoice", href: "/v/INV-JPN-0003" },
  { label: "Get the app", href: GET_APP_HREF },
];

const DELAYS = ["0.02s", "0.08s", "0.14s", "0.2s"];

function Arrow() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10h10.2M10.4 5.6 15.2 10l-4.8 4.4" />
    </svg>
  );
}

/** Nav atas + menu mobile. Burger tetap 3 garis (tanpa transformasi X), sesuai spesifikasi. */
export function Nav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className={s.nav}>
        <nav className={s.navLinks} aria-label="Primary">
          {LINKS.map((l, i) => (
            <Link key={l.label} href={l.href} className={s.navLink} style={{ animationDelay: DELAYS[i] }}>
              {l.label}
            </Link>
          ))}
        </nav>

        <Link href="/" className={s.logo} aria-label="Tekosoe">
          tekosoe
        </Link>

        <Link href="/trips" className={`${s.btn} ${s.btnPrimary} ${s.btnNav}`}>
          <span>Open dashboard</span>
          <span className={s.btnIcon}>
            <Arrow />
          </span>
        </Link>

        <button
          type="button"
          className={s.burger}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      <div id="mobile-menu" className={s.mobileMenu} hidden={!open}>
        <nav className={s.mobileLinks} aria-label="Mobile">
          {LINKS.map((l) => (
            <Link key={l.label} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
        </nav>
        <Link href="/trips" className={`${s.btn} ${s.btnPrimary}`} onClick={() => setOpen(false)}>
          <span>Open dashboard</span>
          <span className={s.btnIcon}>
            <Arrow />
          </span>
        </Link>
      </div>
    </>
  );
}
