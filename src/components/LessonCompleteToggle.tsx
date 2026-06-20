"use client";

import { useState, useTransition } from "react";
import { setLessonProgress } from "@/actions/enroll";

export function LessonCompleteToggle({
  lessonId,
  initialDone,
}: {
  lessonId: string;
  initialDone: boolean;
}) {
  const [done, setDone] = useState(initialDone);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !done;
    setDone(next);
    startTransition(async () => {
      const result = await setLessonProgress({ lessonId, completed: next });
      if (!result.ok) setDone(!next); // revert on failure
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={done}
      title={done ? "Mark incomplete" : "Mark complete"}
      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] transition disabled:opacity-50 ${
        done
          ? "border-[color:var(--color-gold)]/70 bg-[color:var(--color-gold)]/20 text-[color:var(--color-gold)]"
          : "border-[color:var(--color-ink)]/25 text-transparent hover:border-[color:var(--color-gold)]/50"
      }`}
    >
      ✓
    </button>
  );
}
