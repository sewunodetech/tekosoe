# 0004 — Web landing page and dashboard (read-only demo)

- Status: accepted
- Date: 2026-09-29

## Context

`apps/web` started with only three jobs: the passkey domain files, an invite page that opens the app, and invoice verification from the QR code (`apps/web/AGENTS.md`, ADR 0001). The PRD and the screen map only defined mobile screens; there was no FR, screen or work package for a web landing page or dashboard.

The team decided the web needs a landing page and a dashboard, with exactly the app's design and only at phone size. When this decision was made:

- The `GroupVault` contract, the Envio indexer and the api were not deployed yet (`STATUS.md` › Deployments), so there was no real data to read.
- Mera was only designed for React Native (ADR 0003). There was no design or spike for a passkey session in the browser.
- Rules 1–3 in the root `AGENTS.md`: money only on-chain, no custody, one account layer (Mera), no "connect wallet".

## Decision

1. **The web dashboard is a read-only preview with demo data**, with no sign-in. Its data is the same as the `apps/mobile` demo (the Rina/Wei/Jack trip to Japan) and the screens are labelled "Demo preview".
2. **Every money action** (Add money, Pay, Join, Pay invoice, New trip) is not run on the web. Its button opens a "Do this in the Tekosoe app" bottom sheet with a `tekosoe://…` deep link and a "Get the app" link.
3. **The dashboard is mobile-only.** Every app-like page (dashboard, invite, verification, `/get-app`) lives in one column of at most 430px; on wide screens it is shown as a phone frame in the middle (`components/Frame.tsx`, route group `(phone)`). **Exception: the landing page `/`** is a full-bleed, responsive white hero (React + Tailwind + `lucide-react`, Inter, black/grey): nav, badge, gradient headline, CTA, Plan / Chip in / Spend / Settle tabs that switch every 4 seconds, and a background video with an overlay card per tab; then sections for users (How it works, Good to know including a "preview, test dollars" note, Try the demo, FAQ), a closing CTA and a footer. The landing page also shows the Monad Metropolis sponsor technologies (Monad, AUSD by Agora, Mera by Category Labs, Envio, Alchemy) as a scrolling name row in the hero and a "Built with" diagram. They are written as technologies we use, not partnerships, with official logos from each site (sources in `apps/web/public/sponsors/README.md`, shown in one colour) and a "Planned" tag for anything not done yet in `STATUS.md`. The landing palette is limited to two colours: neutral and teal. The exceptions are images: the hero video, two AI-made illustrations in the same style (the "How it works" background and the closing CTA), and dashboard screenshots; their sources are listed in `apps/web/public/landing/README.md`. The navbar sticks to the top, highlights the section being read, and has a full-screen menu on phones. "Good to know" and the FAQ must follow the rules in the PRD and the contract (approval limit, safety net, 24-hour dispute window, at most 10 members). The landing page deliberately does **not** use the dashboard's cartoon theme; the copy and wordmark are Tekosoe's own. Template elements that make claims (user ratings, company logos) are **not used** because they are not true for Tekosoe.
4. **The design follows the app.** Tokens (`apps/mobile/src/constants/theme.ts`), icons, the Teko mascot (10 expressions) and the base components are copied as-is into `apps/web`. Light mode only, English copy like the app, and the ban on crypto terms applies to every page (guarded by `npm test -w @tekosoe/web`).
5. **Data goes through `TripRepository`** (`apps/web/src/data/repo.ts`). Pages do not import demo data directly. A live source (balances and activity from Envio, labels from `apps/api`) is added as a second implementation of the same interface once Envio and the contract are deployed.
6. **Stay static.** Every page is prerendered (`generateStaticParams`), so "static Next.js on Vercel" from ADR 0001 still holds. State that the app keeps in the query string (`?state=empty`, `?who=`) becomes a route (`/trips/[id]/empty`, `/trips/[id]/invoice/[who]`).
7. **The invoice QR is a real QR code** (`qrcode` package, generated on the server) that opens `https://tekosoe.xyz/v/<number>`.
8. **`/v/[number]` does not verify anything yet.** It shows a demo invoice labelled "Demo data" with a note that real verification (WP W-3) will rebuild the invoice from the trip data and compare it with the invoice fingerprint from the api. The page must not show a "verified" status before W-3 is done.

## Consequences

- Passkey sign-in on the web, the user's real trip list, and actions that sign money are **not** included. If they are needed later, that takes a Mera spike for the browser and a new ADR.
- The demo fixtures are copied to `apps/web/src/data/demo.ts` so `apps/mobile` is untouched. This is debt: extract them to `packages/shared` so mobile and web share one source.
- Design tokens are duplicated in `apps/web/src/app/globals.css`. If `theme.ts` changes, change both.
- The "Get the app" button points to the `/get-app` page until there is a store page; set `NEXT_PUBLIC_APP_DOWNLOAD_URL` to replace it.
- The landing page uses a background video from CloudFront (URL in `components/landing/Landing.tsx`). The numbers on the overlay cards are the Japan Trip example (labelled "sample").
- The `.well-known` files are not touched (WP W-1). Open findings: `apple-app-site-association` still uses `TEAMID.com.tekosoe.app` (the real app bundle is `com.tekosoe.xyz`) and is not served with `Content-Type: application/json`.

## Later changes

- ADR 0010 replaced the hero video and illustrations with 3D scenes.
- ADR 0012 made `/j` and `/v` live (real trip data and real invoice verification, W-3) and moved the web to a true static export.
- ADR 0014 removed Alchemy from "Built with": it was never integrated.
