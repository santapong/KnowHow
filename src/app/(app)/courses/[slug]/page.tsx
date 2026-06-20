import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { EnrollButton } from "@/components/EnrollButton";
import {
  getCourseBySlug,
  isEnrolled,
  getCompletedLessonIds,
} from "@/lib/courses";
import { LessonCompleteToggle } from "@/components/LessonCompleteToggle";
import { getOptionalUser } from "@/lib/auth/getUser";
import { supabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const course = supabaseConfigured ? await getCourseBySlug(slug) : null;
  return { title: course ? `${course.title} · KnowHow` : "Course · KnowHow" };
}

export default async function CoursePage({ params }: { params: Params }) {
  const { slug } = await params;
  if (!supabaseConfigured) notFound();

  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const user = await getOptionalUser();
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const lessonCount = allLessons.length;

  const enrolled = user ? await isEnrolled(user.id, course.id) : false;
  const completed = user
    ? await getCompletedLessonIds(
        user.id,
        allLessons.map((l) => l.id),
      )
    : new Set<string>();
  const completedCount = completed.size;
  const pct =
    lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0;

  return (
    <>
      <Nav active="courses" />
      <main className="px-6 pt-10 pb-16 md:px-10">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/courses"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-ink)]/45 hover:text-[color:var(--color-ink)]/80"
          >
            ← All courses
          </Link>

          <h1 className="mt-5 font-serif text-4xl font-semibold leading-[1.0] tracking-tight md:text-5xl">
            {course.title}
          </h1>
          {course.instructor?.display_name && (
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-ink)]/45">
              by {course.instructor.display_name} ·{" "}
              {lessonCount.toLocaleString()} lessons
            </p>
          )}
          {course.description && (
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[color:var(--color-ink)]/70">
              {course.description}
            </p>
          )}

          <div className="mt-7">
            {!user ? (
              <Link
                href={`/login?next=/courses/${course.slug}`}
                className="inline-block rounded-md bg-[color:var(--color-gold)] px-5 py-2.5 text-sm font-medium text-[color:var(--color-leather)] hover:opacity-90"
              >
                Sign in to enroll →
              </Link>
            ) : enrolled ? (
              <div className="flex items-center gap-4">
                <span className="rounded-full border border-[color:var(--color-gold)]/50 bg-[color:var(--color-gold)]/10 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-[color:var(--color-gold)]">
                  Enrolled
                </span>
                <span className="text-sm text-[color:var(--color-ink)]/55">
                  {completedCount} / {lessonCount} complete ({pct}%)
                </span>
              </div>
            ) : (
              <EnrollButton courseId={course.id} />
            )}
          </div>

          {/* Module / lesson outline */}
          <div className="mt-12 space-y-8">
            {course.modules.length === 0 && (
              <p className="text-[color:var(--color-ink)]/50">
                This course has no lessons yet.
              </p>
            )}
            {course.modules.map((m, mi) => (
              <section key={m.id}>
                <h2 className="font-serif text-lg font-semibold tracking-tight text-[color:var(--color-ink)]/90">
                  <span className="text-[color:var(--color-ink)]/40">
                    {String(mi + 1).padStart(2, "0")}
                  </span>{" "}
                  {m.title}
                </h2>
                <ul className="mt-3 divide-y divide-[color:var(--color-ink)]/8 border-y border-[color:var(--color-ink)]/8">
                  {m.lessons.map((l) => {
                    const isDone = completed.has(l.id);
                    const readable = enrolled && l.book_id;
                    return (
                      <li
                        key={l.id}
                        className="flex items-center gap-3 py-3"
                      >
                        {enrolled ? (
                          <LessonCompleteToggle
                            lessonId={l.id}
                            initialDone={isDone}
                          />
                        ) : (
                          <span
                            aria-hidden
                            className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-[color:var(--color-ink)]/25 text-[10px] text-transparent"
                          >
                            ✓
                          </span>
                        )}
                        {readable ? (
                          <Link
                            href={`/shelf/${l.book_id}`}
                            className="flex flex-1 items-center gap-3 transition hover:text-[color:var(--color-gold)]"
                          >
                            <span className="flex-1 text-[15px] text-[color:var(--color-ink)]/80">
                              {l.title}
                            </span>
                            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-ink)]/40">
                              Read →
                            </span>
                          </Link>
                        ) : (
                          <>
                            <span className="flex-1 text-[15px] text-[color:var(--color-ink)]/80">
                              {l.title}
                            </span>
                            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-ink)]/30">
                              {l.book_id ? "Enroll to read" : "No content"}
                            </span>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
