"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createCourseSchema,
  updateCourseSchema,
  publishCourseSchema,
  addModuleSchema,
  addLessonSchema,
  idSchema,
  slugify,
} from "@/lib/validation";

type Result<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Resolve the owning course's slug + id from a module or lesson, so we can
 *  revalidate the editor and confirm ownership cheaply. */
async function courseForModule(
  supabase: Awaited<ReturnType<typeof createClient>>,
  moduleId: string,
) {
  const { data } = await supabase
    .from("modules")
    .select("course_id, courses!inner(instructor_id)")
    .eq("id", moduleId)
    .maybeSingle();
  return data;
}

export async function createCourse(input: {
  title: string;
  description?: string;
}): Promise<Result<{ courseId: string; slug: string }>> {
  const parsed = createCourseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in" };

  // Build a unique slug: base from title, suffix on collision.
  const base = slugify(parsed.data.title) || "course";
  let slug = base;
  for (let i = 0; i < 50; i++) {
    const { data: clash } = await supabase
      .from("courses")
      .select("id")
      .ilike("slug", slug)
      .maybeSingle();
    if (!clash) break;
    slug = `${base}-${i + 2}`;
  }

  const { data, error } = await supabase
    .from("courses")
    .insert({
      instructor_id: user.id,
      slug,
      title: parsed.data.title,
      description: parsed.data.description ?? "",
    })
    .select("id, slug")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Failed" };

  revalidatePath("/instructor");
  return { ok: true, courseId: data.id, slug: data.slug };
}

export async function updateCourse(input: {
  courseId: string;
  title: string;
  description: string;
}): Promise<Result> {
  const parsed = updateCourseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { error } = await supabase
    .from("courses")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.courseId)
    .eq("instructor_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/instructor/courses/${parsed.data.courseId}`);
  return { ok: true };
}

export async function setCoursePublished(input: {
  courseId: string;
  isPublished: boolean;
}): Promise<Result> {
  const parsed = publishCourseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in" };

  // Don't allow publishing an empty course.
  if (parsed.data.isPublished) {
    const { count } = await supabase
      .from("lessons")
      .select("id, modules!inner(course_id)", { count: "exact", head: true })
      .eq("modules.course_id", parsed.data.courseId);
    if (!count) {
      return { ok: false, error: "Add at least one lesson before publishing." };
    }
  }

  const { error } = await supabase
    .from("courses")
    .update({
      is_published: parsed.data.isPublished,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.courseId)
    .eq("instructor_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/instructor/courses/${parsed.data.courseId}`);
  revalidatePath("/courses");
  return { ok: true };
}

export async function deleteCourse(input: {
  id: string;
}): Promise<Result> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", parsed.data.id)
    .eq("instructor_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/instructor");
  revalidatePath("/courses");
  return { ok: true };
}

export async function addModule(input: {
  courseId: string;
  title: string;
}): Promise<Result<{ moduleId: string }>> {
  const parsed = addModuleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in" };

  // Confirm ownership of the course (RLS also enforces, but fail clean).
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", parsed.data.courseId)
    .eq("instructor_id", user.id)
    .maybeSingle();
  if (!course) return { ok: false, error: "Course not found" };

  const { data: last } = await supabase
    .from("modules")
    .select("position")
    .eq("course_id", parsed.data.courseId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (last?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("modules")
    .insert({ course_id: parsed.data.courseId, title: parsed.data.title, position })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Failed" };
  revalidatePath(`/instructor/courses/${parsed.data.courseId}`);
  return { ok: true, moduleId: data.id };
}

export async function deleteModule(input: { id: string }): Promise<Result> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const owning = await courseForModule(supabase, parsed.data.id);
  // RLS restricts deletes to the owner; revalidate the editor regardless.
  const { error } = await supabase.from("modules").delete().eq("id", parsed.data.id);
  if (error) return { ok: false, error: error.message };
  if (owning?.course_id) {
    revalidatePath(`/instructor/courses/${owning.course_id}`);
  }
  return { ok: true };
}

export async function addLesson(input: {
  moduleId: string;
  title: string;
  bookId?: string | null;
  content?: string;
}): Promise<Result<{ lessonId: string }>> {
  const parsed = addLessonSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const owning = await courseForModule(supabase, parsed.data.moduleId);
  if (!owning) return { ok: false, error: "Module not found" };

  // If a book is attached, it must belong to the instructor.
  if (parsed.data.bookId) {
    const { data: book } = await supabase
      .from("books")
      .select("id")
      .eq("id", parsed.data.bookId)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!book) return { ok: false, error: "That book isn't one of yours." };
  }

  const { data: last } = await supabase
    .from("lessons")
    .select("position")
    .eq("module_id", parsed.data.moduleId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (last?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("lessons")
    .insert({
      module_id: parsed.data.moduleId,
      title: parsed.data.title,
      position,
      book_id: parsed.data.bookId,
      content: parsed.data.content ?? "",
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Failed" };
  if (owning.course_id) {
    revalidatePath(`/instructor/courses/${owning.course_id}`);
  }
  return { ok: true, lessonId: data.id };
}

export async function deleteLesson(input: { id: string }): Promise<Result> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: lesson } = await supabase
    .from("lessons")
    .select("module_id, modules!inner(course_id)")
    .eq("id", parsed.data.id)
    .maybeSingle();

  const { error } = await supabase.from("lessons").delete().eq("id", parsed.data.id);
  if (error) return { ok: false, error: error.message };

  const courseId = (
    lesson as { modules?: { course_id?: string } } | null
  )?.modules?.course_id;
  if (courseId) revalidatePath(`/instructor/courses/${courseId}`);
  return { ok: true };
}
