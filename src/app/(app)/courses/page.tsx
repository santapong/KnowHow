import Link from "next/link";
import { Nav } from "@/components/Nav";
import { listPublishedCourses } from "@/lib/courses";
import { supabaseConfigured } from "@/lib/env";

export const metadata = { title: "Courses · KnowHow" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string }>;

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q } = await searchParams;
  const query = q?.trim() || undefined;

  const courses = supabaseConfigured ? await listPublishedCourses(query) : [];

  return (
    <>
      <Nav active="courses" />
      <main className="px-6 pt-10 pb-12 md:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-gold)]/80">
            {courses.length.toLocaleString()} published courses
          </p>
          <h1 className="mt-3 font-serif text-5xl font-semibold leading-[0.95] tracking-tight md:text-6xl">
            Learn it like a course.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[color:var(--color-ink)]/65">
            Structured paths built on the same library. Each lesson opens a book
            in the reader — read, practice, and track your progress.
          </p>
          <Link
            href="/instructor"
            className="mt-6 inline-block font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-gold)]/80 hover:text-[color:var(--color-gold)]"
          >
            Teach a course →
          </Link>
        </div>
      </main>

      <section className="border-t border-[color:var(--color-ink)]/10 bg-gradient-to-b from-[#1a140d] to-[#100c08]">
        <div className="mx-auto max-w-6xl px-6 py-10 md:px-10">
          {courses.length === 0 ? (
            <p className="py-16 text-center text-[color:var(--color-ink)]/50">
              No published courses yet.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/courses/${c.slug}`}
                    className="block h-full rounded-xl border border-[color:var(--color-ink)]/12 bg-[color:var(--color-ink)]/[0.03] p-5 transition hover:border-[color:var(--color-gold)]/50 hover:bg-[color:var(--color-ink)]/[0.06]"
                  >
                    <h2 className="font-serif text-xl font-semibold leading-snug tracking-tight">
                      {c.title}
                    </h2>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[color:var(--color-ink)]/60">
                      {c.description || "No description yet."}
                    </p>
                    {c.instructor?.display_name && (
                      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-ink)]/40">
                        by {c.instructor.display_name}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
