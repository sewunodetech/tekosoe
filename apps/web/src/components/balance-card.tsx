import { Icon } from "@/components/icons";
import { AppAction } from "@/components/ui/app-sheet";
import { cn } from "@/lib/cn";
import { money } from "@/lib/money";

const MESSAGE =
  "This page is a preview. Topping up and cashing out happen in the app, confirmed with your passkey.";

/**
 * Kartu "Your balances" di Profile — salinan tampilan apps/mobile/src/components/balance-card.tsx (ADR 0006).
 * Web hanya pratinjau: Top up dan Cash out membuka sheet "lakukan di app", tidak ada aksi uang di web.
 */
export function BalanceCard({ balance }: { balance: bigint }) {
  const empty = balance === 0n;
  return (
    <section className="relative flex flex-col gap-4 overflow-hidden rounded-[26px] bg-mint px-5 py-[18px]" aria-label="Your balances">
      <span className="pointer-events-none absolute -top-[30px] -right-[30px] h-[120px] w-[120px] rounded-full bg-mint-deep" />

      <p className="relative text-[13px] font-bold text-teal-muted">Your balances</p>

      <div className="relative flex flex-col gap-1">
        <p className="type-amount-xl mr-[60px] truncate">{money(balance)}</p>
        <p className="type-caption text-teal-muted">
          {empty ? "Top up to start chipping in on trips." : "Ready to put into any trip, from any country."}
        </p>
      </div>

      <div className="relative flex gap-2.5">
        <AppAction
          deepLink="balance/top-up"
          title="Top up in the app"
          message={MESSAGE}
          className="flex h-[50px] flex-1 items-center justify-center gap-2 rounded-button bg-teal text-[15px] font-bold text-white hover:bg-teal-deep"
        >
          <Icon name="plus" size={18} strokeWidth={2.6} />
          Top up
        </AppAction>
        <AppAction
          deepLink="balance/cash-out"
          title="Cash out in the app"
          message={MESSAGE}
          className={cn(
            "flex h-[50px] flex-1 items-center justify-center gap-2 rounded-button border border-line bg-white text-[15px] font-bold text-ink hover:bg-sand",
            empty && "pointer-events-none opacity-45",
          )}
        >
          <Icon name="external" size={18} strokeWidth={2.4} />
          Cash out
        </AppAction>
      </div>
    </section>
  );
}
