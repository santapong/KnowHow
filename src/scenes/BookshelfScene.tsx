"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { BookWithCover } from "@/lib/books";

type Props = {
  books: BookWithCover[];
};

export default function BookshelfScene({ books }: Props) {
  return (
    <div className="relative h-[70vh] min-h-[440px] w-full overflow-hidden rounded-xl bg-gradient-to-b from-[#1d1812] to-[#0e0b08]">
      <Canvas
        camera={{ position: [0, 0.4, 6], fov: 38 }}
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[3, 4, 4]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-3, 2, 2]} intensity={0.4} color="#c9a45b" />

        <Shelf />
        <Spines books={books} />
      </Canvas>
      <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-ink)]/40">
        Click a spine to open
      </p>
    </div>
  );
}

function Shelf() {
  return (
    <group position={[0, -1.3, 0]}>
      <mesh receiveShadow position={[0, -0.05, 0]}>
        <boxGeometry args={[8, 0.1, 1.6]} />
        <meshStandardMaterial color="#3b2a1c" roughness={0.85} />
      </mesh>
      <mesh position={[0, -0.18, 0.78]}>
        <boxGeometry args={[8, 0.16, 0.04]} />
        <meshStandardMaterial color="#2a1d12" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.1, -0.79]}>
        <boxGeometry args={[8, 2.6, 0.02]} />
        <meshStandardMaterial color="#1a120b" roughness={1} />
      </mesh>
    </group>
  );
}

function Spines({ books }: { books: BookWithCover[] }) {
  const router = useRouter();

  const layout = useMemo(() => {
    const slotWidth = 0.36;
    const totalWidth = books.length * slotWidth;
    const startX = -totalWidth / 2 + slotWidth / 2;
    return books.map((b, i) => ({
      book: b,
      x: startX + i * slotWidth,
    }));
  }, [books]);

  return (
    <group position={[0, -0.45, 0.2]}>
      {layout.map(({ book, x }) => (
        <Spine
          key={book.id}
          x={x}
          color={book.spine_color}
          title={book.title}
          onSelect={() => router.push(`/shelf/${book.id}`)}
        />
      ))}
    </group>
  );
}

function Spine({
  x,
  color,
  title,
  onSelect,
}: {
  x: number;
  color: string;
  title: string;
  onSelect: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const targetZ = hovered ? 0.18 : 0;
    g.position.z = THREE.MathUtils.damp(g.position.z, targetZ, 12, delta);
  });

  const titleTexture = useMemo(() => makeTitleTexture(title), [title]);

  function onPointerOver(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
  }
  function onPointerOut() {
    setHovered(false);
    document.body.style.cursor = "";
  }

  return (
    <group ref={groupRef} position={[x, 0, 0]}>
      <mesh
        castShadow
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <boxGeometry args={[0.32, 1.7, 0.24]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0, 0.121]}>
        <planeGeometry args={[0.28, 1.6]} />
        <meshStandardMaterial map={titleTexture} transparent />
      </mesh>
    </group>
  );
}

function makeTitleTexture(title: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 1024;
  const ctx = c.getContext("2d");
  if (!ctx) {
    return new THREE.CanvasTexture(c);
  }
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = "rgba(245,233,210,0.92)";
  ctx.font = "600 32px ui-serif, Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate(-Math.PI / 2);
  const max = 28;
  const text = title.length > max ? title.slice(0, max - 1) + "…" : title;
  ctx.fillText(text, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
