import type { Address, LocalAccount } from 'viem';
import type { SpendNote } from '@tekosoe/shared';

import { requireLive } from './env';

/**
 * Label off-chain (nama, judul, invoice, push) lewat apps/api. App tidak pernah terhubung ke database.
 * Kontrak endpoint: apps/api/docs/API.md.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const isNotFound = (error: unknown) => error instanceof ApiError && error.status === 404;

type FetchOptions = { method?: string; body?: unknown; auth?: LocalAccount };

// Token sesi per alamat (login SIWE sekali, dipakai ulang sampai hampir kedaluwarsa).
const sessions = new Map<string, { token: string; expiresAt: number }>();

async function request<T>(path: string, options: FetchOptions = {}, retried = false): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (options.auth) headers.authorization = `Bearer ${await sessionToken(options.auth)}`;

  const res = await fetch(`${requireLive('apiUrl')}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (res.status === 401 && options.auth && !retried) {
    sessions.delete(options.auth.address.toLowerCase());
    return request<T>(path, options, true);
  }
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null;
    throw new ApiError(res.status, payload?.error?.code ?? 'HTTP_ERROR', payload?.error?.message ?? `API ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Login SIWE (EIP-4361, tanda tangan EIP-191 oleh akun di perangkat) → token Bearer. */
async function sessionToken(account: LocalAccount): Promise<string> {
  const key = account.address.toLowerCase();
  const cached = sessions.get(key);
  if (cached && cached.expiresAt - 60_000 > Date.now()) return cached.token;

  const challenge = await request<{ message: string }>('/api/auth/challenge', {
    method: 'POST',
    body: { address: account.address },
  });
  const signature = await account.signMessage({ message: challenge.message });
  const session = await request<{ token: string; expiresAt: string }>('/api/auth/verify', {
    method: 'POST',
    body: { address: account.address, signature },
  });
  sessions.set(key, { token: session.token, expiresAt: Date.parse(session.expiresAt) });
  return session.token;
}

export function clearApiSession(address?: string) {
  if (address) sessions.delete(address.toLowerCase());
  else sessions.clear();
}

// ---------------------------------------------------------------- types

export type ApiProfile = {
  address: Address;
  displayName: string;
  countryCode: string;
  city: string | null;
  avatarColor: string | null;
};

export type ApiSpendMeta = {
  groupId: string;
  spendId: string;
  noteHash: string;
  title: string;
  category: string;
  note: string;
  receiptHash: string | null;
};

export type ApiInvoice = {
  number: string;
  groupId: string;
  member: Address;
  status: 'paid' | 'refunded' | 'due';
  invoiceHash: string;
  payload: string;
  debtPaid: string;
  issuedAt: string;
  shareToken?: string;
};

// ---------------------------------------------------------------- endpoints

export const api = {
  /** MON kecil untuk transaksi pertama akun baru (tanpa login). */
  drip: (address: Address) =>
    request<{ status: string; txHash?: string }>('/api/drip', { method: 'POST', body: { address } }),

  myProfile: (account: LocalAccount) => request<ApiProfile>('/api/profiles/me', { auth: account }),
  saveProfile: (
    account: LocalAccount,
    profile: { displayName: string; countryCode: string; city?: string; avatarColor?: string },
  ) => request<ApiProfile>('/api/profiles/me', { method: 'PUT', body: profile, auth: account }),
  profiles: async (addresses: string[]) => {
    if (addresses.length === 0) return [] as ApiProfile[];
    const res = await request<{ profiles: ApiProfile[] }>(`/api/profiles?addresses=${addresses.slice(0, 20).join(',')}`);
    return res.profiles;
  },

  groupMeta: (groupId: string) => request<{ groupId: string; name: string; createdBy: Address }>(`/api/groups/${groupId}/meta`),
  saveGroupMeta: (account: LocalAccount, groupId: string, name: string) =>
    request(`/api/groups/${groupId}/meta`, { method: 'PUT', body: { name }, auth: account }),

  spendMeta: async (account: LocalAccount, groupId: string) =>
    (await request<{ spends: ApiSpendMeta[] }>(`/api/groups/${groupId}/spends/meta`, { auth: account })).spends,
  saveSpendMeta: (account: LocalAccount, groupId: string, spendId: string, note: SpendNote) =>
    request<ApiSpendMeta>(`/api/groups/${groupId}/spends/${spendId}/meta`, { method: 'PUT', body: note, auth: account }),

  myInvoice: (account: LocalAccount, groupId: string) =>
    request<ApiInvoice>(`/api/groups/${groupId}/invoices/me`, { auth: account }),

  subscribePush: (account: LocalAccount, expoPushToken: string, platform: 'ios' | 'android') =>
    request('/api/push/subscribe', { method: 'POST', body: { expoPushToken, platform }, auth: account }),
};
