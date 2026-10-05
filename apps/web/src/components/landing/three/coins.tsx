"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { Coin } from "./shapes";

export type Vec3 = [number, number, number];
export type Route = { from: Vec3; to: Vec3 };

const a = new THREE.Vector3();
const b = new THREE.Vector3();
const mid = new THREE.Vector3();

/** Titik pada lengkung kuadrat dari `from` ke `to` dengan puncak setinggi `arc`. */
function arcPoint(out: THREE.Vector3, from: Vec3, to: Vec3, arc: number, t: number) {
  a.set(...from);
  b.set(...to);
  mid.copy(a).lerp(b, 0.5);
  mid.y += arc;
  const u = 1 - t;
  out.set(0, 0, 0).addScaledVector(a, u * u).addScaledVector(mid, 2 * u * t).addScaledVector(b, t * t);
  return out;
}

/**
 * Koin yang terus terbang di sepanjang `routes` (berputar, membesar di awal, mengecil di akhir).
 * `perRoute` koin per rute, bergiliran supaya alirannya terlihat terus-menerus.
 */
export function CoinStream({
  routes,
  perRoute = 2,
  speed = 0.45,
  arc = 1.4,
  scale = 0.42,
}: {
  routes: Route[];
  perRoute?: number;
  speed?: number;
  arc?: number;
  scale?: number;
}) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const count = routes.length * perRoute;

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      const g = refs.current[i];
      const route = routes[i % routes.length];
      if (!g || !route) continue;
      const offset = i / count + Math.floor(i / routes.length) * 0.17;
      const t = (time * speed + offset) % 1;
      arcPoint(g.position, route.from, route.to, arc, t);
      g.rotation.y = time * 4 + i;
      g.rotation.x = 0.3;
      // masuk dan keluar dengan mengembang/menyusut
      const s = Math.min(1, t * 6, (1 - t) * 6) * scale;
      g.scale.setScalar(Math.max(s, 0.0001));
    }
  });

  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Coin
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        />
      ))}
    </>
  );
}
