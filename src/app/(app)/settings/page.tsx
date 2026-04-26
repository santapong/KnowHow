import { Nav } from "@/components/Nav";
import { SettingsForm } from "@/components/SettingsForm";
import { createClient } from "@/lib/supabase/server";
import { getUserOrRedirect } from "@/lib/auth/getUser";

export const metadata = { title: "Settings · KnowHow" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getUserOrRedirect("/settings");
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mb-8 text-sm text-[color:var(--color-ink)]/60">
          {user.email}
        </p>

        <SettingsForm initialDisplayName={profile?.display_name ?? ""} />
      </main>
    </>
  );
}
