"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ensurePdfWorker } from "@/lib/pdf/worker";

type Outline = OutlineItem[];

type OutlineItem = {
  title: string;
  page: number | null;
  items: OutlineItem[];
};

type RawOutlineItem = {
  title: string;
  dest?: unknown;
  items?: RawOutlineItem[];
};

type PdfDocument = {
  getOutline: () => Promise<RawOutlineItem[] | null>;
  getDestination: (
    name: string,
  ) => Promise<unknown[] | null>;
  getPageIndex: (ref: unknown) => Promise<number>;
  destroy: () => Promise<void>;
};

async function resolvePage(
  doc: PdfDocument,
  dest: unknown,
): Promise<number | null> {
  let resolved = dest;
  if (typeof resolved === "string") {
    resolved = await doc.getDestination(resolved);
  }
  if (!Array.isArray(resolved) || resolved.length === 0) return null;
  try {
    const idx = await doc.getPageIndex(resolved[0]);
    return idx + 1;
  } catch {
    return null;
  }
}

async function flattenOutline(
  doc: PdfDocument,
  raw: RawOutlineItem[],
): Promise<Outline> {
  const out: Outline = [];
  for (const item of raw) {
    const page = item.dest ? await resolvePage(doc, item.dest) : null;
    const children = item.items?.length
      ? await flattenOutline(doc, item.items)
      : [];
    out.push({ title: item.title, page, items: children });
  }
  return out;
}

export function ReaderTocPill({
  pdfUrl,
  onJump,
}: {
  pdfUrl: string;
  onJump?: (page: number) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [outline, setOutline] = useState<Outline | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  function jumpToPage(page: number) {
    if (onJump) {
      onJump(page);
      return;
    }
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    if (!open || fetchedRef.current) return;
    fetchedRef.current = true;
    let cancelled = false;
    let doc: PdfDocument | null = null;
    (async () => {
      setLoading(true);
      try {
        const pdfjs = ensurePdfWorker();
        doc = (await pdfjs.getDocument({ url: pdfUrl }).promise) as unknown as PdfDocument;
        const raw = (await doc.getOutline()) ?? [];
        const flat = await flattenOutline(doc, raw);
        if (!cancelled) setOutline(flat);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load contents.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      doc?.destroy();
    };
  }, [open, pdfUrl]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-[color:var(--color-ink)]/15 bg-black/40 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[color:var(--color-ink)]/70 backdrop-blur transition hover:border-[color:var(--color-ink)]/40 hover:text-[color:var(--color-ink)]"
      >
        Contents
      </button>

      {open && (
        <div
          className="pointer-events-auto fixed inset-0 z-40 flex justify-end bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-label="Table of contents"
          onClick={() => setOpen(false)}
        >
          <aside
            className="h-full w-full max-w-sm overflow-y-auto bg-[#14110d] px-6 py-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-gold)]/80">
                Contents
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close contents"
                className="rounded-md px-2 py-1 text-xs uppercase tracking-[0.2em] text-[color:var(--color-ink)]/55 hover:text-[color:var(--color-ink)]"
              >
                close
              </button>
            </div>

            {loading && (
              <p className="text-sm text-[color:var(--color-ink)]/55">
                Loading outline…
              </p>
            )}
            {error && <p className="text-sm text-red-400">{error}</p>}
            {!loading && !error && outline && outline.length === 0 && (
              <p className="text-sm text-[color:var(--color-ink)]/55">
                This PDF has no embedded table of contents.
              </p>
            )}
            {outline && outline.length > 0 && (
              <ol className="space-y-1 text-sm">
                {outline.map((item, i) => (
                  <TocRow
                    key={i}
                    item={item}
                    depth={0}
                    onJump={(page) => {
                      jumpToPage(page);
                      setOpen(false);
                    }}
                  />
                ))}
              </ol>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

function TocRow({
  item,
  depth,
  onJump,
}: {
  item: OutlineItem;
  depth: number;
  onJump: (page: number) => void;
}) {
  const padding = depth * 14;
  return (
    <li>
      <button
        type="button"
        onClick={() => item.page && onJump(item.page)}
        disabled={!item.page}
        className="flex w-full items-baseline justify-between gap-3 rounded-md px-2 py-1.5 text-left transition hover:bg-[color:var(--color-ink)]/5 disabled:opacity-50"
        style={{ paddingLeft: padding + 8 }}
      >
        <span className="truncate text-[color:var(--color-ink)]/85">
          {item.title || "—"}
        </span>
        {item.page && (
          <span className="font-mono text-[10px] tabular-nums text-[color:var(--color-ink)]/45">
            {item.page}
          </span>
        )}
      </button>
      {item.items.length > 0 && (
        <ol className="space-y-1">
          {item.items.map((child, i) => (
            <TocRow key={i} item={child} depth={depth + 1} onJump={onJump} />
          ))}
        </ol>
      )}
    </li>
  );
}
