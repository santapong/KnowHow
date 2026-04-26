import { Nav } from "@/components/Nav";
import { UploadDropzone } from "@/components/UploadDropzone";
import { getUserOrRedirect } from "@/lib/auth/getUser";

export const metadata = { title: "Upload · KnowHow" };

export default async function UploadPage() {
  await getUserOrRedirect("/upload");

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight">
          Add a book
        </h1>
        <p className="mb-8 text-sm text-[color:var(--color-ink)]/60">
          Drop a PDF and we&apos;ll extract its title and a cover for your shelf.
        </p>

        <UploadDropzone />
      </main>
    </>
  );
}
