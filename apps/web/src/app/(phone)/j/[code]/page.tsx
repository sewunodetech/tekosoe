import type { Metadata } from "next";
import { InviteView } from "@/components/invite-view";

// Shell statis (ADR 0012): satu HTML untuk semua kode undangan. nginx mengarahkan /j/<kode> ke /j/_;
// InviteView membaca kode dari path di browser. Tanpa Referer supaya rahasia undangan di path tidak bocor.
export const metadata: Metadata = { title: "You're invited", robots: { index: false }, referrer: "no-referrer" };
export const dynamicParams = false;
export const generateStaticParams = () => [{ code: "_" }];

export default function InvitePage() {
  return <InviteView />;
}
