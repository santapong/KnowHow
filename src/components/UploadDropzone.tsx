"use client";

import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { parsePdf, type PdfMeta } from "@/lib/pdf/parse";
import { SPINE_COLORS } from "@/lib/validation";
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

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`flex h-48 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition ${
          isDragActive
            ? "border-[color:var(--color-gold)] bg-[color:var(--color-gold)]/10"
            : "border-[color:var(--color-ink)]/20 hover:border-[color:var(--color-ink)]/40"
        }`}
      >
        <input {...getInputProps()} />
        {file ? (
          <p className="text-sm text-[color:var(--color-ink)]/80">
            <strong>{file.name}</strong>
            <br />
            <span className="text-xs text-[color:var(--color-ink)]/50">
              {(file.size / (1024 * 1024)).toFixed(1)} MB
              {meta ? ` · ${meta.pageCount} pages` : ""}
            </span>
          </p>
        ) : (
          <p className="text-sm text-[color:var(--color-ink)]/70">
            Drop a PDF here, or click to choose.
            <br />
            <span className="text-xs text-[color:var(--color-ink)]/40">
              Up to 100 MB.
            </span>
          </p>
        )}
      </div>

      {stage === "parsing" && (
        <p className="text-center text-sm text-[color:var(--color-ink)]/60">
          Reading PDF…
        </p>
      )}

      {meta && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[120px_1fr]">
          {coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt="Cover preview"
              className="h-[180px] w-[120px] rounded-sm object-cover shadow-lg"
            />
          )}

          <div className="space-y-4">
            <label className="block text-xs uppercase tracking-[0.2em] text-[color:var(--color-ink)]/60">
              Title
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="mt-2 block w-full rounded-md border border-[color:var(--color-ink)]/20 bg-transparent px-3 py-2 text-sm tracking-normal text-[color:var(--color-ink)]"
              />
            </label>

            <label className="block text-xs uppercase tracking-[0.2em] text-[color:var(--color-ink)]/60">
              Author
              <input
                type="text"
                value={editAuthor}
                onChange={(e) => setEditAuthor(e.target.value)}
                placeholder="Optional"
                className="mt-2 block w-full rounded-md border border-[color:var(--color-ink)]/20 bg-transparent px-3 py-2 text-sm tracking-normal text-[color:var(--color-ink)] placeholder:text-[color:var(--color-ink)]/30"
              />
            </label>

            <fieldset>
              <legend className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-ink)]/60">
                Spine colour
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {SPINE_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setSpineColor(c)}
                    aria-label={`Select ${c}`}
                    className={`h-8 w-8 rounded-full border-2 transition ${
                      spineColor === c
                        ? "border-[color:var(--color-gold)]"
                        : "border-transparent hover:border-[color:var(--color-ink)]/30"
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </fieldset>

            <label className="flex items-start gap-2 text-xs text-[color:var(--color-ink)]/70">
              <input
                type="checkbox"
                checked={acceptDmca}
                onChange={(e) => setAcceptDmca(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                I confirm I have the right to upload this file. KnowHow will
                remove infringing content on request.
              </span>
            </label>
          </div>
        </div>
      )}

      {(stage === "uploading" || stage === "saving") && (
        <div className="space-y-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--color-ink)]/10">
            <div
              className="h-full bg-[color:var(--color-gold)] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-xs uppercase tracking-[0.2em] text-[color:var(--color-ink)]/50">
            {stage === "uploading" ? "Uploading…" : "Saving…"}
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-md border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {meta && (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="w-full rounded-md bg-[color:var(--color-gold)] px-4 py-3 text-sm font-medium text-[color:var(--color-leather)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add to my shelf
        </button>
      )}
    </div>
  );
}
