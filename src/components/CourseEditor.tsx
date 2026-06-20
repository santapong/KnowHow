"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateCourse,
  setCoursePublished,
  deleteCourse,
  addModule,
  deleteModule,
  addLesson,
  deleteLesson,
} from "@/actions/courses";
import type { CourseDetail } from "@/lib/courses";

type BookOption = { id: string; title: string };

export function CourseEditor({
  course,
  books,
}: {
  course: CourseDetail;
  books: BookOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description);
  const [newModule, setNewModule] = useState("");

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setError(result.error ?? "Something went wrong");
      else router.refresh();
    });
  }

  const dirty =
    title !== course.title || description !== course.description;

  return (
    <div className="mt-8 space-y-10">
      {error && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* Course meta */}
      <section className="space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={160}
          className="w-full border-b border-[color:var(--color-ink)]/25 bg-transparent pb-2 font-serif text-3xl outline-none focus:border-[color:var(--color-gold)]/70"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Course description"
          className="w-full rounded-md border border-[color:var(--color-ink)]/20 bg-[color:var(--color-ink)]/[0.03] p-3 text-[15px] outline-none placeholder:text-[color:var(--color-ink)]/25 focus:border-[color:var(--color-gold)]/60"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={pending || !dirty}
            onClick={() =>
              run(() => updateCourse({ courseId: course.id, title, description }))
            }
            className="rounded-md border border-[color:var(--color-ink)]/25 px-4 py-2 text-sm hover:border-[color:var(--color-gold)]/60 disabled:opacity-40"
          >
            Save details
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(() =>
                setCoursePublished({
                  courseId: course.id,
                  isPublished: !course.is_published,
                }),
              )
            }
            className={`rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
              course.is_published
                ? "border border-[color:var(--color-ink)]/25 hover:border-[color:var(--color-ink)]/45"
                : "bg-[color:var(--color-gold)] text-[color:var(--color-leather)] hover:opacity-90"
            }`}
          >
            {course.is_published ? "Unpublish" : "Publish"}
          </button>
          <span
            className={`font-mono text-[10px] uppercase tracking-[0.16em] ${
              course.is_published
                ? "text-[color:var(--color-gold)]"
                : "text-[color:var(--color-ink)]/45"
            }`}
          >
            {course.is_published ? "● Live" : "○ Draft"}
          </span>
          <span className="ml-auto" />
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!confirm("Delete this course? This cannot be undone.")) return;
              run(async () => {
                const r = await deleteCourse({ id: course.id });
                if (r.ok) router.push("/instructor");
                return r;
              });
            }}
            className="text-xs uppercase tracking-[0.16em] text-red-400/70 hover:text-red-400"
          >
            Delete course
          </button>
        </div>
      </section>

      {/* Modules + lessons */}
      <section className="space-y-6">
        {course.modules.map((m, mi) => (
          <div
            key={m.id}
            className="rounded-xl border border-[color:var(--color-ink)]/12 bg-[color:var(--color-ink)]/[0.03] p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-serif text-lg font-semibold tracking-tight">
                <span className="text-[color:var(--color-ink)]/40">
                  {String(mi + 1).padStart(2, "0")}
                </span>{" "}
                {m.title}
              </h3>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!confirm(`Delete module "${m.title}" and its lessons?`)) return;
                  run(() => deleteModule({ id: m.id }));
                }}
                className="text-[11px] uppercase tracking-[0.14em] text-red-400/60 hover:text-red-400"
              >
                Remove
              </button>
            </div>

            <ul className="mt-3 divide-y divide-[color:var(--color-ink)]/8 border-y border-[color:var(--color-ink)]/8">
              {m.lessons.length === 0 && (
                <li className="py-2.5 text-sm text-[color:var(--color-ink)]/40">
                  No lessons yet.
                </li>
              )}
              {m.lessons.map((l) => (
                <li key={l.id} className="flex items-center gap-3 py-2.5">
                  <span className="flex-1 text-[15px] text-[color:var(--color-ink)]/85">
                    {l.title}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-ink)]/40">
                    {[l.book_id ? "Book" : null, l.video_url ? "Video" : null]
                      .filter(Boolean)
                      .join(" + ") || "No content"}
                  </span>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => deleteLesson({ id: l.id }))}
                    className="text-[11px] uppercase tracking-[0.14em] text-red-400/60 hover:text-red-400"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>

            <AddLessonForm
              moduleId={m.id}
              books={books}
              disabled={pending}
              onAdd={(payload) => run(() => addLesson(payload))}
            />
          </div>
        ))}

        {/* Add module */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newModule.trim()) return;
            run(async () => {
              const r = await addModule({ courseId: course.id, title: newModule });
              if (r.ok) setNewModule("");
              return r;
            });
          }}
          className="flex gap-2"
        >
          <input
            value={newModule}
            onChange={(e) => setNewModule(e.target.value)}
            maxLength={160}
            placeholder="New module title"
            className="flex-1 rounded-md border border-[color:var(--color-ink)]/20 bg-[color:var(--color-ink)]/[0.03] px-3 py-2 text-sm outline-none placeholder:text-[color:var(--color-ink)]/25 focus:border-[color:var(--color-gold)]/60"
          />
          <button
            type="submit"
            disabled={pending || !newModule.trim()}
            className="rounded-md border border-[color:var(--color-ink)]/25 px-4 py-2 text-sm hover:border-[color:var(--color-gold)]/60 disabled:opacity-40"
          >
            + Module
          </button>
        </form>
      </section>
    </div>
  );
}

function AddLessonForm({
  moduleId,
  books,
  disabled,
  onAdd,
}: {
  moduleId: string;
  books: BookOption[];
  disabled: boolean;
  onAdd: (payload: {
    moduleId: string;
    title: string;
    bookId: string | null;
    videoUrl: string | null;
    content: string;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [bookId, setBookId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onAdd({
          moduleId,
          title,
          bookId: bookId || null,
          videoUrl: videoUrl.trim() || null,
          content: "",
        });
        setTitle("");
        setBookId("");
        setVideoUrl("");
      }}
      className="mt-4 flex flex-wrap items-center gap-2"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={160}
        placeholder="New lesson title"
        className="min-w-[12rem] flex-1 rounded-md border border-[color:var(--color-ink)]/20 bg-[color:var(--color-ink)]/[0.03] px-3 py-2 text-sm outline-none placeholder:text-[color:var(--color-ink)]/25 focus:border-[color:var(--color-gold)]/60"
      />
      <select
        value={bookId}
        onChange={(e) => setBookId(e.target.value)}
        className="rounded-md border border-[color:var(--color-ink)]/20 bg-[#14110d] px-3 py-2 text-sm outline-none focus:border-[color:var(--color-gold)]/60"
      >
        <option value="">No book</option>
        {books.map((b) => (
          <option key={b.id} value={b.id}>
            {b.title}
          </option>
        ))}
      </select>
      <input
        type="url"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        maxLength={500}
        placeholder="Video URL (YouTube/Vimeo, optional)"
        className="min-w-[12rem] flex-1 rounded-md border border-[color:var(--color-ink)]/20 bg-[color:var(--color-ink)]/[0.03] px-3 py-2 text-sm outline-none placeholder:text-[color:var(--color-ink)]/25 focus:border-[color:var(--color-gold)]/60"
      />
      <button
        type="submit"
        disabled={disabled || !title.trim()}
        className="rounded-md border border-[color:var(--color-ink)]/25 px-3 py-2 text-sm hover:border-[color:var(--color-gold)]/60 disabled:opacity-40"
      >
        + Lesson
      </button>
    </form>
  );
}
