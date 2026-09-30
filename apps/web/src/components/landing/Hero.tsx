"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Check, MapPin, PartyPopper, PiggyBank, Receipt, Star, type LucideIcon } from "lucide-react";
import { money, usd } from "@/lib/money";

type TabId = "plan" | "chipin" | "spend" | "settle";

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "plan", label: "Plan", icon: MapPin },
  { id: "chipin", label: "Chip in", icon: PiggyBank },
  { id: "spend", label: "Spend", icon: Receipt },
  { id: "settle", label: "Settle", icon: PartyPopper },
];

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_165750_358b1e72-c921-48b7-aaac-f200994f32fb.mp4";

/** Setiap bagian besar masuk dengan fade-in-up bertahap; opacity awal 0 diisi animasi. */
const fade = (delay: number): CSSProperties => ({ animationDelay: `${delay}s`, opacity: 0 });

export function Hero() {
  const [active, setActive] = useState<TabId>("plan");

  // Tab berganti sendiri tiap 4 detik (dimatikan bila pengguna memilih "kurangi gerakan").
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setActive((cur) => TABS[(TABS.findIndex((t) => t.id === cur) + 1) % TABS.length]!.id);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {/* Hero */}
      <section id="top" className="relative mx-auto max-w-7xl px-6 pt-16 pb-24 text-center md:pt-20">
        <div className="lg-dots" aria-hidden="true" />
        <div className="animate-fade-in-up lg-glass mb-8 inline-flex items-center gap-2 rounded-full py-1.5 pr-4 pl-1.5" style={fade(0.2)}>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80">
            <Star className="h-3.5 w-3.5 fill-black" aria-hidden="true" />
          </span>
          <span className="text-sm font-medium text-black">Shared pot for group trips</span>
        </div>

        <h1 className="animate-fade-in-up mb-5 text-6xl leading-[1.1] font-normal tracking-tight md:text-7xl lg:text-[80px]" style={fade(0.3)}>
          One pot for the whole trip.
          <br />
          <span className="lg-shimmer">Teko settles the rest.</span>
        </h1>

        <p className="animate-fade-in-up mx-auto mb-8 max-w-2xl text-lg text-gray-600 md:text-xl" style={fade(0.4)}>
          Friends from any country chip in, spend together, and Teko settles everyone up on the last day.
        </p>

        <div className="animate-fade-in-up" style={fade(0.5)}>
          <Link href="/trips" className="lg-btn mb-12 inline-block rounded-full px-8 py-3 text-base font-medium text-white">
            Open dashboard
          </Link>
        </div>

        {/* Tab bar */}
        <div className="animate-fade-in-up mb-8 flex justify-center" style={fade(0.6)}>
          <div className="lg-glass rounded-2xl p-1.5" role="tablist" aria-label="How a trip works">
            {/* Mobile: 2×2 */}
            <div className="grid grid-cols-2 gap-1 md:hidden">
              {TABS.map((t) => (
                <TabButton key={t.id} tab={t} active={active === t.id} onSelect={setActive} />
              ))}
            </div>
            {/* Desktop: satu baris dengan pemisah */}
            <div className="hidden items-center md:flex">
              {TABS.map((t, i) => (
                <div key={t.id} className="flex items-center">
                  {i > 0 && <span className="h-5 w-px bg-black/10" aria-hidden="true" />}
                  <TabButton tab={t} active={active === t.id} onSelect={setActive} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Video + overlay */}
        <div className="animate-fade-in-up relative" style={fade(0.7)}>
          <div className="lg-glow" aria-hidden="true" />
          <div className="lg-glass rounded-[2rem] p-2">
          <div className="relative h-[400px] overflow-hidden rounded-3xl md:h-[500px]">
          <video className="h-full w-full object-cover" autoPlay loop muted playsInline aria-hidden="true">
            <source src={VIDEO_SRC} type="video/mp4" />
          </video>
          {active === "plan" && <PlanCard />}
          {active === "chipin" && <ChipInCard />}
          {active === "spend" && <SpendCard />}
          {active === "settle" && <SettleCard />}
          </div>
          </div>
        </div>

        {/* Built for */}
        <div className="animate-fade-in-up mt-24 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-gray-400" style={fade(0.8)}>
          <span className="text-sm">Built for</span>
          <span className="text-lg font-semibold tracking-[0.2em]">MONAD METROPOLIS</span>
          <span className="text-sm">Consumer Products &amp; Payments</span>
        </div>
      </section>
    </>
  );
}

function TabButton({ tab, active, onSelect }: { tab: (typeof TABS)[number]; active: boolean; onSelect: (id: TabId) => void }) {
  const Icon = tab.icon;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => onSelect(tab.id)}
      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 ${
        active ? "bg-white text-black shadow-[0_4px_14px_-4px_rgba(15,23,42,0.25),inset_0_1px_0_#fff]" : "text-gray-600 hover:bg-white/40 hover:text-black"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {tab.label}
    </button>
  );
}

