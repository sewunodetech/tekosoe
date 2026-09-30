import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  ChevronDown,
  CircleDollarSign,
  FileCheck,
  Flag,
  Info,
  LayoutDashboard,
  MailOpen,
  PartyPopper,
  PiggyBank,
  Receipt,
  ScanFace,
  ShieldCheck,
  Star,
  Undo2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { MAX_GROUP_MEMBERS } from "@tekosoe/shared";
import { GET_APP_HREF } from "@/lib/links";

/*
 * Bagian informasi landing. Isinya harus sesuai perilaku produk di docs/02-prd.md;
 * kalau aturan di kontrak berubah (batas anggota, jendela keberatan, dsb.), ubah juga di sini.
 */

const REPO_URL = "https://github.com/sewunodetech/tekosoe";

function SectionHead({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="lg-reveal mx-auto mb-12 max-w-2xl text-center">
      <p className="lg-glass mb-4 inline-block rounded-full px-3.5 py-1 text-xs font-medium text-gray-700">{eyebrow}</p>
      <h2 className="text-4xl leading-[1.1] font-normal tracking-tight md:text-5xl">{title}</h2>
      {intro && <p className="mt-4 text-lg text-gray-600">{intro}</p>}
    </div>
  );
}

/* ---------- How it works ---------- */

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Flag, title: "Start a trip", body: "Name it, pick the last day, and set an approval limit. Share the invite link with your friends." },
  { icon: PiggyBank, title: "Chip in", body: "Everyone puts dollars into one shared pot. Friends in different countries all see the same amounts." },
  { icon: Receipt, title: "Spend together", body: "Anyone pays from the pot. Bigger payments wait for one friend to say yes." },
  { icon: PartyPopper, title: "Settle up itself", body: "On the last day Teko works out who owes whom, sends back what's left, and makes an invoice for each person." },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHead eyebrow="How it works" title="From first dollar to last day" intro="Four steps, and nobody has to keep a spreadsheet." />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="lg-glass lg-reveal rounded-3xl p-6">
              <div className="mb-5 flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 shadow-[inset_0_1px_0_#fff,0_4px_12px_-4px_rgba(15,23,42,0.18)]">
                  <s.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-gray-500">0{i + 1}</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
              <p className="text-sm leading-relaxed text-gray-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- Good to know ---------- */

const FACTS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: ScanFace, title: "Sign in with your passkey", body: "No passwords and no secret words to write down. Your account lives on your phone, and the same passkey opens it on a new one." },
  { icon: CircleDollarSign, title: "Everything is in dollars", body: "One currency for the whole group, so nobody loses money converting between countries." },
  { icon: ShieldCheck, title: "An approval limit protects the pot", body: "Payments above the limit you set need one friend to say yes. Nothing leaves the pot until then, and the request closes after 24 hours." },
  { icon: PiggyBank, title: "A safety net, only if needed", body: "When you join you choose a small safety net. If you spend more than you put in, up to that amount is collected at settle-up. If not, nothing is taken." },
  { icon: Undo2, title: "Not part of a payment? Say so", body: "You have 24 hours to tap “I wasn't part of this”. Your share moves back to the person who paid." },
  { icon: CalendarCheck, title: "Settle-up happens on its own", body: "On the trip's last day everyone is evened out automatically. What you didn't use comes back to you." },
  { icon: Users, title: `Up to ${MAX_GROUP_MEMBERS} people per trip`, body: "Friends from any country can join from the invite link." },
  { icon: FileCheck, title: "An invoice for everyone", body: "Each person gets an invoice with every payment and a QR code, ready to save as a PDF or share." },
];

