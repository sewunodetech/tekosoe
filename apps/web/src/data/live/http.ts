/**
 * fetch untuk data live halaman /j dan /v. Dipanggil di browser (halaman shell statis).
 * Tanpa cookie dan tanpa Referer, supaya path /j/<kode> (berisi rahasia undangan) tidak ikut terkirim.
 */
export type FetchFailure =
  /** Jaringan, timeout, 5xx, 429, atau body bukan JSON. */
  | { kind: "unreachable" }
  /** 4xx dengan kode error api (kalau ada). */
  | { kind: "status"; status: number; code?: string };

export type FetchResult<T> = { ok: true; data: T } | { ok: false; error: FetchFailure };

export const REQUEST_TIMEOUT_MS = 8000;

export async function fetchJson<T>(url: string, init: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS): Promise<FetchResult<T>> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return { ok: false, error: { kind: "unreachable" } };
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = undefined;
  }

  if (res.ok) {
    return body === undefined ? { ok: false, error: { kind: "unreachable" } } : { ok: true, data: body as T };
  }
  if (res.status >= 500 || res.status === 429) return { ok: false, error: { kind: "unreachable" } };
  const code = (body as { error?: { code?: unknown } } | undefined)?.error?.code;
  return { ok: false, error: { kind: "status", status: res.status, code: typeof code === "string" ? code : undefined } };
}
