import { env } from './env';
import { buildInvoiceVerifyLabel, buildInvoiceVerifyUrl } from './invoice-link-core';

/** URL verifikasi invoice di web (dengan kode akses kalau ada). */
export const invoiceVerifyUrl = (number: string, accessKey?: string | null) =>
  buildInvoiceVerifyUrl(env.webDomain, number, accessKey);

/** Label verifikasi yang terlihat (tanpa query). */
export const invoiceVerifyLabel = (number: string) => buildInvoiceVerifyLabel(env.webDomain, number);
