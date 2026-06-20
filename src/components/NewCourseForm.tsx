"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCourse } from "@/actions/courses";

export function NewCourseForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createCourse({ title, description });
      if (!result.ok) setError(result.error);
      else router.push(`/instructor/courses/${result.courseId}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6">
      <div>
        <label className="block font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-ink)]/55">
          Title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={160}
          placeholder="Introduction to Photosynthesis"
          className="mt-2 w-full border-b border-[color:var(--color-ink)]/25 bg-transparent pb-2 font-serif text-2xl outline-none placeholder:text-[color:var(--color-ink)]/25 focus:border-[color:var(--color-gold)]/70"
        />
      </div>
      <div>
        <label className="block font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-ink)]/55">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="What will learners come away with?"
          className="mt-2 w-full rounded-md border border-[color:var(--color-ink)]/20 bg-[color:var(--color-ink)]/[0.03] p-3 text-[15px] leading-relaxed outline-none placeholder:text-[color:var(--color-ink)]/25 focus:border-[color:var(--color-gold)]/60"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={pending || title.trim().length < 2}
        className="rounded-md bg-[color:var(--color-gold)] px-5 py-2.5 text-sm font-medium text-[color:var(--color-leather)] transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create course →"}
      </button>
    </form>
  );
}
