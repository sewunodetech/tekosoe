import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/site";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Tekosue — One pot for the whole trip",
    template: "%s · Tekosue",
  },
  description:
    "Friends from any country chip in to one shared pot, spend together, and Tekosue settles everyone up on the last day. Sign in with your passkey — no passwords.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#faf8f3",
  colorScheme: "light",
};

/**
 * Layout akar hanya memasang font dan body. Bingkai ponsel (mobile-only) ada di `(phone)/layout.tsx`;
 * landing `/` sengaja full-bleed.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${bricolage.variable} ${manrope.variable}`}>
      <body className="min-h-dvh font-body text-ink antialiased">{children}</body>
    </html>
  );
}
