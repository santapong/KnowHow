import { createClient } from "@/lib/supabase/server";
import type { ProfileSummary } from "@/lib/books";

export type CourseRow = {
  id: string;
  instructor_id: string;
  slug: string;
  title: string;
  description: string;
  cover_path: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type LessonRow = {
  id: string;
  module_id: string;
  title: string;
  position: number;
  content: string;
  book_id: string | null;
  video_url: string | null;
  diagram_source: string | null;
  created_at: string;
};

export type ModuleWithLessons = {
  id: string;
  course_id: string;
  title: string;
  position: number;
  lessons: LessonRow[];
};

export type CourseWithInstructor = CourseRow & {
  instructor?: ProfileSummary | null;
  lesson_count?: number;
};

export type CourseDetail = CourseRow & {
  instructor: ProfileSummary | null;
  modules: ModuleWithLessons[];
};

const COVER_BUCKET = "covers";

/** Public catalog: published courses, newest first. */
export async function listPublishedCourses(
  query?: string,
): Promise<CourseWithInstructor[]> {
  const supabase = await createClient();
  let q = supabase
    .from("courses")
    .select(
      "*, instructor:profiles!courses_instructor_id_fkey(id, handle, display_name, avatar_url)",
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  if (query && query.trim()) {
    const t = `%${query.trim()}%`;
    q = q.or(`title.ilike.${t},description.ilike.${t}`);
  }
  const { data, error } = await q;
  if (error || !data) return [];
  return data as CourseWithInstructor[];
}

/** Courses authored by a given instructor (their own, published or not). */
export async function listOwnCourses(
  userId: string,
): Promise<CourseWithInstructor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("instructor_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as CourseWithInstructor[];
}

/** Full course with ordered modules + lessons. RLS hides unpublished courses
 *  from everyone but their instructor. */
export async function getCourseBySlug(
  slug: string,
): Promise<CourseDetail | null> {
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select(
      "*, instructor:profiles!courses_instructor_id_fkey(id, handle, display_name, avatar_url)",
    )
    .ilike("slug", slug)
    .maybeSingle();
  if (!course) return null;

  const { data: modules } = await supabase
    .from("modules")
    .select("id, course_id, title, position")
    .eq("course_id", course.id)
    .order("position", { ascending: true });

  const moduleIds = (modules ?? []).map((m) => m.id);
  let lessons: LessonRow[] = [];
  if (moduleIds.length) {
    const { data: lessonRows } = await supabase
      .from("lessons")
      .select("*")
      .in("module_id", moduleIds)
      .order("position", { ascending: true });
    lessons = (lessonRows ?? []) as LessonRow[];
  }

  const withLessons: ModuleWithLessons[] = (modules ?? []).map((m) => ({
    ...m,
    lessons: lessons.filter((l) => l.module_id === m.id),
  }));

  const { instructor, ...rest } = course as CourseRow & {
    instructor: ProfileSummary | null;
  };
  return { ...rest, instructor: instructor ?? null, modules: withLessons };
}

export async function isEnrolled(
  userId: string,
  courseId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();
  return Boolean(data);
}

/** Set of lesson ids the user has completed in a course. */
export async function getCompletedLessonIds(
  userId: string,
  lessonIds: string[],
): Promise<Set<string>> {
  if (!lessonIds.length) return new Set();
  const supabase = await createClient();
  const { data } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", userId)
    .in("lesson_id", lessonIds);
  return new Set((data ?? []).map((r) => r.lesson_id));
}

export function courseCoverUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  coverPath: string | null,
): string | null {
  if (!coverPath) return null;
  const { data } = supabase.storage.from(COVER_BUCKET).getPublicUrl(coverPath);
  return data.publicUrl;
}
