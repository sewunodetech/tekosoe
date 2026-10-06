"use client";

import dynamic from "next/dynamic";

/*
 * Pemuat scene 3D landing. three.js hanya diunduh di browser dan hanya di `/` (dan 404);
 * selama memuat (atau tanpa WebGL) yang tampil hanya latar `.lg-scene`.
 * Section server (Sections.tsx, Integrations.tsx) meng-import dari sini, bukan langsung.
 */
export const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });
export const TekoScene = dynamic(() => import("./TekoScene"), { ssr: false });
export const StepsScene = dynamic(() => import("./StepsScene"), { ssr: false });
export const OrbitScene = dynamic(() => import("./OrbitScene"), { ssr: false });
