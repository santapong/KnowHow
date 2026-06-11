"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { enrollInCourse } from "@/actions/enroll";

type Props = {
  courseId: string;
};

export function EnrollButton({ courseId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onEnroll() {
    setError(null);
    startTransition(async () => {
      const result = await enrollInCourse({ courseId });
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={onEnroll}
        disabled={pending}
        className="rounded-md bg-[color:var(--color-gold)] px-5 py-2.5 text-sm font-medium text-[color:var(--color-leather)] transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Enrolling…" : "Enroll →"}
      </button>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
