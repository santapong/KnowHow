"use client";

import * as pdfjsLib from "pdfjs-dist";

let configured = false;

export function ensurePdfWorker() {
  if (configured) return pdfjsLib;
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  configured = true;
  return pdfjsLib;
}