/** Bingkai overlay: lapisan fade + kartu putih di tengah video. */
function Overlay({ children }: { children: ReactNode }) {
  return (
    <div className="animate-fade-in-overlay absolute inset-0 bg-black/10" style={{ opacity: 0 }}>
      <div
        className="animate-slide-up-overlay lg-glass absolute top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-md rounded-3xl p-6 text-left [--lg-tint:rgba(255,255,255,0.7)] [--lg-blur:28px]"
        style={{ opacity: 0 }}
      >
        {children}
      </div>
    </div>
  );
}

function CardHead({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-base font-semibold text-black">{title}</h3>
      <span className="text-xs text-gray-600">{meta}</span>
    </div>
  );
}

function Progress({ value, color }: { value: number; color: string }) {
  return (
    <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-black/10" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function CheckDot({ done }: { done: boolean }) {
  return (
    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${done ? "bg-green-500 text-white" : "border border-gray-400/70 bg-white/50 text-transparent"}`}>
      <Check className="h-3 w-3" aria-hidden="true" />
    </span>
  );
}

function PlanCard() {
  const steps = [
    { label: "Name your trip", done: true },
    { label: "Pick the end date", done: false },
    { label: "Set the approval limit", done: false },
    { label: "Invite your friends", done: false },
  ];
  return (
    <Overlay>
      <CardHead title="Start your trip pot" meta="Step 1 of 4" />
      <Progress value={25} color="bg-purple-500" />
      <ul className="space-y-3">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-3 text-sm text-gray-800">
            <CheckDot done={s.done} />
            {s.label}
          </li>
        ))}
      </ul>
    </Overlay>
  );
}

function ChipInCard() {
  const metrics = [
    { label: "In the pot", value: money(usd(150)) },
    { label: "Friends", value: "3" },
    { label: "Countries", value: "3" },
    { label: "Your balance", value: `+${money(usd(70))}` },
  ];
  return (
    <Overlay>
      <CardHead title="Chip in to the pot" meta="Japan Trip · sample" />
      <Progress value={67} color="bg-orange-500" />
      <dl className="grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl bg-white/60 px-4 py-3 shadow-[inset_0_1px_0_#fff]">
            <dt className="text-xs text-gray-600">{m.label}</dt>
            <dd className="text-lg font-semibold text-black">{m.value}</dd>
          </div>
        ))}
      </dl>
    </Overlay>
  );
}

function SpendCard() {
  const payments = [
    { label: "Dinner in Shibuya", amount: money(usd(90)) },
    { label: "Ramen and karaoke", amount: money(usd(60)) },
    { label: "Train tickets to Kyoto", amount: money(usd(150)) },
  ];
  return (
    <Overlay>
      <CardHead title="Spending from the pot" meta="Japan Trip · sample" />
      <div className="mb-4 flex items-center gap-3 rounded-xl bg-green-100/70 px-4 py-3">
        <CheckDot done />
        <div>
          <p className="text-sm font-semibold text-green-700">3 of 3 payments went through</p>
          <p className="text-xs text-green-700/80">Anything big needed one friend&apos;s yes</p>
        </div>
      </div>
      <ul className="space-y-2.5">
        {payments.map((p) => (
          <li key={p.label} className="flex items-center justify-between text-sm">
            <span className="text-gray-800">{p.label}</span>
            <span className="font-medium text-black">{p.amount}</span>
          </li>
        ))}
      </ul>
    </Overlay>
  );
}

function SettleCard() {
  const items = ["Pot closed on Oct 14", "Everyone's share worked out", "Refunds sent back", "Invoices ready to save"];
  return (
    <Overlay>
      <CardHead title="Settle up" meta="Japan Trip · sample" />
      <ul className="mb-5 space-y-3">
        {items.map((label) => (
          <li key={label} className="flex items-center gap-3 text-sm text-gray-800">
            <CheckDot done />
            {label}
          </li>
        ))}
      </ul>
      <Link href="/trips/japan/invoice/jack" className="lg-btn block w-full rounded-full py-2.5 text-center text-sm font-medium text-white">
        See your invoice
      </Link>
    </Overlay>
  );
}