export function GoodToKnow() {
  return (
    <section id="good-to-know" className="scroll-mt-24 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHead eyebrow="Good to know" title="Before you start a trip" intro="The rules everyone in the group agrees to when they join." />
        <div className="lg-glass lg-reveal grid gap-x-10 gap-y-9 rounded-[2rem] p-7 sm:grid-cols-2 md:p-10 lg:grid-cols-4">
          {FACTS.map((f) => (
            <div key={f.title}>
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 shadow-[inset_0_1px_0_#fff,0_4px_12px_-4px_rgba(15,23,42,0.18)]">
                <f.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mb-2 text-base font-semibold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-gray-600">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="lg-glass lg-reveal mx-auto mt-8 flex max-w-3xl items-start gap-3 rounded-3xl p-5 text-left [--lg-tint:rgba(254,243,199,0.7)]" role="note">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-amber-900">
            <span className="font-semibold">Tekosoe is a preview.</span> It was built for the Monad Metropolis hackathon and runs with test dollars, so no real money moves
            yet. The dashboard on this site shows sample data.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------- Try the demo ---------- */

const DEMOS: { icon: LucideIcon; title: string; body: string; href: string }[] = [
  { icon: LayoutDashboard, title: "A trip in progress", body: "Japan Trip: the pot, balances and recent payments.", href: "/trips/japan" },
  { icon: MailOpen, title: "The invite a friend sees", body: "What opens when someone taps your invite link.", href: "/j/japan" },
  { icon: PartyPopper, title: "Settle-up day", body: "How the pot evened out between Rina, Wei and Jack.", href: "/trips/japan/settled" },
  { icon: FileCheck, title: "An invoice", body: "Every payment, the totals, and a QR code.", href: "/trips/japan/invoice/jack" },
];

export function TryDemo() {
  return (
    <section id="demo" className="scroll-mt-24 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHead eyebrow="Try the demo" title="Look around a real trip" intro="Three friends from Indonesia, Singapore and Australia on a trip to Japan. Sample data, nothing to sign up for." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DEMOS.map((d) => (
            <Link key={d.href} href={d.href} className="group lg-glass lg-lift lg-reveal flex flex-col rounded-3xl p-6">
              <span className="lg-sheen" aria-hidden="true" />
              <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 shadow-[inset_0_1px_0_#fff,0_4px_12px_-4px_rgba(15,23,42,0.18)]">
                <d.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mb-2 text-base font-semibold">{d.title}</h3>
              <p className="mb-6 text-sm leading-relaxed text-gray-600">{d.body}</p>
              <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium">
                Open
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */

const FAQ: { q: string; a: string }[] = [
  { q: "Do I need to create an account?", a: "Your account is made the moment you join your first trip, with your phone's passkey. There is no password and nothing to fill in besides your name." },
  { q: "My friends live in different countries. Does that matter?", a: "No. Everyone chips in and spends in dollars, so the whole group sees the same numbers wherever they are." },
  { q: "Who can spend from the pot?", a: "Anyone in the trip. Payments under the approval limit go through right away. Above it, one friend has to say yes first." },
  { q: "What happens to money left in the pot?", a: "On the last day it goes back to the people who put it in, based on what each person actually used." },
  { q: "What if someone spent more than they put in?", a: "Their safety net covers it first, up to the amount they chose. If that isn't enough, their invoice shows what's still to pay." },
  { q: "Can Tekosoe take or freeze our money?", a: "No. The pot is controlled by the trip's rules, not by us. Tekosoe never holds your money or the key to your account." },
  { q: "Is the dashboard on this website my real account?", a: "Not yet. It's a preview with sample data so you can see how a trip looks. Real trips live in the Tekosoe app." },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 py-24">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHead eyebrow="FAQ" title="Questions people ask" />
        <div className="lg-glass lg-reveal divide-y divide-black/5 rounded-[2rem] px-6 py-2 md:px-8">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-left text-base font-medium [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown className="h-5 w-5 shrink-0 text-gray-500 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="pr-10 pb-5 text-sm leading-relaxed text-gray-600">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Closing CTA + footer ---------- */

export function ClosingCta() {
  return (
    <section className="px-6 pb-24">
      <div className="lg-reveal relative isolate mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#0b0c0e] px-6 py-16 text-center text-white md:py-24">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <span className="lg-blob -top-24 left-[8%] h-72 w-72 bg-[#1f7a6e] opacity-70" />
          <span className="lg-blob -bottom-28 right-[10%] h-80 w-80 bg-[#7c6cf0] opacity-60 [--dx:-50px] [--dy:30px] [--dur:26s]" />
          <span className="lg-blob top-1/3 left-1/2 h-56 w-56 bg-[#ff9a62] opacity-40 [--dx:30px] [--dy:40px] [--dur:30s]" />
        </div>
        <h2 className="mx-auto mb-4 max-w-2xl text-4xl leading-[1.1] font-normal tracking-tight md:text-5xl">Planning a trip with friends?</h2>
        <p className="mx-auto mb-8 max-w-xl text-lg text-gray-300">See how one shared pot works before you go.</p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/trips" className="rounded-full bg-white px-8 py-3 text-base font-medium text-black shadow-[0_10px_30px_-10px_rgba(255,255,255,0.5)] transition-transform hover:-translate-y-0.5">
            Open dashboard
          </Link>
          <Link href={GET_APP_HREF} className="lg-glass lg-glass-dark rounded-full px-8 py-3 text-base font-medium text-white transition-transform hover:-translate-y-0.5">
            Get the app
          </Link>
        </div>
      </div>
    </section>
  );
}

const FOOTER: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Learn",
    links: [
      { label: "How it works", href: "#how" },
      { label: "Good to know", href: "#good-to-know" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Try it",
    links: [
      { label: "Dashboard", href: "/trips" },
      { label: "Invite", href: "/j/japan" },
      { label: "Invoice", href: "/trips/japan/invoice/jack" },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "Get the app", href: GET_APP_HREF },
      { label: "Source code", href: REPO_URL },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-black/5 bg-white/40 backdrop-blur-md">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Star className="h-5 w-5 fill-black" aria-hidden="true" />
            <span className="text-lg font-semibold">Tekosoe</span>
          </div>
          <p className="max-w-xs text-sm text-gray-600">One shared pot for group trips that settles everyone up on the last day.</p>
        </div>
        {FOOTER.map((col) => (
          <div key={col.title}>
            <h2 className="mb-3 text-sm font-semibold">{col.title}</h2>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.href.startsWith("http") ? (
                    <a href={l.href} target="_blank" rel="noreferrer" className="text-sm text-gray-600 hover:text-black">
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href} className="text-sm text-gray-600 hover:text-black">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto max-w-7xl border-t border-black/5 px-6 py-6 text-xs text-gray-600">
        © 2026 Tekosoe · Built for the Monad Metropolis hackathon, Consumer Products &amp; Payments
      </div>
    </footer>
  );
}
