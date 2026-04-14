"use server";

import { redirect } from "next/navigation";
import {
  ensureUserProfile,
  getAuthenticatedRedirectPath,
  getUserPassionStatus,
  isValidUsername,
  normalizeUsername,
} from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

function buildErrorRedirect(pathname: "/login" | "/register", message: string): never {
  const params = new URLSearchParams({ error: message });
  redirect(`${pathname}?${params.toString()}`);
}

export async function loginAction(formData: FormData): Promise<never> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    buildErrorRedirect("/login", "Inserisci email e password valide.");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    buildErrorRedirect("/login", "Accesso non riuscito. Controlla le credenziali.");
  }

  if (data.user) {
    try {
      await ensureUserProfile(supabase, data.user);
    } catch {
      // Se il profilo pubblico non e sincronizzabile ora, non blocchiamo il login.
    }
  }

  const { hasPassions } = await getUserPassionStatus(supabase, data.user);
  redirect(getAuthenticatedRedirectPath(hasPassions));
}

export async function registerAction(formData: FormData): Promise<never> {
  const username = formData.get("username");
  const email = formData.get("email");
  const password = formData.get("password");

  const normalizedUsername =
    typeof username === "string" ? normalizeUsername(username) : "";

  if (
    !isValidUsername(normalizedUsername) ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email ||
    password.length < 6
  ) {
    buildErrorRedirect(
      "/register",
      "Username non valido (3-24 caratteri: lettere, numeri, underscore o punto).",
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: normalizedUsername,
        display_name: normalizedUsername,
      },
    },
  });

  if (error) {
    buildErrorRedirect("/register", "Registrazione non riuscita. Riprova tra poco.");
  }

  if (!data.session) {
    const params = new URLSearchParams({
      success: "Account creato. Controlla l'email di conferma e poi accedi.",
    });
    redirect(`/login?${params.toString()}`);
  }

  if (data.user) {
    try {
      await ensureUserProfile(supabase, data.user);
    } catch {
      // La sync profilo non deve bloccare la registrazione con sessione attiva.
    }
  }

  const { hasPassions } = await getUserPassionStatus(supabase, data.user);
  redirect(getAuthenticatedRedirectPath(hasPassions));
}
