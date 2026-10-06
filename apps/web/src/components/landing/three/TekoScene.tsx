"use client";

import { Float } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { SceneCanvas } from "./SceneCanvas";
import { CartoonLights, Coin, Teko3D } from "./shapes";

const BURST = 14;
const GRAVITY = -9;

type Particle = { p: THREE.Vector3; v: THREE.Vector3; spin: number; life: number };

function Mascot() {
  const teko = useRef<THREE.Group>(null);
  const coins = useRef<(THREE.Group | null)[]>([]);
  const parts = useRef<Particle[]>([]);
  const jump = useRef({ y: 0, v: 0 });
  const [hover, setHover] = useState(false);
  const { viewport } = useThree();
  const fit = Math.min(1.15, viewport.width / 5.2);

  const pop = () => {
    jump.current.v = 5.5;
    parts.current = Array.from({ length: BURST }, (_, i) => {
      const a = (i / BURST) * Math.PI * 2;
      return {
        p: new THREE.Vector3(0, 1.1, 0),
        v: new THREE.Vector3(Math.cos(a) * (1.6 + Math.random()), 4.5 + Math.random() * 2.5, Math.sin(a) * 0.8),
        spin: 4 + Math.random() * 6,
        life: 1.8,
      };
    });
  };

  useFrame((state, dt) => {
    const d = Math.min(dt, 1 / 30);
    const g = teko.current;
    if (g) {
      // lompatan dengan gravitasi, lalu mendarat
      const j = jump.current;
      j.v += GRAVITY * d;
      j.y = Math.max(0, j.y + j.v * d);
      if (j.y === 0) j.v = 0;
      g.position.y = j.y;
      // badan menoleh ke kursor
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, state.pointer.x * 0.6 - 0.2, 5, d);
      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -state.pointer.y * 0.25, 5, d);
      // memantul kecil saat disorot
      const s = hover ? 1.06 + Math.sin(state.clock.elapsedTime * 10) * 0.015 : 1;
      g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, s, 10, d));
    }
    for (let i = 0; i < BURST; i++) {
      const c = coins.current[i];
      const q = parts.current[i];
      if (!c) continue;
      if (!q || q.life <= 0) {
        c.visible = false;
        continue;
      }
      q.v.y += GRAVITY * d * 0.6;
      q.p.addScaledVector(q.v, d);
      q.life -= d;
      c.visible = true;
      c.position.copy(q.p);
      c.rotation.y += q.spin * d;
      c.scale.setScalar(0.38 * Math.min(1, q.life * 2));
    }
  });

  return (
    <group scale={fit} position={[0, -0.35, 0]}>
      <Float speed={1.4} rotationIntensity={0.1} floatIntensity={0.4}>
        <Teko3D
          ref={teko}
          follow
          happy={hover}
          lidOpen={hover ? 0.6 : 0}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHover(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHover(false);
            document.body.style.cursor = "";
          }}
          onClick={(e) => {
            e.stopPropagation();
            pop();
          }}
        />
      </Float>
      {/* koin semburan: tidak ikut raycast supaya tidak menghalangi klik ke Teko */}
      <group raycast={() => null}>
        {Array.from({ length: BURST }, (_, i) => (
          <Coin
            key={i}
            ref={(el) => {
              coins.current[i] = el;
              if (el) {
                el.visible = false;
                el.traverse((o) => (o.raycast = () => {}));
              }
            }}
          />
        ))}
      </group>
      {/* bayangan bulat di lantai */}
      <mesh position={[0, -1.12, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <circleGeometry args={[1.1, 40]} />
        <meshBasicMaterial color="#1d2426" transparent opacity={0.08} />
      </mesh>
    </group>
  );
}

/** Teko besar di CTA penutup dan halaman 404: menoleh ke kursor, tersenyum saat disorot, melompat + koin saat diklik. */
export default function TekoScene() {
  return (
    <SceneCanvas className="h-full w-full" camera={{ position: [0, 0.6, 6.5], fov: 38 }}>
      <CartoonLights />
      <Mascot />
    </SceneCanvas>
  );
}
