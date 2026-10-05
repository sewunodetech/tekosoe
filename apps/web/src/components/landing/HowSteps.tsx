"use client";

import { Flag, PartyPopper, PiggyBank, Receipt, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { StepsScene } from "./three/lazy";

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Flag, title: "Start a trip", body: "Name it, pick the last day, and set an approval limit. Share the invite link with your friends." },
  { icon: PiggyBank, title: "Chip in", body: "Everyone puts dollars into one shared pot. Friends in different countries all see the same amounts." },
  { icon: Receipt, title: "Spend together", body: "Anyone pays from the pot. Bigger payments wait for one friend to say yes." },
  { icon: PartyPopper, title: "Settle up itself", body: "On the last day Teko works out who owes whom, sends back what's left, and makes an invoice for each person." },
];

/**
 * Panel "How it works": diorama 3D di atas, empat kartu langkah di bawahnya.
 * Langkah berganti sendiri sampai pengguna menyorot/memilih kartu (diam saat "kurangi gerakan").
 */
export function HowSteps() {
  const [step, setStep] = useState(0);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (pinned || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 3800);
    return () => clearInterval(id);
  }, [pinned]);

  const choose = (i: number) => {
    setPinned(true);
    setStep(i);
  };

  return (
    <>
      <div className="lg-reveal lg-scene relative isolate h-[440px] overflow-hidden rounded-[2.5rem] md:h-[540px]">
        <StepsScene step={step} />
        <div className="pointer-events-none relative max-w-xl px-7 pt-10 md:px-12 md:pt-14">
          <p className="lg-glass mb-4 inline-block rounded-full px-3.5 py-1 text-xs font-medium text-gray-700">How it works</p>
          <h2 className="text-4xl leading-[1.1] font-normal tracking-tight md:text-5xl">From first dollar to last day</h2>
          <p className="mt-4 text-lg text-gray-700">Four steps, and nobody has to keep a spreadsheet.</p>
        </div>
      </div>
      <ol className="relative -mt-16 grid gap-4 px-3 sm:grid-cols-2 md:-mt-20 md:px-8 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="lg-reveal">
            <button
              type="button"
              onMouseEnter={() => choose(i)}
              onFocus={() => choose(i)}
              onClick={() => choose(i)}
              aria-pressed={step === i}
              className={`lg-glass h-full w-full rounded-3xl p-6 text-left transition-transform duration-300 ${step === i ? "-translate-y-1.5 ring-2 ring-teal" : ""}`}
            >
              <div className="mb-5 flex items-center justify-between">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_#fff,0_4px_12px_-4px_rgba(15,23,42,0.18)] transition-colors ${
                    step === i ? "bg-teal text-white" : "bg-white/80"
                  }`}
                >
                  <s.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-gray-500">0{i + 1}</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
              <p className="text-sm leading-relaxed text-gray-600">{s.body}</p>
            </button>
          </li>
        ))}
      </ol>
    </>
  );
}
