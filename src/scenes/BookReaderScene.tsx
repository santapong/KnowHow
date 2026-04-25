"use client";

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  Canvas,
  useFrame,
  type ThreeEvent,
} from "@react-three/fiber";
import * as THREE from "three";
import { PageTextureCache } from "@/lib/pdf/pageTextureCache";

type Props = {
  pdfUrl: string;
  pageCount: number;
  initialPage: number;
  onPageChange: (page: number) => void;
  spineColor: string;
};

export default function BookReaderScene({
  pdfUrl,
  pageCount,
  initialPage,
  onPageChange,
  spineColor,
}: Props) {
  const [cache, setCache] = useState<PageTextureCache | null>(null);
  const [page, setPage] = useState(
    Math.max(1, Math.min(initialPage || 1, pageCount)),
  );

  useEffect(() => {
    const c = new PageTextureCache();
    let alive = true;
    c.open(pdfUrl)
      .then(() => {
        if (alive) setCache(c);
        else c.dispose();
      })
      .catch(() => {
        if (alive) setCache(null);
        c.dispose();
      });

    return () => {
      alive = false;
      c.dispose();
      setCache(null);
    };
  }, [pdfUrl]);

  useEffect(() => {
    onPageChange(page);
  }, [page, onPageChange]);

  const goPrev = useCallback(() => setPage((p) => Math.max(1, p - 2)), []);
  const goNext = useCallback(
    () => setPage((p) => Math.min(pageCount, p + 2)),
    [pageCount],
  );

  return (
    <div className="relative h-[70vh] min-h-[500px] w-full overflow-hidden rounded-xl bg-gradient-to-b from-[#1d1812] via-[#15110c] to-[#0a0806]">
      <Canvas
        camera={{ position: [0, 0.4, 4.4], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
        shadows
      >
        <ambientLight intensity={0.45} />
        <directionalLight
          position={[2.5, 4, 4]}
          intensity={1.4}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-2, 2, 2]} intensity={0.4} color="#c9a45b" />

        {cache ? (
          <Book
            cache={cache}
            page={page}
            pageCount={pageCount}
            onPrev={goPrev}
            onNext={goNext}
            spineColor={spineColor}
          />
        ) : null}
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-[color:var(--color-ink)]/15 bg-black/60 px-4 py-2 text-xs text-[color:var(--color-ink)]/80 backdrop-blur">
          <button
            type="button"
            onClick={goPrev}
            disabled={page <= 1}
            className="px-2 disabled:opacity-30"
            aria-label="Previous page"
          >
            ←
          </button>
          <input
            type="range"
            min={1}
            max={pageCount}
            step={2}
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
            className="w-48 accent-[color:var(--color-gold)]"
            aria-label="Page slider"
          />
          <button
            type="button"
            onClick={goNext}
            disabled={page >= pageCount}
            className="px-2 disabled:opacity-30"
            aria-label="Next page"
          >
            →
          </button>
          <span className="ml-2 min-w-[60px] text-right text-[color:var(--color-ink)]/50">
            {page} / {pageCount}
          </span>
        </div>
      </div>
    </div>
  );
}

function Book({
  cache,
  page,
  pageCount,
  onPrev,
  onNext,
  spineColor,
}: {
  cache: PageTextureCache;
  page: number;
  pageCount: number;
  onPrev: () => void;
  onNext: () => void;
  spineColor: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [openness, setOpenness] = useState(0);
  const [, forceTick] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 1100;
    const animate = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      setOpenness(1 - Math.pow(1 - k, 3));
      if (k < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function ensure() {
      const targets = [
        page - 2,
        page - 1,
        page,
        page + 1,
        page + 2,
        page + 3,
      ];
      for (const t of targets) {
        if (t < 1 || t > pageCount) continue;
        if (!cache.has(t)) {
          await cache.render(t);
          if (cancelled) return;
          forceTick();
        }
      }
      cache.prune(page, 4);
    }
    ensure();
    return () => {
      cancelled = true;
    };
  }, [page, pageCount, cache]);

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const tx = state.pointer.x * 0.12 * openness;
    const ty = -0.05 + 0.05 * (1 - openness);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, tx, 4, delta);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, ty, 4, delta);
  });

  const W = 1.55;
  const H = 2.15;
  const D = 0.05;

  const leftPage = page % 2 === 0 ? page : page - 1;
  const safeLeft = Math.max(1, leftPage);
  const rightPage = safeLeft + 1;

  const leftTex = cache.get(safeLeft) ?? null;
  const rightTex = rightPage <= pageCount ? (cache.get(rightPage) ?? null) : null;

  const openOffset = openness * 0.02;

  return (
    <group ref={groupRef} position={[0, -0.15, 0]}>
      {/* Back cover */}
      <mesh castShadow receiveShadow position={[0, 0, -D]}>
        <boxGeometry args={[W * 2 + 0.08, H + 0.08, D]} />
        <meshStandardMaterial color={spineColor} roughness={0.55} />
      </mesh>

      {/* Left page (clickable for previous spread) */}
      <PageFace
        position={[-W / 2 - openOffset, 0, 0.001]}
        width={W}
        height={H}
        texture={leftTex}
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
      />

      {/* Right page (clickable for next spread) */}
      <PageFace
        position={[W / 2 + openOffset, 0, 0.001]}
        width={W}
        height={H}
        texture={rightTex}
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
      />

      {/* Spine */}
      <mesh position={[0, 0, -D / 2]}>
        <boxGeometry args={[0.04, H + 0.08, D + 0.04]} />
        <meshStandardMaterial color={spineColor} roughness={0.6} />
      </mesh>
    </group>
  );
}

function PageFace({
  position,
  width,
  height,
  texture,
  onClick,
}: {
  position: [number, number, number];
  width: number;
  height: number;
  texture: THREE.CanvasTexture | null;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}) {
  return (
    <mesh
      castShadow
      receiveShadow
      position={position}
      onClick={onClick}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        map={texture ?? undefined}
        color={texture ? "#ffffff" : "#fdfaf2"}
        roughness={0.95}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}
