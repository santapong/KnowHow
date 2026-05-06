"use client";

import * as pdfjsLib from "pdfjs-dist";

let configured = false;

export function ensurePdfWorker() {
  if (configured) return pdfjsLib;
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
  configured = true;
  return pdfjsLib;
}
