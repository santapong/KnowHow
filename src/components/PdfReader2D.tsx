"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ensurePdfWorker } from "@/lib/pdf/worker";
import { saveReadingState } from "@/actions/saveReadingState";

type Props = {
  bookId: string;
  pdfUrl: string;
  pageCount: number;
  initialPage: number;
  canPersist: boolean;
};

type PdfDoc = Awaited<
  ReturnType<typeof import("pdfjs-dist").getDocument>["promise"]
>;

export function PdfReader2D({
  bookId,
  pdfUrl,
  pageCount,
  initialPage,
  canPersist,
}: Props) {
  const [page, setPage] = useState(
    Math.max(1, Math.min(initialPage || 1, pageCount)),
  );
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);

  const prev = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const next = useCallback(
    () => setPage((p) => Math.min(pageCount, p + 1)),
    [pageCount],
  );

  // Load PDF
  useEffect(() => {
    let cancelled = false;
    let loaded: PdfDoc | null = null;
    const pdfjs = ensurePdfWorker();

    pdfjs
      .getDocument({ url: pdfUrl, withCredentials: false })
      .promise.then((d) => {
        if (cancelled) {
          d.destroy();
          return;
        }
        loaded = d;
        setDoc(d);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load PDF");
        }
      });

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
      loaded?.destroy();
      setDoc(null);
    };
  }, [pdfUrl]);

  // Render current page
  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    renderTaskRef.current?.cancel();

    (async () => {
      const p = await doc.getPage(page);
      if (cancelled) return;
      const dpr = window.devicePixelRatio || 1;
      const containerWidth = canvas.parentElement?.clientWidth ?? 800;
      const baseViewport = p.getViewport({ scale: 1 });
      const scale = (containerWidth / baseViewport.width) * dpr;
      const viewport = p.getViewport({ scale });

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${viewport.width / dpr}px`;
      canvas.style.height = `${viewport.height / dpr}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const task = p.render({ canvas, canvasContext: ctx, viewport });
      renderTaskRef.current = task;
      try {
        await task.promise;
      } catch {
        // cancelled
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [doc, page]);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "PageDown") next();
      if (e.key === "ArrowLeft" || e.key === "PageUp") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  // Debounced reading-state save
  useEffect(() => {
    if (!canPersist) return;
    const t = window.setTimeout(() => {
      void saveReadingState({ bookId, lastPage: page });
    }, 1500);
    return () => window.clearTimeout(t);
  }, [bookId, page, canPersist]);

  if (error) {
    return (
      <p className="rounded-md border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center rounded-lg bg-black/30 p-4 shadow-lg">
        {!doc ? (
          <p className="py-32 text-sm text-[color:var(--color-ink)]/40">
            Loading book…
          </p>
        ) : (
          <canvas ref={canvasRef} aria-label={`Page ${page}`} />
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={prev}
          disabled={page <= 1}
          className="rounded-md border border-[color:var(--color-ink)]/20 px-3 py-1.5 text-sm disabled:opacity-30"
          aria-label="Previous page"
        >
          ←
        </button>

        <input
          type="range"
          min={1}
          max={pageCount}
          value={page}
          onChange={(e) => setPage(Number(e.target.value))}
          className="flex-1 accent-[color:var(--color-gold)]"
          aria-label="Page slider"
        />

        <button
          type="button"
          onClick={next}
          disabled={page >= pageCount}
          className="rounded-md border border-[color:var(--color-ink)]/20 px-3 py-1.5 text-sm disabled:opacity-30"
          aria-label="Next page"
        >
          →
        </button>

        <span className="ml-2 min-w-[80px] text-right text-xs uppercase tracking-[0.2em] text-[color:var(--color-ink)]/50">
          {page} / {pageCount}
        </span>
      </div>
    </div>
  );
}
