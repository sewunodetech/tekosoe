import type { Metadata } from "next";
import { VerifyView } from "@/components/verify-view";

// Halaman tujuan QR invoice (www.tekosue.xyz/v/<nomor>?…). Shell statis (ADR 0012): satu HTML untuk semua nomor;
// VerifyView membaca nomor + kode akses di browser lalu membangun ulang invoice dari catatan trip.
export const metadata: Metadata = { title: "Verify invoice", robots: { index: false }, referrer: "no-referrer" };
export const dynamicParams = false;
export const generateStaticParams = () => [{ number: "_" }];

export default function VerifyPage() {
  return <VerifyView />;
}
