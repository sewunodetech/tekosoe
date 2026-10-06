// Tipe untuk inti encoder `qrcode` (dipakai components/invoice/qr-code.tsx); @types/qrcode hanya mengetik entry utama.
declare module 'qrcode/lib/core/qrcode' {
  import type { QRCode, QRCodeOptions } from 'qrcode';
  export function create(text: string, options?: QRCodeOptions): QRCode;
}
