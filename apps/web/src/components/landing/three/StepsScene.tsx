"use client";

import { Float } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { C, FRIENDS } from "./palette";
import { SceneCanvas } from "./SceneCanvas";
import { Buddy, CartoonLights, Coin, Teko3D, Toon } from "./shapes";

/*
 * Diorama "How it works": pulau kecil dengan jalan berkelok dan empat pos —
 * bendera (mulai), tumpukan koin (setor), kios (belanja), pesta (settle).
 * Teko melompat-lompat di sepanjang jalan menuju pos langkah yang aktif.
 */

const PATH = [
  new THREE.Vector3(-3.2, 0, 0.9),
  new THREE.Vector3(-1.9, 0, -0.9),
  new THREE.Vector3(-0.4, 0, 0.6),
  new THREE.Vector3(1.1, 0, -0.8),
  new THREE.Vector3(2.4, 0, 0.5),
  new THREE.Vector3(3.3, 0, -0.6),
];
/** Posisi tiap pos di sepanjang jalan (0–1). */
const STOPS = [0, 0.36, 0.68, 1];

function Island() {
  return (
    <group>
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[4.6, 4.2, 0.7, 48]} />
        <Toon color={C.mint} />
      </mesh>
      <mesh position={[0, -0.85, 0]}>
        <cylinderGeometry args={[4.2, 3.2, 0.4, 48]} />
        <Toon color={C.peach} />
      </mesh>
    </group>
  );
}

function Road({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  const geo = useMemo(() => new THREE.TubeGeometry(curve, 120, 0.22, 8, false), [curve]);
  return (
    <mesh geometry={geo} scale={[1, 0.15, 1]} position={[0, 0.02, 0]}>
      <meshBasicMaterial color={C.white} />
    </mesh>
  );
}

function Flag({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.4, 8]} />
        <Toon color={C.ink} />
      </mesh>
      <Float speed={4} rotationIntensity={0.3} floatIntensity={0}>
        <mesh position={[0.32, 1.2, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.24, 0.62, 3]} />
          <Toon color={C.teal} />
        </mesh>
      </Float>
    </group>
  );
}

function CoinStack({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={position}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[(i % 2) * 0.04, 0.08 + i * 0.13, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 0.12, 28]} />
          <Toon color={C.coin} />
        </mesh>
      ))}
      <Float speed={3} floatIntensity={1.2} rotationIntensity={1}>
        <Coin position={[0, 1.05, 0]} scale={0.5} />
      </Float>
    </group>
  );
}

function Stall({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={position} rotation={[0, -0.4, 0]}>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.9, 0.6, 0.55]} />
        <Toon color={C.white} />
      </mesh>
      {[-0.35, 0.35].map((x) => (
        <mesh key={x} position={[x, 0.85, 0.2]}>
          <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
          <Toon color={C.ink} />
        </mesh>
      ))}
      {/* atap belang */}
      {[-0.33, -0.11, 0.11, 0.33].map((x, i) => (
        <mesh key={x} position={[x, 1.2, 0.05]} rotation={[0.35, 0, 0]}>
          <boxGeometry args={[0.22, 0.06, 0.8]} />
          <Toon color={i % 2 ? C.white : C.orange} />
        </mesh>
      ))}
    </group>
  );
}

function Party({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={position}>
      {[
        [-0.25, C.orange],
        [0.05, C.lilac],
        [0.32, C.coin],
      ].map(([x, color], i) => (
        <Float key={i} speed={2 + i} floatIntensity={0.8} rotationIntensity={0.4}>
          <group position={[x as number, 1.35 + i * 0.15, 0]}>
            <mesh scale={[1, 1.15, 1]}>
              <sphereGeometry args={[0.2, 20, 16]} />
              <Toon color={color as string} />
            </mesh>
            <mesh position={[0, -0.5, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 0.8, 4]} />
              <meshBasicMaterial color={C.ink} />
            </mesh>
          </group>
        </Float>
      ))}
    </group>
  );
}

function Walker({ curve, step }: { curve: THREE.CatmullRomCurve3; step: number }) {
  const teko = useRef<THREE.Group>(null);
  const t = useRef(STOPS[step] ?? 0);
  const tangent = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const g = teko.current;
    if (!g) return;
    const target = STOPS[step] ?? 0;
    const prev = t.current;
    t.current = THREE.MathUtils.damp(t.current, target, 1.6, Math.min(dt, 1 / 30));
    const moving = Math.abs(target - t.current) > 0.004;
    const p = curve.getPointAt(THREE.MathUtils.clamp(t.current, 0, 1));
    // lompatan kecil selama berjalan
    const hop = moving ? Math.abs(Math.sin(state.clock.elapsedTime * 11)) * 0.35 : 0;
    g.position.set(p.x, 0.55 + hop, p.z + 0.15);
    // menghadap arah jalan saat bergerak, menghadap kamera saat berhenti
    curve.getTangentAt(THREE.MathUtils.clamp(t.current, 0, 1), tangent);
    const dir = Math.sign(t.current - prev) || 1;
    const facing = moving ? Math.atan2(tangent.x * dir, tangent.z * dir) - Math.PI / 2 : -0.2;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, facing, 6, dt);
  });

  return <Teko3D ref={teko} scale={0.42} happy={step === 3} lidOpen={step === 1 ? 1 : 0} />;
}

function Diorama({ step }: { step: number }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(PATH), []);
  const stops = useMemo(() => STOPS.map((s) => curve.getPointAt(s)), [curve]);
  const root = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  // Layar lebar: judul di kiri atas, jadi pulau di kanan bawah. Ponsel: judul di atas, pulau di bawah.
  const wide = viewport.aspect > 1.3;
  const fit = wide ? Math.min(0.8, viewport.width / 13) : Math.min(0.62, viewport.width / 9.6);
  const pos: [number, number, number] = wide ? [viewport.width * 0.15, -1.05, 0] : [0, -1.9, 0];

  useFrame((state, dt) => {
    if (!root.current) return;
    root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, state.pointer.x * 0.2, 3, dt);
  });

  const [flag, coins, stall, party] = stops as [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3];
  const back = (v: THREE.Vector3, dz = -0.65) => new THREE.Vector3(v.x, 0, v.z + dz);

  return (
    <group ref={root} scale={fit} position={pos}>
      <Island />
      <Road curve={curve} />
      <Flag position={back(flag)} />
      <CoinStack position={back(coins)} />
      <Stall position={back(stall)} />
      <Party position={back(party)} />
      {/* teman ikut di pos pesta saat settle */}
      {step === 3 &&
        FRIENDS.slice(0, 3).map((color, i) => (
          <Float key={color} speed={3 + i} floatIntensity={1.5}>
            <Buddy color={color} happy scale={0.38} position={[party.x - 0.9 + i * 0.5, 0.45, party.z + 0.9]} />
          </Float>
        ))}
      <Walker curve={curve} step={step} />
    </group>
  );
}

/** Scene langkah "How it works". `step` 0–3 = Start, Chip in, Spend, Settle. */
export default function StepsScene({ step }: { step: number }) {
  return (
    <SceneCanvas className="absolute inset-0" camera={{ position: [0, 4.2, 8.5], fov: 34 }} onCreated={({ camera }) => camera.lookAt(0, -0.4, 0)}>
      <CartoonLights />
      <Diorama step={step} />
    </SceneCanvas>
  );
}
