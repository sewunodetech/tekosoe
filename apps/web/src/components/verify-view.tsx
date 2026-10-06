"use client";

import { useEffect, useState } from "react";
import { LiveInvoiceSummary, VerifyCard } from "@/components/invoice";
import { InvoiceQr } from "@/components/invoice-qr";
import { Logo } from "@/components/Logo";
import { Teko, type TekoMood } from "@/components/Teko";
import { Button } from "@/components/ui/button";
import { Pill, Screen } from "@/components/ui/layout";
import { loadVerification, type VerifyResult } from "@/data/live/verify";
import { cn } from "@/lib/cn";
import { GET_APP_HREF } from "@/lib/links";
import { segmentAfter } from "@/lib/shell-path";
import { useBrowserLocation } from "@/lib/use-location";
import { ACCESS_PARAM, verifyHref, verifyLabel } from "@/lib/verify-link";

/** Teks setiap status pemeriksaan (tanpa istilah teknis). */
export const VERIFY_COPY: Record<Exclude<VerifyResult["kind"], "match">, { mood: TekoMood; tone: string; text: string }> & {
  match: { mood: TekoMood; tone: string; text: string };
} = {
  loading: { mood: "think", tone: "bg-sand text-slate", text: "Rebuilding this invoice from the trip record…" },
  match: { mood: "wink", tone: "bg-green-soft text-green-deep", text: "Checked: this invoice matches the trip's records" },
  mismatch: { mood: "worry", tone: "bg-peach-soft text-rust", text: "This invoice doesn't match the trip's records. Don't rely on it." },
  "invalid-link": { mood: "sad", tone: "bg-sand text-slate", text: "This link is invalid or has expired. Ask for a fresh one from the app." },
  unavailable: { mood: "sleep", tone: "bg-sand text-slate", text: "We can't check this invoice right now. Try again in a minute." },
};

// Halaman tujuan QR invoice (www.tekosue.xyz/v/<nomor>?<kode akses>). Shell statis /v/_: nomor dari path,
// kode akses dari query; invoice dibangun ulang dari catatan trip (Envio) lalu dicocokkan dengan invoice dari api.
export function VerifyView() {
  const location = useBrowserLocation();
  const number = location ? segmentAfter(location.pathname, "/v/") : null;
  const accessKey = location ? new URLSearchParams(location.search).get(ACCESS_PARAM) : null;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<VerifyResult>({ kind: "loading" });

  useEffect(() => {
    if (number === null) return;
    let alive = true;
    loadVerification(number, accessKey).then(
      (value) => alive && setResult(value),
      () => alive && setResult({ kind: "unavailable" }),
    );
    return () => {
      alive = false;
    };
  }, [number, accessKey, attempt]);

  const retry = () => {
    setResult({ kind: "loading" });
    setAttempt((n) => n + 1);
  };

  const copy = VERIFY_COPY[result.kind];

  return (
    <Screen gap="gap-3" footer={<Button href={GET_APP_HREF} label="Get the app" variant="outline" />}>
      <div className="flex items-center justify-between">
        <Logo size={20} />
        <Pill label={result.kind === "loading" ? "Checking…" : "Trip invoice"} tone="bg-sand text-slate" />
      </div>

      <div className={cn("flex items-center gap-3 rounded-row p-3", copy.tone)} aria-live="polite">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white">
          <Teko mood={copy.mood} size={40} bob={false} />
        </span>
        <p className="flex-1 text-xs font-extrabold">{copy.text}</p>
      </div>

      {result.kind === "unavailable" ? (
        <Button label="Try again" variant="pill" onClick={retry} className="self-start" />
      ) : null}

      {result.kind === "match" ? (
        <>
          <LiveInvoiceSummary summary={result.summary} />
          <VerifyCard label={verifyLabel(result.summary.number)}>
            <InvoiceQr href={verifyHref(result.summary.number, accessKey)} label={verifyLabel(result.summary.number)} />
          </VerifyCard>
        </>
      ) : null}
    </Screen>
  );
}
