import { Nav } from "@/components/Nav";
import { UploadDropzone } from "@/components/UploadDropzone";
import { getUserOrRedirect } from "@/lib/auth/getUser";

export const metadata = { title: "Upload · KnowHow" };

export default async function UploadPage() {
  await getUserOrRedirect("/upload");

  return (
    <>
      <Nav active="upload" />
      <main className="px-6 pt-8 pb-16 md:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-gold)]/80">
            new book
          </p>
          <h1 className="mt-3 font-serif text-5xl font-semibold leading-[0.95] tracking-tight md:text-6xl">
            File &nbsp;→&nbsp; Cover &nbsp;→&nbsp; Shelf.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[color:var(--color-ink)]/65">
            Drop a PDF. We parse it in your browser, extract a cover, and
            shelve it. Nothing leaves your machine until you press
            &ldquo;Add to my shelf.&rdquo;
          </p>

          <div className="mt-12">
            <UploadDropzone />
          </div>
        </div>
      </main>
    </>
  );
}
