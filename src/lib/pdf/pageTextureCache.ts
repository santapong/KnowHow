"use client";

import * as THREE from "three";
import { ensurePdfWorker } from "./worker";

type Doc = Awaited<
  ReturnType<typeof import("pdfjs-dist").getDocument>["promise"]
>;

export class PageTextureCache {
  private doc: Doc | null = null;
  private cache = new Map<number, THREE.CanvasTexture>();
  private renderScale: number;

  constructor(renderScale = 1.5) {
    this.renderScale = renderScale;
  }

  async open(url: string) {
    const pdfjs = ensurePdfWorker();
    this.doc = await pdfjs.getDocument({ url, withCredentials: false }).promise;
    return this.doc.numPages;
  }

  has(page: number) {
    return this.cache.has(page);
  }

  get(page: number) {
    return this.cache.get(page);
  }

  async render(page: number): Promise<THREE.CanvasTexture | null> {
    if (!this.doc) return null;
    const cached = this.cache.get(page);
    if (cached) return cached;
    if (page < 1 || page > this.doc.numPages) return null;

    const p = await this.doc.getPage(page);
    const baseViewport = p.getViewport({ scale: 1 });
    const targetWidth = 768;
    const scale = (targetWidth / baseViewport.width) * this.renderScale;
    const viewport = p.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#fdfaf2";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await p.render({ canvas, canvasContext: ctx, viewport }).promise;

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    this.cache.set(page, tex);
    return tex;
  }

  prune(currentPage: number, window = 4) {
    for (const [page, tex] of this.cache) {
      if (Math.abs(page - currentPage) > window) {
        tex.dispose();
        this.cache.delete(page);
      }
    }
  }

  dispose() {
    for (const tex of this.cache.values()) tex.dispose();
    this.cache.clear();
    this.doc?.destroy();
    this.doc = null;
  }
}
