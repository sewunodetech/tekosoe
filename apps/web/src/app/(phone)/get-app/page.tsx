import type { Metadata } from "next";
import { Teko } from "@/components/Teko";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/layout";

export const metadata: Metadata = { title: "Get the app" };

export default function GetAppPage() {
  return (
    <Screen
      footer={
        <>
          <Button href="/j/japan" label="See an invite" />
          <Button href="/" label="Back to home" variant="ghost" />
        </>
      }
    >
      <div className="flex flex-col items-center gap-3 pt-14 text-center">
        <span className="flex h-[180px] w-[180px] items-center justify-center rounded-full bg-cream">
          <Teko mood="wink" size={130} />
        </span>
        <h1 className="type-h1">Get the Tekosue app</h1>
        <p className="type-body max-w-[300px] text-slate">
          Tekosue is a preview build for now. Ask a friend for a trip invite link. Opening it on your phone takes you straight in.
        </p>
      </div>
    </Screen>
  );
}
