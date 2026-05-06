"use client";

import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { parsePdf, type PdfMeta } from "@/lib/pdf/parse";
import {
  BOOK_GENRES,
  BOOK_GENRE_LABELS,
  SPINE_COLORS,
  type BookGenre,
} from "@/lib/validation";
import { startBookUpload, finalizeBookUpload } from "@/actions/createBook";
import { createClient } from "@/lib/supabase/client";

type Stage = "idle" | "parsing" | "ready" | "uploading" | "saving" | "done" | "error";

const MAX_BYTES = 100 * 1024 * 1024;

export function UploadDropzone() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<PdfMeta | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [spineColor, setSpineColor] = useState<(typeof SPINE_COLORS)[number]>(
    SPINE_COLORS[0],
  );
  const [genre, setGenre] = useState<BookGenre>("other");
  const [acceptDmca, setAcceptDmca] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");

  const onDrop = useCallback(async (accepted: File[]) => {
    setError(null);
    const f = accepted[0];
    if (!f) return;
    if (f.size > MAX_BYTES) {
      setError("File too large (max 100 MB).");
      return;
    }
    setFile(f);
    setStage("parsing");
    try {
      const m = await parsePdf(f);
      setMeta(m);
      setEditTitle(m.title);
      setEditAuthor(m.author ?? "");
      setCoverUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(m.coverBlob);
      });
      setStage("ready");
    } catch (err) {
      setStage("error");
      setError(err instanceof Error ? err.message : "Could not parse PDF.");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    maxSize: MAX_BYTES,
    disabled: stage === "uploading" || stage === "saving",
  });

  const canSubmit = useMemo(
    () =>
      stage === "ready" &&
      !!file &&
      !!meta &&
      acceptDmca &&
      editTitle.trim().length > 0,
    [stage, file, meta, acceptDmca, editTitle],
  );

  async function onSubmit() {
    if (!file || !meta || !acceptDmca) return;
    setError(null);
    setStage("uploading");
    setProgress(0);

    const start = await startBookUpload({
      title: editTitle.trim(),
      author: editAuthor.trim() || null,
      pageCount: meta.pageCount,
      spineColor,
      genre,
      sizeBytes: file.size,
      acceptDmca: true,
    });

    if (!start.ok) {
      setStage("error");
      setError(start.error);
      return;
    }

    const supabase = createClient();
    const pdfUpload = await supabase.storage
      .from("pdfs")
      .uploadToSignedUrl(start.pdfPath, start.pdfUploadToken, file, {
        contentType: "application/pdf",
        upsert: false,
      });
    if (pdfUpload.error) {
      setStage("error");
      setError(pdfUpload.error.message);
      return;
    }
    setProgress(60);

    const coverUpload = await supabase.storage
      .from("covers")
      .uploadToSignedUrl(start.coverPath, start.coverUploadToken, meta.coverBlob, {
        contentType: "image/webp",
        upsert: false,
      });
    if (coverUpload.error) {
      setStage("error");
      setError(coverUpload.error.message);
      return;
    }
    setProgress(85);

    setStage("saving");
    const fin = await finalizeBookUpload({
      bookId: start.bookId,
      title: editTitle.trim(),
      author: editAuthor.trim() || null,
      pageCount: meta.pageCount,
      spineColor,
      genre,
      sizeBytes: file.size,
      acceptDmca: true,
      pdfPath: start.pdfPath,
      coverPath: start.coverPath,
    });

    if (!fin.ok) {
      setStage("error");
      setError(fin.error);
      return;
    }

    setProgress(100);
    setStage("done");
    router.push(`/shelf`);
    router.refresh();
  }

  if (stage === "done") {
    return (
      <p className="rounded-md bg-[color:var(--color-gold)]/10 p-6 text-center text-sm text-[color:var(--color-gold)]">
        Uploaded. Redirecting to your shelf…
      </p>
    );
  }

  const hasCover = !!coverUrl;
  const isBusy = stage === "uploading" || stage === "saving";

  return (
    <div className="space-y-10">
      <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)_24px_minmax(0,1fr)]">
        {/* Stage 1 — Drop */}
        <Stage label="1 · drop" caption="parse in browser">
          <div
            {...getRootProps()}
            className={`flex aspect-[3/4] cursor-pointer items-center justify-center rounded-md border-2 border-dashed p-6 text-center transition ${
              isDragActive
                ? "border-[color:var(--color-gold)] bg-[color:var(--color-gold)]/10"
                : "border-[color:var(--color-ink)]/25 hover:border-[color:var(--color-ink)]/45"
            } ${file ? "bg-[color:var(--color-ink)]/5" : ""}`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="space-y-1 text-sm">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-gold)]/80">
                  pdf
                </p>
                <p className="break-all font-serif text-base text-[color:var(--color-ink)]">
                  {file.name}
                </p>
                <p className="text-xs text-[color:var(--color-ink)]/55">
                  {(file.size / (1024 * 1024)).toFixed(1)} MB
                  {meta ? ` · ${meta.pageCount} pages` : ""}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <PdfGlyph />
                <p className="text-sm text-[color:var(--color-ink)]/75">
                  Drop a PDF here
                </p>
                <p className="text-xs text-[color:var(--color-ink)]/45">
                  or click · up to 100 MB
                </p>
              </div>
            )}
          </div>
        </Stage>

        <Arrow active={hasCover} caption={stage === "parsing" ? "parsing…" : "becomes"} />

        {/* Stage 2 — Cover */}
        <Stage label="2 · cover" caption="auto-extracted">
          <div className="flex aspect-[3/4] items-center justify-center rounded-md border border-[color:var(--color-ink)]/15 bg-[color:var(--color-ink)]/5 p-6">
            {hasCover ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverUrl ?? ""}
                  alt="Cover preview"
                  className="h-[260px] w-auto rounded-sm object-cover shadow-[0_18px_50px_rgba(0,0,0,0.5)]"
                />
              </div>
            ) : (
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink)]/35">
                — waiting —
              </p>
            )}
          </div>
        </Stage>

        <Arrow active={hasCover && acceptDmca} caption="placed on shelf" />

        {/* Stage 3 — Shelf */}
        <Stage label="3 · shelf" caption="ready to read">
          <div className="flex aspect-[3/4] items-end justify-center gap-1 rounded-md border border-[color:var(--color-ink)]/15 bg-gradient-to-b from-[#1d160e] to-[#0e0a07] p-6">
            <DummySpine h={140} w={18} />
            <DummySpine h={170} w={22} />
            <DummySpine h={210} w={28} active color={spineColor} title={editTitle || "New"} />
            <DummySpine h={150} w={20} />
            <DummySpine h={180} w={24} />
          </div>
        </Stage>
      </div>

      {meta && (
        <div className="rounded-lg border border-[color:var(--color-ink)]/12 bg-[color:var(--color-ink)]/[0.02] p-6">
          <div className="grid gap-6 md:grid-cols-3">
            <label className="block">
              <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink)]/55">
                Title
              </span>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="mt-2 block w-full border-b-2 border-[color:var(--color-ink)]/30 bg-transparent px-1 py-2 text-base tracking-normal text-[color:var(--color-ink)] focus:border-[color:var(--color-gold)] focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink)]/55">
                Author
              </span>
              <input
                type="text"
                value={editAuthor}
                onChange={(e) => setEditAuthor(e.target.value)}
                placeholder="Optional"
                className="mt-2 block w-full border-b-2 border-[color:var(--color-ink)]/30 bg-transparent px-1 py-2 text-base tracking-normal text-[color:var(--color-ink)] placeholder:text-[color:var(--color-ink)]/30 focus:border-[color:var(--color-gold)] focus:outline-none"
              />
            </label>

            <fieldset>
              <legend className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink)]/55">
                Spine
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {SPINE_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setSpineColor(c)}
                    aria-label={`Select ${c}`}
                    className={`h-9 w-7 rounded-sm border-2 transition ${
                      spineColor === c
                        ? "border-[color:var(--color-gold)] shadow-[0_0_0_2px_rgba(201,164,91,0.2)]"
                        : "border-transparent hover:border-[color:var(--color-ink)]/30"
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </fieldset>
          </div>

          <label className="mt-6 block">
            <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink)]/55">
              Genre
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {BOOK_GENRES.map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setGenre(g)}
                  className={`rounded-full border px-3 py-1.5 text-xs tracking-wide transition ${
                    genre === g
                      ? "border-[color:var(--color-gold)]/70 bg-[color:var(--color-gold)]/15 text-[color:var(--color-gold)]"
                      : "border-[color:var(--color-ink)]/20 text-[color:var(--color-ink)]/65 hover:border-[color:var(--color-ink)]/40"
                  }`}
                >
                  {BOOK_GENRE_LABELS[g]}
                </button>
              ))}
            </div>
          </label>

          <label className="mt-6 flex items-start gap-3 text-xs text-[color:var(--color-ink)]/70">
            <input
              type="checkbox"
              checked={acceptDmca}
              onChange={(e) => setAcceptDmca(e.target.checked)}
              className="mt-0.5 accent-[color:var(--color-gold)]"
            />
            <span>
              I confirm I have the right to upload this file. KnowHow will
              remove infringing content on request.
            </span>
          </label>

          {(stage === "uploading" || stage === "saving") && (
            <div className="mt-6 space-y-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--color-ink)]/10">
                <div
                  className="h-full bg-[color:var(--color-gold)] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink)]/50">
                {stage === "uploading" ? "Uploading…" : "Saving…"}
              </p>
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="mt-6 flex items-center justify-end">
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit || isBusy}
              className="rounded-md bg-[color:var(--color-gold)] px-6 py-3 text-sm font-medium text-[color:var(--color-leather)] shadow-[0_8px_24px_rgba(201,164,91,0.2)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Shelve it →
            </button>
          </div>
        </div>
      )}

      {!meta && stage === "parsing" && (
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink)]/50">
          Reading PDF…
        </p>
      )}

      {!meta && error && (
        <p className="rounded-md border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

function Stage({
  label,
  caption,
  children,
}: {
  label: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-gold)]/80">
        {label}
      </p>
      {children}
      <p className="text-xs italic text-[color:var(--color-ink)]/50">
        {caption}
      </p>
    </div>
  );
}

function Arrow({ active, caption }: { active: boolean; caption: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width="36"
        height="14"
        viewBox="0 0 36 14"
        className={`transition ${
          active ? "text-[color:var(--color-gold)]" : "text-[color:var(--color-ink)]/25"
        }`}
        aria-hidden
      >
        <path
          d="M2 7 H30 M22 2 L30 7 L22 12"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p
        className={`font-mono text-[9px] uppercase tracking-[0.22em] transition ${
          active ? "text-[color:var(--color-ink)]/70" : "text-[color:var(--color-ink)]/35"
        }`}
      >
        {caption}
      </p>
    </div>
  );
}

function DummySpine({
  h,
  w,
  color,
  title,
  active,
}: {
  h: number;
  w: number;
  color?: string;
  title?: string;
  active?: boolean;
}) {
  return (
    <div
      className={`relative shrink-0 rounded-[2px] border ${
        active
          ? "border-[color:var(--color-gold)]/70 shadow-[0_0_18px_rgba(201,164,91,0.35)]"
          : "border-black/30"
      }`}
      style={{
        width: w,
        height: h,
        background: color
          ? `linear-gradient(180deg, ${color} 0%, rgba(0,0,0,0.4) 100%)`
          : "linear-gradient(180deg, #4a3422 0%, #1a0f08 100%)",
      }}
    >
      {title && active && (
        <span
          className="absolute inset-x-0 top-3 mx-auto block max-h-[80%] overflow-hidden text-center font-mono text-[8px] uppercase tracking-[0.18em] text-[color:var(--color-ink)]/85"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          {title}
        </span>
      )}
    </div>
  );
}

function PdfGlyph() {
  return (
    <div className="mx-auto flex h-12 w-9 items-center justify-center rounded-sm border border-[color:var(--color-ink)]/45 font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--color-ink)]/60">
      pdf
    </div>
  );
}
