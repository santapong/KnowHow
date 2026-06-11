"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { enrollSchema, lessonProgressSchema } from "@/lib/validation";

export async function enrollInCourse(input: { courseId: string }) {
  const parsed = enrollSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  // Only enroll in courses RLS lets us see (published, or own).
  const { data: course } = await supabase
    .from("courses")
    .select("id, slug")
    .eq("id", parsed.data.courseId)
    .maybeSingle();
  if (!course) return { ok: false as const, error: "Course not found" };

  const { error } = await supabase
    .from("enrollments")
    .upsert(
      { user_id: user.id, course_id: course.id },
      { onConflict: "user_id,course_id" },
    );
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/courses/${course.slug}`);
  revalidatePath("/courses");
  return { ok: true as const };
}

export async function setLessonProgress(input: {
  lessonId: string;
  completed: boolean;
}) {
  const parsed = lessonProgressSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  if (parsed.data.completed) {
    const { error } = await supabase
      .from("lesson_progress")
      .upsert(
        { user_id: user.id, lesson_id: parsed.data.lessonId },
        { onConflict: "user_id,lesson_id" },
      );
    if (error) return { ok: false as const, error: error.message };
  } else {
    const { error } = await supabase
      .from("lesson_progress")
      .delete()
      .eq("user_id", user.id)
      .eq("lesson_id", parsed.data.lessonId);
    if (error) return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}
