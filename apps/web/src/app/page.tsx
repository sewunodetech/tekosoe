import Link from "next/link";
import { Bob, Coin, Sparkle } from "@/components/decor";
import { Icon, type IconName } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { Teko } from "@/components/Teko";
import { TripCard } from "@/components/trip";
import { Avatar, type AvatarTint } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/layout";
import { repo } from "@/data/repo";
import { GET_APP_HREF } from "@/lib/links";

const CHIPS: { name: string; country: string; tint: AvatarTint }[] = [
  { name: "Rina", country: "Indonesia", tint: "bg-apricot" },
  { name: "Wei", country: "Singapore", tint: "bg-green-soft" },
  { name: "Jack", country: "Australia", tint: "bg-sky" },
];

const STEPS: { icon: IconName; tint: string; title: string; body: string }[] = [
  { icon: "plus", tint: "bg-mint", title: "Chip in", body: "Everyone puts dollars into one shared pot. Friends from any country, one currency." },
  { icon: "pay", tint: "bg-cream", title: "Spend together", body: "Anyone can pay from the pot. Bigger payments need one friend to say yes." },
  { icon: "check", tint: "bg-green-soft", title: "Settle up itself", body: "On the last day Teko works out who owes whom and evens it out. Nothing to chase." },
];

const REASONS: { icon: IconName; title: string; body: string }[] = [
  { icon: "faceId", title: "Sign in with your face", body: "Your passkey lives on your phone. No passwords, no secret words to remember." },
  { icon: "lock", title: "Receipts stay private", body: "Receipts are locked on your phone before they leave it. Only your group can open them." },
  { icon: "shield", title: "A safety net, only if needed", body: "Spend more than you put in and a small cushion you chose covers it at settle-up." },
];

