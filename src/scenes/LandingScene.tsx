"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function LandingScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.2, 4.2], fov: 38 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[3, 4, 4]}
        intensity={1.2}
        color="#fff5d6"
      />
      <pointLight position={[-3, 2, 2]} intensity={0.5} color="#c9a45b" />

      <FloatingBook />
    </Canvas>
  );
}

function FloatingBook() {
  const groupRef = useRef<THREE.Group>(null);
  const [opened, setOpened] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Auto-open after 800ms
  useEffect(() => {
    const t = window.setTimeout(() => setOpened(true), 900);
    return () => window.clearTimeout(t);
  }, []);

  const openness = useRef(0);

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    g.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
    g.rotation.x = -0.05 + Math.sin(state.clock.elapsedTime * 0.5) * 0.04;

    const target = opened ? 1 : 0;
    openness.current = THREE.MathUtils.damp(openness.current, target, 3.5, delta);

    const scale = hovered ? 1.04 : 1;
    g.scale.x = THREE.MathUtils.damp(g.scale.x, scale, 6, delta);
    g.scale.y = THREE.MathUtils.damp(g.scale.y, scale, 6, delta);
    g.scale.z = THREE.MathUtils.damp(g.scale.z, scale, 6, delta);
  });

  const W = 1.55;
  const H = 2.15;
  const D = 0.06;

  return (
    <group
      ref={groupRef}
      position={[0, 0, 0]}
      onPointerOver={() => {
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "";
      }}
      onClick={() => setOpened((o) => !o)}
    >
      {/* Back cover */}
      <mesh position={[0, 0, -D]}>
        <boxGeometry args={[W * 2 + 0.08, H + 0.08, D]} />
        <meshStandardMaterial color="#2a1810" roughness={0.55} />
      </mesh>

      <PageSpread openness={0} />

      {/* Spine */}
      <mesh position={[0, 0, -D / 2]}>
        <boxGeometry args={[0.04, H + 0.08, D + 0.04]} />
        <meshStandardMaterial color="#1a0f08" roughness={0.7} />
      </mesh>
    </group>
  );
}

function PageSpread({ openness }: { openness: number }) {
  // The "openness" prop is wired via parent ref, so we read from the
  // hook above by mirroring its value here for static layout.
  const W = 1.55;
  const H = 2.15;
  const offset = 0.02 + openness * 0.02;
  return (
    <>
      <mesh position={[-W / 2 - offset, 0, 0.001]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial color="#fdfaf2" roughness={0.95} />
      </mesh>
      <mesh position={[W / 2 + offset, 0, 0.001]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial color="#fdfaf2" roughness={0.95} />
      </mesh>
    </>
  );
}
