"use client";

import { ensurePdfWorker } from "./worker";

export type PdfMeta = {
  pageCount: number;
  title: string;
  author: string | null;
  coverBlob: Blob;
};

export async function parsePdf(file: File): Promise<PdfMeta> {
  const pdfjs = ensurePdfWorker();
  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  try {
    const pageCount = doc.numPages;
    if (pageCount < 1) throw new Error("PDF has zero pages");

    const meta = await doc.getMetadata().catch(() => null);
    const info = (meta?.info ?? {}) as Record<string, string | undefined>;
    const rawTitle = info.Title?.trim();
    const title = rawTitle && rawTitle.length > 0
      ? rawTitle
      : file.name.replace(/\.pdf$/i, "");
    const author = info.Author?.trim() || null;

    const coverBlob = await renderCover(doc);
    return { pageCount, title, author, coverBlob };
  } finally {
    await doc.destroy();
  }
}

async function renderCover(
  doc: Awaited<ReturnType<typeof import("pdfjs-dist").getDocument>["promise"]>,
): Promise<Blob> {
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 1 });
  const targetWidth = 600;
  const scale = targetWidth / viewport.width;
  const scaled = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(scaled.width);
  canvas.height = Math.ceil(scaled.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context");

  await page.render({ canvas, canvasContext: ctx, viewport: scaled }).promise;

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.85),
  );
  if (!blob) throw new Error("Failed to encode cover image");
  return blob;
}
