import { redirect } from "next/navigation";
import { logoutAction } from "@/app/(app)/actions";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
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

  return (
    <AppShell userEmail={user.email ?? "utente"} userName={user.user_metadata.username} logoutAction={logoutAction}>
      {children}
    </AppShell>
  );
}
