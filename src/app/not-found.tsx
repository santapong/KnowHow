import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Not found</h1>
      <p className="max-w-md text-sm text-[color:var(--color-ink)]/60">
        That book or page doesn&apos;t exist, or you don&apos;t have access.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-md bg-[color:var(--color-gold)] px-4 py-2 text-sm font-medium text-[color:var(--color-leather)]"
      >
        Back home
      </Link>
    </main>
  );
}
