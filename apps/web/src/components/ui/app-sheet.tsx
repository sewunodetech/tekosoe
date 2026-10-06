"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { Teko } from "../Teko";
import { Button } from "./button";
import { GET_APP_HREF, appLink } from "@/lib/links";
import { cn } from "@/lib/cn";

type Props = {
  /** Isi tombol pemicu (tile aksi, tombol, dsb). */
  children: ReactNode;
  className?: string;
  /** Path deep link di app, mis. "trip/japan". */
  deepLink?: string;
  title?: string;
  message?: string;
};

/**
 * Dashboard web hanya-baca. Semua aksi uang (Add money, Pay, Join) terjadi di app dan
 * ditandatangani dengan passkey, jadi tombolnya membuka bottom sheet "buka di app".
 */
export function AppAction({
  children,
  className,
  deepLink = "",
  title = "Do this in the Tekosue app",
  message = "This page is a preview. Adding money, paying and joining a trip happen on your phone, confirmed with your passkey.",
}: Props) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

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
    <>
      <button type="button" onClick={() => setOpen(true)} className={className} aria-haspopup="dialog">
        {children}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] items-end" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="tk-fade absolute inset-0 bg-ink/50" />
          <div className={cn("tk-sheet relative flex w-full flex-col items-center gap-3 rounded-t-[28px] bg-white px-5 pt-6 pb-[calc(env(safe-area-inset-bottom)+20px)]")}>
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-peach-soft">
              <Teko mood="wink" size={76} />
            </div>
            <h2 id={titleId} className="type-h2 text-center">
              {title}
            </h2>
            <p className="max-w-[320px] text-center text-sm leading-[21px] text-slate">{message}</p>
            <div className="mt-2 flex w-full flex-col gap-2">
              <Button href={appLink(deepLink)} label="Open Tekosue" />
              <Button href={GET_APP_HREF} label="Get the app" variant="outline" />
              <Button label="Not now" variant="ghost" onClick={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
