# Tekosue — website (`apps/web`)

The public website at **[www.tekosue.xyz](https://www.tekosue.xyz)**: a static Next.js export hosted on Vercel.

| Route | What it does |
| --- | --- |
| `/` | Landing page with cartoon 3D scenes (ADR 0010) |
| `/get-app` | Download page: Android APK, a QR code for desktop visitors, install steps |
| `/j/<code>` | Invite link. Shows the real trip (name, members, end date, pot) from Envio + the api, then opens the app with `tekosue://invite/<code>`. Only the group id leaves the browser; the invite secret never does |
| `/v/<number>?token=…` | Invoice check. Rebuilds the invoice from the indexed settle-up with the same shared code as the api and compares it with the shared invoice: "matches", "doesn't match", "invalid link" or "can't check right now" |
| `/trips`, `/card`, `/profile`, … | A read-only dashboard preview with demo data (ADR 0004) |
| `/.well-known/*` | Passkey and App Links domain files for the Android/iOS app |

`/j` and `/v` are static shells (`/j/_`, `/v/_`) that read the path in the browser; `vercel.json` (or `deploy/nginx.conf` when self-hosting) rewrites every code and number to them. Details: [ADR 0012](../../docs/decisions/0012-web-static-shell.md).

## Run it

```bash
npm run dev -w @tekosue/web                                       # next dev (demo pages; /j/_ and /v/_ only)
npm run build -w @tekosue/web && npm run preview -w @tekosue/web  # static export + the same rewrites as production
npm test -w @tekosue/web                                          # copy guard, rewrite rules, vitest + fast-check
```

Environment (`NEXT_PUBLIC_*`, inlined at build time, see [`.env.example`](.env.example)): `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_ENVIO_GRAPHQL_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ANDROID_APK_URL`, `NEXT_PUBLIC_APP_DOWNLOAD_URL`.

## Rules

No crypto words in user-facing text (guarded by `scripts/copy-guard.test.mjs`), amounts always through `money()`, and the dashboard follows the app's design. See [`AGENTS.md`](AGENTS.md).
