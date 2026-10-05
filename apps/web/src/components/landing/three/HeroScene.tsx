"use client";

import { Float } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CoinStream, type Route, type Vec3 } from "./coins";
import { C, FRIENDS } from "./palette";
import { SceneCanvas } from "./SceneCanvas";
import { Buddy, CartoonLights, Teko3D, Toon } from "./shapes";

export type HeroStage = "plan" | "chipin" | "spend" | "settle";

const BUDDIES: Vec3[] = [
  [-2.6, -0.9, -0.6],
  [-1.7, 1.25, -1.2],
  [1.7, 1.25, -1.2],
  [2.6, -0.9, -0.6],
];
const POT_TOP: Vec3 = [0, 1.1, 0];
const SPOUT: Vec3 = [-1.4, 0.45, 0.2];
const RECEIPT: Vec3 = [-2.4, 1.7, 0.4];

/** Kertas struk kecil yang melayang — tujuan koin saat "Spend". */
function Receipt({ position }: { position: Vec3 }) {
  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
      <group position={position} rotation={[0, 0.3, -0.12]}>
        <mesh>
          <boxGeometry args={[0.8, 1, 0.05]} />
          <Toon color={C.white} />
        </mesh>
        {[0.28, 0.1, -0.08, -0.26].map((y, i) => (
          <mesh key={y} position={[i === 3 ? 0.12 : -0.05, y, 0.03]}>
            <boxGeometry args={[i === 3 ? 0.3 : 0.5, 0.06, 0.01]} />
            <meshBasicMaterial color={i === 3 ? C.teal : C.bodyShade} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function Stage({ stage }: { stage: HeroStage }) {
  const root = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  const wide = viewport.aspect > 1.2;

  // Layar lebar: kartu ada di kiri, jadi scene digeser ke kanan. Ponsel: kartu di bawah, scene naik.
  const base = useMemo<Vec3>(() => (wide ? [viewport.width * 0.2, -0.1, 0] : [0, 1.1, 0]), [wide, viewport.width]);
  const fit = wide ? Math.min(1, viewport.width / 13) : Math.min(0.8, viewport.width / 7.5);

  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;
    // parallax pelan mengikuti kursor
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, state.pointer.x * 0.25, 4, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -state.pointer.y * 0.12, 4, dt);
  });

  const routes = useMemo<Route[]>(() => {
    if (stage === "chipin") return BUDDIES.map((p) => ({ from: p, to: POT_TOP }));
    if (stage === "spend") return [{ from: SPOUT, to: RECEIPT }];
    if (stage === "settle") return BUDDIES.map((p) => ({ from: POT_TOP, to: p }));
    return [];
  }, [stage]);

  const happy = stage === "settle";

  return (
    <group ref={root} position={base} scale={fit}>
      <Float speed={1.6} rotationIntensity={0.15} floatIntensity={0.5}>
        <Teko3D happy={happy} follow lidOpen={stage === "chipin" || stage === "settle" ? 1 : 0} rotation={[0, -0.25, 0]} />
      </Float>
      {BUDDIES.map((p, i) => (
        <Float key={i} speed={2 + i * 0.3} floatIntensity={0.8} rotationIntensity={0.3}>
          <Buddy color={FRIENDS[i % FRIENDS.length]!} happy={happy || stage === "chipin"} position={p} scale={0.85} />
        </Float>
      ))}
      {stage === "spend" && <Receipt position={RECEIPT} />}
      {routes.length > 0 && <CoinStream key={stage} routes={routes} perRoute={stage === "spend" ? 5 : 2} speed={stage === "spend" ? 0.5 : 0.4} />}
    </group>
  );
}

/** Scene hero: Teko di tengah, empat teman, dan koin yang bergerak sesuai tab yang aktif. */
export default function HeroScene({ stage }: { stage: HeroStage }) {
  return (
    <SceneCanvas className="absolute inset-0" camera={{ position: [0, 0.4, 9], fov: 38 }}>
      <CartoonLights />
      <Stage stage={stage} />
    </SceneCanvas>
  );
}
