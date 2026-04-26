"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateDisplayName, deleteAccount } from "@/actions/profile";

export function SettingsForm({
  initialDisplayName,
}: {
  initialDisplayName: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await updateDisplayName({ displayName });
      if (result.ok) setMessage("Saved.");
      else setError(result.error);
    });
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
      <form onSubmit={onSave} className="space-y-4">
        <label className="block text-xs uppercase tracking-[0.2em] text-[color:var(--color-ink)]/60">
          Display name
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-2 block w-full rounded-md border border-[color:var(--color-ink)]/20 bg-transparent px-3 py-2.5 text-sm tracking-normal text-[color:var(--color-ink)]"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[color:var(--color-gold)] px-4 py-2 text-sm font-medium text-[color:var(--color-leather)] disabled:opacity-50"
        >
          Save
        </button>

        {message && (
          <p className="text-sm text-[color:var(--color-gold)]">{message}</p>
        )}
      </form>

      <hr className="border-[color:var(--color-ink)]/10" />

      <section>
        <h2 className="mb-2 text-sm uppercase tracking-[0.2em] text-red-400/80">
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

        {error && (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        )}
      </section>
    </div>
  );
}
