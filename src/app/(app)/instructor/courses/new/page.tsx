import Link from "next/link";
import { Nav } from "@/components/Nav";
import { NewCourseForm } from "@/components/NewCourseForm";
import { getUserOrRedirect } from "@/lib/auth/getUser";

export const metadata = { title: "New course · KnowHow" };
export const dynamic = "force-dynamic";

export default async function NewCoursePage() {
  await getUserOrRedirect("/instructor/courses/new");

  return (
    <>
      <Nav active="courses" />
      <main className="px-6 pt-10 pb-16 md:px-10">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/instructor"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-ink)]/45 hover:text-[color:var(--color-ink)]/80"
          >
            ← Your courses
          </Link>
          <h1 className="mt-5 font-serif text-4xl font-semibold tracking-tight md:text-5xl">
            New course.
          </h1>
          <NewCourseForm />
        </div>
      </main>
    </>
  );
}
