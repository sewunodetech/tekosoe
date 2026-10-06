"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

/**
 * QR asli ke halaman verifikasi. Komponen klien: di halaman shell /v/_ URL lengkap
 * (dengan kode akses) baru diketahui di browser.
 */
export function InvoiceQr({ href, label, size = 84 }: { href: string; label: string; size?: number }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    let alive = true;
    QRCode.toString(href, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#1d2426", light: "#0000" } })
      .then((s) => alive && setSvg(s))
      .catch(() => alive && setSvg(""));
    return () => {
      alive = false;
    };
  }, [href]);

  return (
    <span
      role="img"
      aria-label={`QR code that opens ${label}`}
      className="block shrink-0 rounded-tile bg-white p-2 [&>svg]:h-full [&>svg]:w-full"
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
