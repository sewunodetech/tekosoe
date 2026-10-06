# 0010 — Landing: cartoon 3D scenes with three.js

- Status: accepted (5 Oct 2026)
- Date: 2026-10-05

## Context

The landing page `/` (apps/web) used a stock video in the hero and two static AI illustrations (`path.webp`, `lake.webp`). The team wanted the landing page to feel more alive and more like Tekosoe: the same Teko mascot as in the app instead of generic visuals. The earlier landing rule limited colours to neutral plus one teal accent.

## Decision

- Four sections use 3D scenes (three.js through `@react-three/fiber` + `@react-three/drei`), all in `apps/web/src/components/landing/three/`:
  - **Hero** (`HeroScene`): a 3D Teko, four friends and coins that move with the Plan / Chip in / Spend / Settle tabs. Replaces the stock video.
  - **How it works** (`StepsScene` + `HowSteps`): an island diorama with four stops. Teko walks to the stop of the active step (cycling on its own, or following the highlighted card).
  - **Built with** (`OrbitScene`): a Tekosoe planet with orbiting sponsor logo badges. The HTML cards below it stay the source of the content.
  - **Closing CTA** (`TekoScene`): a big Teko that turns towards the cursor and jumps, throwing coins, when clicked.
- **Cartoon style:** toon materials plus ink outlines (drei `Outlines`) with the mascot palette (`three/palette.ts`). This is an exception to the landing page's two-colour rule, **only for 3D objects and the `.lg-scene` background**. Text, buttons and cards stay neutral + teal.
- **Performance and accessibility:** scenes load with `next/dynamic({ ssr: false })` through `three/lazy.tsx`, so three.js is only downloaded on `/` and the page stays static. A canvas only draws while it is visible (IntersectionObserver), stays still under "reduce motion", falls back to a gradient background without WebGL, and is `aria-hidden`. All information stays in the HTML.

## Consequences

- New dependencies in apps/web: `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`.
- `path.webp` and `lake.webp` are removed. The hero video is no longer used.
- R3F does not restart its render loop when `frameloop` switches to "always". `SceneCanvas` calls `invalidate()` when a scene becomes visible again (`KickLoop`). Do not remove it without testing scenes that load off-screen.
- If the mascot changes in the app, update `Teko3D` (`three/shapes.tsx`) to match the 2D drawing in `components/Teko.tsx`.
