import { Frame } from "@/components/Frame";
import { Teko } from "@/components/Teko";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/layout";

export default function NotFound() {
  return (
    <Frame>
      <Screen footer={<Button href="/trips" label="Back to your trips" />}>
        <div className="flex flex-col items-center gap-3 pt-16 text-center">
          <span className="flex h-[150px] w-[150px] items-center justify-center rounded-full bg-sky-soft">
            <Teko mood="sad" size={120} />
          </span>
          <h1 className="type-h2">We couldn&apos;t find that page</h1>
          <p className="type-caption max-w-[280px] text-slate">Check the link and try again. Nothing was lost.</p>
        </div>
      </Screen>
    </Frame>
  );
}
