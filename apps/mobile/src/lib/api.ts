import { env } from './env';

// Label off-chain (nama, judul, struk, invoice) lewat apps/api. App tidak pernah terhubung ke database langsung.
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!env.apiUrl) throw new Error('EXPO_PUBLIC_API_URL belum diisi');
  const res = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}
