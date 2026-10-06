import type { InviteTrip } from "@/data/live/invite";
import { money, moneyShort } from "./money";

const endsLabel = (seconds: number) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(seconds * 1000));

/** Fakta trip untuk kartu undangan. Nominal hanya lewat money()/moneyShort(). */
export function inviteFacts(trip: InviteTrip): { label: string; value: string }[] {
  return [
    { label: "Members", value: String(trip.memberCount) },
    { label: "Ends", value: trip.endsLabel ?? endsLabel(trip.endsAt) },
    { label: "In the pot", value: money(trip.pot) },
    { label: "Approval", value: `Over ${moneyShort(trip.approvalLimit)}` },
  ];
}
