"use client";

import { useEffect, useState } from "react";
import { Bob, Sparkle } from "@/components/decor";
import { Logo } from "@/components/Logo";
import { Teko } from "@/components/Teko";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/layout";
import { GENERIC_TRIP_NAME, loadInvite, type InviteResult } from "@/data/live/invite";
import { DEMO_TRIP_IDS, repo } from "@/data/repo";
import { inviteFacts } from "@/lib/invite-facts";
import { GET_APP_HREF, appLink } from "@/lib/links";
import { segmentAfter } from "@/lib/shell-path";
import { useBrowserLocation } from "@/lib/use-location";

type State = { kind: "loading" } | InviteResult;

/** Undangan contoh untuk tautan demo di landing (`/j/japan`): data demo, bukan trip nyata. */
async function loadSampleInvite(code: string): Promise<InviteResult> {
  const trip = await repo.getTrip(code);
  if (!trip) return { kind: "invalid" };
  return {
    kind: "found",
    trip: {
      name: trip.name,
      memberCount: trip.members.length,
      endsAt: 0,
      endsLabel: trip.settlesOn,
      pot: trip.pot,
      approvalLimit: trip.approvalLimit,
      settled: false,
      sample: true,
    },
  };
}

// 05 Invite, versi web — apps/mobile/src/app/invite/[code]/index.tsx.
// Shell statis /j/_: kode dibaca dari path di browser, data trip dari Envio + api (hanya groupId yang dikirim).
export function InviteView() {
  const location = useBrowserLocation();
  const code = location ? segmentAfter(location.pathname, "/j/") : null;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (code === null) return;
    let alive = true;
    (DEMO_TRIP_IDS.includes(code) ? loadSampleInvite(code) : loadInvite(code)).then(
      (result) => alive && setState(result),
      () => alive && setState({ kind: "generic" }),
    );
    return () => {
      alive = false;
    };
  }, [code, attempt]);

  const retry = () => {
    setState({ kind: "loading" });
    setAttempt((n) => n + 1);
  };

  return (
    <Screen
      gap="gap-5"
      footer={
        <>
          {state.kind !== "invalid" && code ? (
            <Button href={appLink(`invite/${encodeURIComponent(code)}`)} label="Open in Tekosue" />
          ) : null}
          <Button href={GET_APP_HREF} label="Get the app" variant="outline" />
          <p className="type-caption text-center text-slate">New here? Your account is created as you join.</p>
        </>
      }
    >
      <section className="relative h-[260px] overflow-hidden rounded-invite bg-mint">
        <div className="absolute top-5 left-5">
          <Logo size={20} dot={false} />
        </div>
        <Bob className="absolute top-14 left-1/2 -translate-x-1/2">
          <Teko mood={state.kind === "invalid" || state.kind === "not-found" ? "sad" : "love"} size={160} bob={false} />
        </Bob>
        <Sparkle size={22} className="top-[90px] left-[70px]" />
        <Sparkle size={16} color="var(--color-coin)" className="top-[60px] right-[70px]" delay={800} />
      </section>

      <InviteBody state={state} onRetry={retry} />
    </Screen>
  );
}

function InviteBody({ state, onRetry }: { state: State; onRetry: () => void }) {
  switch (state.kind) {
    case "loading":
      return (
        <div className="flex flex-col gap-1.5" aria-live="polite">
          <p className="text-[15px] font-semibold text-slate">A friend invited you to</p>
          <p className="type-body text-slate">Loading your invite…</p>
        </div>
      );
    case "found":
      return (
        <>
          <div className="flex flex-col gap-1.5">
            <p className="text-[15px] font-semibold text-slate">A friend invited you to</p>
            <h1 className="type-hero">{state.trip.name}</h1>
            {state.trip.settled ? <p className="type-body text-slate">This trip has already settled up.</p> : null}
            {state.trip.sample ? <p className="type-body text-slate">This is a sample invite with demo data.</p> : null}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {inviteFacts(state.trip).map((f) => (
              <Fact key={f.label} {...f} />
            ))}
          </div>
        </>
      );
    case "not-found":
      return (
        <Message title="We couldn't find this trip" body="Ask your friend for a new link." />
      );
    case "invalid":
      return (
        <Message title="This invite link doesn't look right" body="Ask your friend to share it again." />
      );
    case "generic":
      return (
        <div className="flex flex-col gap-1.5">
          <p className="text-[15px] font-semibold text-slate">A friend invited you to</p>
          <h1 className="type-hero">{GENERIC_TRIP_NAME}</h1>
          <p className="type-body text-slate">Open Tekosue on your phone to see who&apos;s in and join with your passkey.</p>
          <button type="button" onClick={onRetry} className="self-start text-sm font-bold text-teal hover:opacity-70">
            Try again
          </button>
        </div>
      );
  }
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="type-h1">{title}</h1>
      <p className="type-body text-slate">{body}</p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-row bg-white p-3">
      <p className="text-xs text-slate">{label}</p>
      <p className="text-sm font-extrabold">{value}</p>
    </div>
  );
}
