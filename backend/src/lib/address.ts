import { getAddress } from "viem";
import { errors } from "./errors";

export const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;

export function isAddressLike(value: unknown): value is string {
  return typeof value === "string" && ADDRESS_PATTERN.test(value);
}

/** Canonical storage form: lowercase hex. Throws ApiError(400) when malformed. */
export function normalizeAddress(value: string): string {
  if (!isAddressLike(value)) throw errors.invalidAddress();
  return value.toLowerCase();
}

/** Canonical display form: EIP-55 checksum. Throws ApiError(400) when malformed. */
export function checksumAddress(value: string): string {
  if (!isAddressLike(value)) throw errors.invalidAddress();
  return getAddress(value);
}

export function sameAddress(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}