// 01 Welcome, dilebarkan menjadi landing — apps/mobile/src/app/index.tsx
export default async function LandingPage() {
  const japan = await repo.getTrip("japan");

  return (
    <div className="flex flex-1 flex-col gap-10 px-6 pt-[calc(env(safe-area-inset-top)+28px)] pb-[calc(env(safe-area-inset-bottom)+28px)]">
      <header className="flex items-center justify-between">
        <Logo />
        <Link href="/trips" className="rounded-full bg-white px-4 py-2.5 text-[13px] font-bold transition-colors hover:bg-sand">
          Open dashboard
        </Link>
      </header>

      <section className="flex flex-col gap-5" aria-labelledby="hero">
        <div className="relative mx-auto h-[350px] w-full">
          <span className="absolute top-10 left-1/2 h-[260px] w-[260px] -translate-x-1/2 rounded-full bg-mint" />
          <div className="absolute top-[70px] left-1/2 -translate-x-1/2">
            <Teko mood="pour" size={170} />
          </div>
          <Bob duration={3800} delay={500} className="absolute top-[18px] left-0">
            <CountryChip {...CHIPS[0]} />
          </Bob>
          <Bob duration={4200} delay={1000} className="absolute top-[130px] right-0">
            <CountryChip {...CHIPS[1]} />
          </Bob>
          <Bob duration={3200} className="absolute top-[262px] left-3.5">
            <CountryChip {...CHIPS[2]} />
          </Bob>
          <Coin size={28} className="top-6 right-9" />
          <Coin size={24} className="top-[290px] right-[60px]" />
          <Sparkle size={24} className="top-[118px] left-[58px]" />
          <Sparkle size={16} color="var(--color-lavender)" className="top-20 right-[30px]" delay={800} />
        </div>

        <div className="flex flex-col gap-2.5">
          <h1 id="hero" className="type-hero">
            One pot for the whole trip.
          </h1>
          <p className="type-body text-slate">
            Friends from any country chip in, spend together, and Teko settles everyone up on the last day.
          </p>
        </div>

        <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] max-w-2xl text-[#1d2426]">
          One pot for the whole trip. It settles up by itself.
        </h1>

        <p className="text-base sm:text-xl text-[#5f6b6d] max-w-xl leading-relaxed">
          Everyone puts dollars into one shared pot, from any country. Anyone can pay from it, and on the last day Tekosoe works out who owes whom and pays everyone back.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto pt-2">
          <Link
            href="/j/japan"
            className="inline-flex items-center justify-center px-8 py-4 bg-[#1f7a6e] hover:bg-[#16574e] text-white text-base font-display font-bold rounded-2xl transition-all shadow-md active:scale-98"
          >
            Open Invite Demo
          </Link>
          <Link
            href="/v/TK-84920"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#1d2426] border border-[#e6e2d8] text-base font-display font-bold rounded-2xl hover:bg-[#f1eee6] transition-all shadow-sm active:scale-98"
          >
            Verify Invoice
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-3.5" aria-labelledby="how">
        <h2 id="how" className="type-h2">
          How it works
        </h2>
        {STEPS.map((s, i) => (
          <div key={s.title} className="flex items-start gap-3.5 rounded-card bg-white px-[18px] py-4">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-tile text-teal ${s.tint}`}>
              <Icon name={s.icon} strokeWidth={2.2} />
            </span>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-extrabold tracking-[0.5px] text-slate">STEP {i + 1}</p>
              <h3 className="type-h3">{s.title}</h3>
              <p className="type-caption text-slate">{s.body}</p>
            </div>
            <h3 className="font-display font-extrabold text-lg text-[#1d2426]">Sign in with a passkey</h3>
            <p className="text-sm text-[#5f6b6d] leading-relaxed">
              Log in with your device passkey: Face ID, fingerprint or PIN. Nothing to install, nothing to pay for.
            </p>
          </div>
        ))}
      </section>

      {japan && (
        <section className="flex flex-col gap-3.5" aria-labelledby="see">
          <div className="flex items-center gap-2.5">
            <h2 id="see" className="type-h2">
              See it in action
            </h2>
            <Pill label="Demo" tone="bg-butter text-ink" />
          </div>
          <TripCard trip={japan} tone="mint" />
          <Button href="/trips" label="Open the demo dashboard" variant="outline" />
        </section>
      )}

      <section className="flex flex-col gap-3.5" aria-labelledby="why">
        <h2 id="why" className="type-h2">
          Made to be easy
        </h2>
        <div className="rounded-card bg-white px-[18px]">
          {REASONS.map((r, i) => (
            <div key={r.title} className={`flex items-start gap-3 py-3.5 ${i < REASONS.length - 1 ? "border-b border-sand" : ""}`}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mint text-teal">
                <Icon name={r.icon} size={18} strokeWidth={2} />
              </span>
              <div className="flex flex-col gap-0.5">
                <h3 className="text-sm font-bold">{r.title}</h3>
                <p className="type-caption text-slate">{r.body}</p>
              </div>
            </div>
            <h3 className="font-display font-extrabold text-lg text-[#1d2426]">Settles up by itself</h3>
            <p className="text-sm text-[#5f6b6d] leading-relaxed">
              No chasing friends for money. Everyone gets an invoice, and anyone can check it hasn&apos;t been changed.
            </p>
          </div>
        </div>
      </section>

      <section id="get-app" className="flex scroll-mt-6 flex-col items-center gap-3 rounded-hero bg-cream px-5 py-6 text-center" aria-labelledby="get">
        <Teko mood="wink" size={92} />
        <h2 id="get" className="type-h2">
          Get the Tekosoe app
        </h2>
        <p className="type-caption max-w-[300px] text-slate">
          Tekosoe is a preview build for now. Ask a friend for a trip invite link. Opening it on your phone takes you straight in.
        </p>
        <Button href="/j/japan" label="See an invite" variant="outline" />
      </section>

      <footer className="flex flex-col items-center gap-2 text-center text-xs text-slate">
        <Logo size={16} />
        <p>Built for the Monad Metropolis hackathon · Consumer Products &amp; Payments</p>
      </footer>
    </div>
  );
}

function CountryChip({ name, country, tint }: { name: string; country: string; tint: AvatarTint }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white py-[5px] pr-3 pl-[5px] shadow-[0_8px_20px_rgba(29,36,38,0.08)]">
      <Avatar name={name} tint={tint} />
      <span className="text-[13px] font-bold">{country}</span>
    </div>
  );
}
