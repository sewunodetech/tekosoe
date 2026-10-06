import type { Metadata } from "next";
import { Icon, type IconName } from "@/components/icons";
import { Teko } from "@/components/Teko";
import { AppAction } from "@/components/ui/app-sheet";
import { Screen } from "@/components/ui/layout";
import { repo } from "@/data/repo";
import { cn } from "@/lib/cn";
import { money } from "@/lib/money";

export const metadata: Metadata = { title: "Profile" };

// P2 Profile — apps/mobile/src/app/(tabs)/profile.tsx
export default async function ProfilePage() {
  const [profile, settled] = await Promise.all([repo.getProfile(), repo.listSettledTrips()]);

  return (
    <Screen tab gap="gap-4">
      <div className="flex h-12 items-center">
        <h1 className="type-h2">Profile</h1>
      </div>

      <section className="relative flex items-center gap-3.5 overflow-hidden rounded-trip bg-mint px-5 py-[18px]">
        <span className="pointer-events-none absolute -top-[30px] -right-[30px] h-[120px] w-[120px] rounded-full bg-mint-deep" />
        <span className={cn("relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[3px] border-white font-display text-[26px] font-bold", profile.tint)}>
          {profile.name.charAt(0).toUpperCase()}
        </span>
        <div className="relative flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="font-display text-[22px] leading-7 font-bold">{profile.name}</p>
          <p className="type-caption font-semibold text-teal-muted">
            {profile.city}, {profile.country}
          </p>
        </div>
        <AppAction deepLink="setup-profile" title="Edit your profile in the app" className="relative rounded-full bg-white px-3.5 py-2 text-[13px] font-extrabold">
          Edit
        </AppAction>
      </section>

      <div className="flex gap-2.5">
        <Stat label="Active trips" value={String(profile.stats.activeTrips)} />
        <Stat label="Settled" value={String(profile.stats.settled)} />
        <Stat label="Got back" value={money(profile.stats.gotBack)} positive />
      </div>

      <div className="flex items-center gap-3.5 rounded-card bg-white px-[18px] py-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-tile bg-mint text-teal">
          <Icon name="faceId" size={22} strokeWidth={2} />
        </span>
        <div className="flex flex-col gap-0.5">
          <p className="text-[15px] font-bold">Sign in with Passkey</p>
          <p className="type-caption text-slate">Your account lives on your phone. The same passkey opens it on a new phone.</p>
        </div>
      </div>

      <div className="rounded-card bg-white px-[18px]">
        <Row icon="bell" tint="bg-cream" title="Notifications" sub="Approvals, new payments, invoices" />
        <Row icon="home" tint="bg-sky" title="Past trips" sub={settled.map((s) => `${s.name} · settled`).join(", ") || "None yet"} chevron />
        <Row glyph="?" tint="bg-green-soft" title="Help and feedback" sub="How the pot and settle-up work" chevron last />
      </div>

      <div className="flex items-center gap-3">
        <Teko mood="idle" size={48} />
        <p className="flex-1 text-xs leading-[17px] text-slate">Tekosue v0.1 · made for friends who travel together</p>
      </div>
    </Screen>
  );
}

function Stat({ label, value, positive = false }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="flex-1 rounded-row bg-white px-3.5 py-3">
      <p className="text-xs text-slate">{label}</p>
      <p className={cn("font-display text-[22px] leading-7 font-bold", positive ? "text-green" : "text-ink")}>{value}</p>
    </div>
  );
}

function Row({
  icon,
  glyph,
  tint,
  title,
  sub,
  chevron = false,
  last = false,
}: {
  icon?: IconName;
  glyph?: string;
  tint: string;
  title: string;
  sub: string;
  chevron?: boolean;
  last?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3 py-3", !last && "border-b border-sand")}>
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", tint)}>
        {icon ? <Icon name={icon} size={18} strokeWidth={2} /> : <span className="text-[15px] font-extrabold">{glyph}</span>}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{title}</p>
        <p className="text-xs text-slate">{sub}</p>
      </div>
      {chevron && <Icon name="chevron" size={16} strokeWidth={2} className="text-slate" />}
    </div>
  );
}
