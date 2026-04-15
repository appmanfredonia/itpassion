import { redirect } from "next/navigation";
import { logoutAction } from "@/app/(app)/actions";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ensureUserProfile } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

type AuthenticatedLayoutProps = {
  children: ReactNode;
};

export default async function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let profileUsername = typeof user.user_metadata.username === "string"
    ? user.user_metadata.username
    : undefined;

  try {
    const profile = await ensureUserProfile(supabase, user);
    if (profile?.username) {
      profileUsername = profile.username;
    }
  } catch {
    // Non blocchiamo il layout se la sync profilo fallisce.
  }

  return (
    <AppShell userEmail={user.email ?? "utente"} userName={profileUsername} logoutAction={logoutAction}>
      {children}
    </AppShell>
  );
}
