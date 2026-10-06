// Aturan rewrite shell statis — dipakai scripts/preview.mjs dan dites di shell-routes.test.mjs.
// deploy/nginx.conf mencerminkan aturan yang sama (ADR 0012).

/** `/j/<apa pun>` → `/j/_.html`, `/v/<apa pun>` → `/v/_.html`, selain itu null. */
export function resolveShell(pathname) {
  if (/^\/j\/[^/]+\/?$/.test(pathname)) return "/j/_.html";
  if (/^\/v\/[^/]+\/?$/.test(pathname)) return "/v/_.html";
  return null;
}
