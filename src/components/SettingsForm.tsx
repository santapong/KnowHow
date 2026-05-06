"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteAccount,
  finalizeAvatarUpload,
  startAvatarUpload,
  updateDisplayName,
} from "@/actions/profile";
import { createClient } from "@/lib/supabase/client";

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

type Props = {
  initialDisplayName: string;
  initialHandle: string;
  initialAvatarUrl: string | null;
  email: string | null;
};

export function SettingsForm({
  initialDisplayName,
  initialHandle,
  initialAvatarUrl,
  email,
}: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [handle, setHandle] = useState(initialHandle);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [pending, startTransition] = useTransition();
  const [avatarPending, setAvatarPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await updateDisplayName({ displayName, handle });
      if (result.ok) setMessage("Saved.");
      else setError(result.error);
    });
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_AVATAR_BYTES) {
      setError("Avatar must be 2 MB or smaller.");
      return;
    }
    setError(null);
    setMessage(null);
    setAvatarPending(true);

    try {
      const start = await startAvatarUpload({ contentType: file.type });
      if (!start.ok) throw new Error(start.error);

      const supabase = createClient();
      const upload = await supabase.storage
        .from(AVATAR_BUCKET)
        .uploadToSignedUrl(start.path, start.uploadToken, file, {
          contentType: file.type,
          upsert: false,
        });
      if (upload.error) throw new Error(upload.error.message);

      const fin = await finalizeAvatarUpload({ path: start.path });
      if (!fin.ok) throw new Error(fin.error);
      setAvatarUrl(fin.avatarUrl);
      setMessage("Avatar updated.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setAvatarPending(false);
    }
  }

  function onDelete() {
    if (
      !confirm(
        "Permanently delete your account, all books, and reading progress? This cannot be undone.",
      )
    )
      return;
    if (!confirm("Last warning. Really delete everything?")) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteAccount();
      if (result.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-10">
      <form onSubmit={onSave} className="space-y-6">
        <div className="flex items-start gap-5">
          <div className="text-center">
            <div
              aria-hidden
              className="grid h-20 w-20 place-items-center overflow-hidden rounded-full border border-[color:var(--color-ink)]/25 bg-[color:var(--color-ink)]/5 font-serif text-2xl text-[color:var(--color-ink)]/70"
            >
              {avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                (displayName || email || "?")[0]?.toUpperCase()
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={avatarPending}
              className="mt-2 text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-ink)]/55 hover:text-[color:var(--color-gold)] disabled:opacity-50"
            >
              {avatarPending ? "uploading…" : "change avatar"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onAvatarChange}
            />
          </div>

          <div className="flex-1 space-y-4">
            <label className="block">
              <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink)]/55">
                Display name
              </span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-2 block w-full border-b-2 border-[color:var(--color-ink)]/30 bg-transparent px-1 py-2 text-base text-[color:var(--color-ink)] focus:border-[color:var(--color-gold)] focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink)]/55">
                Handle
                <span className="ml-2 normal-case tracking-normal text-[color:var(--color-ink)]/40">
                  /u/{handle || "—"}
                </span>
              </span>
              <input
                type="text"
                value={handle}
                onChange={(e) =>
                  setHandle(e.target.value.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase())
                }
                className="mt-2 block w-full border-b-2 border-[color:var(--color-ink)]/30 bg-transparent px-1 py-2 text-base text-[color:var(--color-ink)] focus:border-[color:var(--color-gold)] focus:outline-none"
              />
            </label>

            <div>
              <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink)]/55">
                Email
              </span>
              <p className="mt-2 text-sm text-[color:var(--color-ink)]/55">
                {email ?? "—"} (read-only)
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[color:var(--color-gold)] px-5 py-2.5 text-sm font-medium text-[color:var(--color-leather)] disabled:opacity-50"
        >
          Save
        </button>

        {message && (
          <p className="text-sm text-[color:var(--color-gold)]">{message}</p>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>

      <hr className="border-[color:var(--color-ink)]/10" />

      <section id="danger">
        <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-red-400/80">
          Danger zone
        </h2>
        <p className="mb-4 text-sm text-[color:var(--color-ink)]/60">
          Permanently delete your account, all uploaded books, and reading
          progress.
        </p>
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="rounded-md border border-red-500/40 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
        >
          Delete my account
        </button>
      </section>
    </div>
  );
}
