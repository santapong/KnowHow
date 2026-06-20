import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { CourseEditor } from "@/components/CourseEditor";
import { getOwnCourseById } from "@/lib/courses";
import { listOwnBooks } from "@/lib/books";
import { getUserOrRedirect } from "@/lib/auth/getUser";

export const metadata = { title: "Edit course · KnowHow" };
export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function EditCoursePage({ params }: { params: Params }) {
  const { id } = await params;
  const user = await getUserOrRedirect(`/instructor/courses/${id}`);

  const course = await getOwnCourseById(id, user.id);
  if (!course) notFound();

  const books = (await listOwnBooks(user.id)).map((b) => ({
    id: b.id,
    title: b.title,
  }));

  return (
    <>
      <Nav active="courses" />
      <main className="px-6 pt-10 pb-20 md:px-10">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/instructor"
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-ink)]/45 hover:text-[color:var(--color-ink)]/80"
            >
              ← Your courses
            </Link>
            {course.is_published && (
              <Link
                href={`/courses/${course.slug}`}
                className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-gold)]/80 hover:text-[color:var(--color-gold)]"
              >
                View live →
              </Link>
            )}
          </div>
          <CourseEditor course={course} books={books} />
        </div>
      </main>
    </>
  );
}
