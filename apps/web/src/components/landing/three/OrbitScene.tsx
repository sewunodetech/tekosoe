"use client";

import { Billboard, Float } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { C } from "./palette";
import { SceneCanvas } from "./SceneCanvas";
import { CartoonLights, Teko3D, Toon } from "./shapes";

export type OrbitLogo = { name: string; src: string; w: number; h: number };

const BADGE_W = 512;
const BADGE_H = 192;

/** Gambar pil kartun (latar putih, garis tinta) ke canvas. */
function drawPill(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, BADGE_W, BADGE_H);
  ctx.beginPath();
  ctx.roundRect(8, 8, BADGE_W - 16, BADGE_H - 16, BADGE_H / 2 - 8);
  ctx.fillStyle = C.white;
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = C.ink;
  ctx.stroke();
}

/**
 * Lencana pil kartun berisi logo satu warna, digambar ke satu CanvasTexture yang dibuat sekali.
 * Pil langsung tampil; logo ditambahkan begitu SVG-nya termuat (tanpa mengganti material).
 * Logo dipaksa hitam (`brightness(0)`) sama seperti versi HTML di Integrations.tsx.
 */
function useBadgeTexture({ src, w: logoW, h: logoH }: OrbitLogo) {
  const invalidate = useThree((s) => s.invalidate);
  const tex = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = BADGE_W;
    cv.height = BADGE_H;
    const ctx = cv.getContext("2d");
    if (ctx) drawPill(ctx);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.onload = () => {
      const ctx = (tex.image as HTMLCanvasElement).getContext("2d");
      if (!alive || !ctx) return;
      drawPill(ctx);
      // logo: muat di area tengah dengan rasio aslinya
      const scale = Math.min((BADGE_W - 120) / logoW, (BADGE_H - 90) / logoH);
      const w = logoW * scale;
      const h = logoH * scale;
      ctx.save();
      ctx.filter = "brightness(0)";
      ctx.drawImage(img, (BADGE_W - w) / 2, (BADGE_H - h) / 2, w, h);
      ctx.restore();
      tex.needsUpdate = true;
      invalidate();
    };
    // SVG tanpa width/height (mis. agora.svg) butuh ukuran eksplisit agar tergambar.
    img.width = logoW;
    img.height = logoH;
    img.src = src;
    return () => {
      alive = false;
    };
  }, [tex, src, logoW, logoH, invalidate]);

  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

/** Titik pada orbit elips miring di sudut `a` (juga posisi awal saat animasi diam). */
function orbitAt(a: number): [number, number, number] {
  return [Math.cos(a) * 3.4, Math.sin(a) * 0.55 + 0.1, Math.sin(a) * 1.6];
}

function Badge({ logo, index, total }: { logo: OrbitLogo; index: number; total: number }) {
  const tex = useBadgeTexture(logo);
  const ref = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const phase = (index / total) * Math.PI * 2;

  useFrame(({ clock }, dt) => {
    const g = ref.current;
    if (!g) return;
    // orbit elips miring
    g.position.set(...orbitAt(phase + clock.getElapsedTime() * 0.22));
    const s = hover ? 1.25 : 1;
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, s, 10, dt));
  });

  return (
    <group ref={ref} position={orbitAt(phase)}>
      <Billboard>
        <mesh
          onPointerOver={(e) => {
            e.stopPropagation();
            setHover(true);
          }}
          onPointerOut={() => setHover(false)}
        >
          <planeGeometry args={[1.6, 1.6 * (BADGE_H / BADGE_W)]} />
          <meshBasicMaterial map={tex} transparent toneMapped={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

function Planet() {
  const ring = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ring.current) ring.current.rotation.z += dt * 0.3;
  });
  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 40, 32]} />
        <Toon color={C.mint} />
      </mesh>
      {/* bintik-bintik kawah */}
      {(
        [
          [0.45, 0.35, 0.82, 0.16],
          [-0.55, -0.1, 0.83, 0.12],
          [0.1, -0.55, 0.83, 0.1],
        ] as const
      ).map(([x, y, z, r]) => (
        <mesh key={`${x}${y}`} position={[x, y, z]} scale={[1, 1, 0.35]}>
          <sphereGeometry args={[r, 16, 12]} />
          <Toon color={C.bodyShade} />
        </mesh>
      ))}
      <mesh ref={ring} rotation={[Math.PI / 2.4, 0.2, 0]}>
        <torusGeometry args={[1.55, 0.06, 10, 64]} />
        <Toon color={C.coin} />
      </mesh>
      <Float speed={2} floatIntensity={0.3} rotationIntensity={0.1}>
        <Teko3D follow scale={0.42} position={[0, 1.38, 0.1]} rotation={[0, -0.2, 0]} />
      </Float>
    </group>
  );
}

function Orbit({ logos }: { logos: OrbitLogo[] }) {
  const { viewport } = useThree();
  const fit = Math.min(1, viewport.width / 8.5);
  const root = useRef<THREE.Group>(null);
  useFrame((state, dt) => {
    if (root.current) root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, 0.12 - state.pointer.y * 0.15, 4, dt);
  });
  const list = useMemo(() => logos, [logos]);
  return (
    <group ref={root} scale={fit} position={[0, -0.45, 0]}>
      <Planet />
      {list.map((l, i) => (
        <Badge key={l.name} logo={l} index={i} total={list.length} />
      ))}
    </group>
  );
}

/** "Built with": planet Tekosoe dengan Teko di atasnya, dikelilingi lencana logo teknologi yang dipakai. */
export default function OrbitScene({ logos }: { logos: OrbitLogo[] }) {
  return (
    <SceneCanvas className="h-full w-full" camera={{ position: [0, 1.2, 8], fov: 36 }}>
      <CartoonLights />
      <Orbit logos={logos} />
    </SceneCanvas>
  );
}
