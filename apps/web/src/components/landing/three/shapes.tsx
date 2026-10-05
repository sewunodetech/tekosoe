"use client";

import { Outlines } from "@react-three/drei";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import { forwardRef, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { C } from "./palette";

/*
 * Primitif kartun bersama untuk semua scene landing: material toon + garis tepi tinta
 * supaya cocok dengan gambar Teko 2D (stroke #2a3436).
 */

/** Tebal garis tepi dalam piksel buffer (mode default drei Outlines = ruang layar). */
const OUTLINE = 4;

/** Material toon dengan gradasi 3 tingkat (bayangan kartun yang tegas). */
export function Toon({ color }: { color: string }) {
  const gradient = useMemo(() => {
    const data = new Uint8Array([90, 170, 255]);
    const t = new THREE.DataTexture(data, 3, 1, THREE.RedFormat);
    t.minFilter = THREE.NearestFilter;
    t.magFilter = THREE.NearestFilter;
    t.needsUpdate = true;
    return t;
  }, []);
  return <meshToonMaterial color={color} gradientMap={gradient} />;
}

/** Cahaya standar scene kartun. */
export function CartoonLights() {
  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 6, 5]} intensity={1.8} />
      <directionalLight position={[-5, 2, -3]} intensity={0.6} />
    </>
  );
}

function Ink({ thickness = OUTLINE }: { thickness?: number }) {
  return <Outlines thickness={thickness} color={C.ink} />;
}

/** Koin dolar kuning dengan tanda "$" timbul. */
export const Coin = forwardRef<THREE.Group, { scale?: number; position?: [number, number, number] }>(function Coin(
  { scale = 1, position },
  ref,
) {
  return (
    <group ref={ref} scale={scale} position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.14, 40]} />
        <Toon color={C.coin} />
        <Ink />
      </mesh>
      {/* "$" sederhana: batang + dua lengkung */}
      <group position={[0, 0, 0.075]}>
        <mesh>
          <boxGeometry args={[0.06, 0.52, 0.02]} />
          <meshBasicMaterial color={C.coinEdge} />
        </mesh>
        <mesh position={[0, 0.07, 0]} rotation={[0, 0, Math.PI * 0.15]}>
          <torusGeometry args={[0.13, 0.035, 8, 24, Math.PI * 1.3]} />
          <meshBasicMaterial color={C.coinEdge} />
        </mesh>
        <mesh position={[0, -0.07, 0]} rotation={[0, 0, Math.PI * 1.15]}>
          <torusGeometry args={[0.13, 0.035, 8, 24, Math.PI * 1.3]} />
          <meshBasicMaterial color={C.coinEdge} />
        </mesh>
      </group>
    </group>
  );
});

/** Mata kartun (putih tinta + kilau) — dipakai Teko dan avatar. */
function Eye({ position, size = 0.11, closed = false }: { position: [number, number, number]; size?: number; closed?: boolean }) {
  if (closed) {
    return (
      <mesh position={position} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[size * 0.8, size * 0.25, 8, 16, Math.PI]} />
        <meshBasicMaterial color={C.ink} />
      </mesh>
    );
  }
  return (
    <group position={position}>
      <mesh scale={[1, 1.25, 0.5]}>
        <sphereGeometry args={[size, 20, 20]} />
        <meshBasicMaterial color={C.ink} />
      </mesh>
      <mesh position={[size * 0.35, size * 0.45, size * 0.4]}>
        <sphereGeometry args={[size * 0.3, 10, 10]} />
        <meshBasicMaterial color={C.white} />
      </mesh>
    </group>
  );
}

function Blush({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} scale={[1, 0.6, 0.3]}>
      <sphereGeometry args={[0.1, 12, 12]} />
      <meshBasicMaterial color={C.orange} transparent opacity={0.55} />
    </mesh>
  );
}

/** Profil badan Teko (diputar dengan LatheGeometry). */
function useTekoBody() {
  return useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const y = -0.9 + t * 1.65;
      // perut bulat melebar di bawah, menyempit ke leher
      const r = Math.sin(Math.PI * (0.08 + t * 0.84)) * (1.05 - t * 0.28) + 0.04;
      pts.push(new THREE.Vector2(r, y));
    }
    return new THREE.LatheGeometry(pts, 48);
  }, []);
}

