"use client";

import { Frame } from "@/components/Frame";
import { Teko } from "@/components/Teko";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/layout";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <Frame>
      <Screen footer={<Button label="Try again" onClick={reset} />}>
        <div className="flex flex-col items-center gap-3 pt-16 text-center">
          <span className="flex h-[150px] w-[150px] items-center justify-center rounded-full bg-sky-soft">
            <Teko mood="sad" size={120} />
          </span>
          <h1 className="type-h2">Teko couldn&apos;t load this</h1>
          <p className="type-caption max-w-[280px] text-slate">Check your connection and try again. Your money is safe in the pot.</p>
        </div>
      </Screen>
    </Frame>
  );
}
