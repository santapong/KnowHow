import Link from "next/link";
import { Nav } from "@/components/Nav";
import { listOwnCourses } from "@/lib/courses";
import { getUserOrRedirect } from "@/lib/auth/getUser";

export const metadata = { title: "Teach · KnowHow" };
export const dynamic = "force-dynamic";

export default async function InstructorPage() {
  const user = await getUserOrRedirect("/instructor");
  const courses = await listOwnCourses(user.id);

  return (
    <>
      <Nav active="courses" />
      <main className="px-6 pt-10 pb-16 md:px-10">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-gold)]/80">
                Instructor
              </p>
              <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight md:text-5xl">
                Your courses.
              </h1>
            </div>
            <Link
              href="/instructor/courses/new"
              className="rounded-md bg-[color:var(--color-gold)] px-4 py-2.5 text-sm font-medium text-[color:var(--color-leather)] hover:opacity-90"
            >
              + New course
            </Link>
          </div>

          <ul className="mt-10 space-y-3">
            {courses.length === 0 && (
              <p className="text-[color:var(--color-ink)]/50">
                No courses yet. Build one from books on your shelf.
              </p>
            )}
            {courses.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/instructor/courses/${c.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-[color:var(--color-ink)]/12 bg-[color:var(--color-ink)]/[0.03] px-5 py-4 transition hover:border-[color:var(--color-gold)]/50"
                >
                  <span className="font-serif text-lg font-semibold tracking-tight">
                    {c.title}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] ${
                      c.is_published
                        ? "bg-[color:var(--color-gold)]/15 text-[color:var(--color-gold)]"
                        : "bg-[color:var(--color-ink)]/10 text-[color:var(--color-ink)]/50"
                    }`}
                  >
                    {c.is_published ? "Published" : "Draft"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}