type TekoProps = {
  /** Mata tertutup bahagia (^ ^). */
  happy?: boolean;
  /** Kepala/mata mengikuti kursor. */
  follow?: boolean;
  /** Tutup teko terangkat sedikit (koin bisa masuk). */
  lidOpen?: number;
  children?: ReactNode;
} & ThreeElements["group"];

/** Teko 3D — versi low-poly dari maskot 2D (badan mint, corong, pegangan, tutup + kenop oranye). */
export const Teko3D = forwardRef<THREE.Group, TekoProps>(function Teko3D({ happy = false, follow = false, lidOpen = 0, children, ...rest }, ref) {
  const body = useTekoBody();
  const face = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);

  useFrame((state, dt) => {
    if (face.current && follow) {
      const { x, y } = state.pointer;
      face.current.position.x = THREE.MathUtils.damp(face.current.position.x, x * 0.12, 6, dt);
      face.current.position.y = THREE.MathUtils.damp(face.current.position.y, y * 0.08, 6, dt);
    }
    if (lid.current) {
      lid.current.position.y = THREE.MathUtils.damp(lid.current.position.y, 0.78 + lidOpen * 0.35, 8, dt);
      lid.current.rotation.z = THREE.MathUtils.damp(lid.current.rotation.z, lidOpen * 0.25, 8, dt);
    }
  });

  return (
    <group ref={ref} {...rest}>
      {/* badan */}
      <mesh geometry={body}>
        <Toon color={C.body} />
        <Ink />
      </mesh>
      {/* perut terang */}
      <mesh position={[0, -0.55, 0.62]} scale={[0.55, 0.22, 0.2]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshBasicMaterial color={C.belly} />
      </mesh>
      {/* corong */}
      <mesh position={[-1.05, 0.05, 0]} rotation={[0, 0, Math.PI * 0.28]}>
        <cylinderGeometry args={[0.13, 0.22, 0.95, 20]} />
        <Toon color={C.body} />
        <Ink />
      </mesh>
      {/* pegangan */}
      <mesh position={[0.98, -0.05, 0]}>
        <torusGeometry args={[0.38, 0.09, 12, 28, Math.PI * 1.25]} />
        <Toon color={C.body} />
        <Ink />
      </mesh>
      {/* kaki */}
      {[-0.4, 0.4].map((x) => (
        <mesh key={x} position={[x, -0.92, 0.1]} scale={[1, 0.5, 1]}>
          <sphereGeometry args={[0.2, 16, 12]} />
          <Toon color={C.bodyShade} />
          <Ink />
        </mesh>
      ))}
      {/* tutup */}
      <group ref={lid} position={[0, 0.78, 0]}>
        <mesh scale={[1, 0.45, 1]}>
          <sphereGeometry args={[0.55, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Toon color={C.body} />
          <Ink />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.66, 0.66, 0.1, 32]} />
          <Toon color={C.bodyShade} />
          <Ink />
        </mesh>
        <mesh position={[0, 0.33, 0]}>
          <sphereGeometry args={[0.13, 16, 16]} />
          <Toon color={C.orange} />
          <Ink />
        </mesh>
      </group>
      {/* wajah */}
      <group ref={face} position={[0, 0, 0]}>
        <Eye position={[-0.28, 0.02, 0.92]} closed={happy} />
        <Eye position={[0.28, 0.02, 0.92]} closed={happy} />
        <Blush position={[-0.5, -0.17, 0.82]} />
        <Blush position={[0.5, -0.17, 0.82]} />
        {/* mulut "w" */}
        <mesh position={[0, -0.18, 0.93]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.07, 0.022, 8, 16, Math.PI]} />
          <meshBasicMaterial color={C.ink} />
        </mesh>
      </group>
      {children}
    </group>
  );
});

/** Teman: bola berwarna dengan wajah kecil. */
export const Buddy = forwardRef<THREE.Group, { color: string; happy?: boolean } & ThreeElements["group"]>(function Buddy(
  { color, happy = false, ...rest },
  ref,
) {
  return (
    <group ref={ref} {...rest}>
      <mesh>
        <sphereGeometry args={[0.45, 32, 24]} />
        <Toon color={color} />
        <Ink />
      </mesh>
      <Eye position={[-0.14, 0.06, 0.4]} size={0.06} closed={happy} />
      <Eye position={[0.14, 0.06, 0.4]} size={0.06} closed={happy} />
      <mesh position={[0, -0.08, 0.42]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.05, 0.016, 8, 16, Math.PI]} />
        <meshBasicMaterial color={C.ink} />
      </mesh>
    </group>
  );
});
