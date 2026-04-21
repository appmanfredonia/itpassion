"use server";

import { redirect } from "next/navigation";
import {
  ensureUserProfile,
  getPassionCatalog,
  getPassionSelectionValidationError,
  normalizeSelectedPassionSlugs,
  saveUserPassions,
} from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

function redirectOnboardingError(message: string): never {
  const params = new URLSearchParams({ error: message });
  redirect(`/onboarding?${params.toString()}`);
}

function errorDetailFromUnknown(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const maybeCode = "code" in error ? String(error.code) : null;
    const maybeMessage = "message" in error ? String(error.message) : null;
    const maybeDetails = "details" in error ? String(error.details) : null;
    const maybeHint = "hint" in error ? String(error.hint) : null;

    return [maybeCode, maybeMessage, maybeDetails, maybeHint]
      .filter((value): value is string => Boolean(value))
      .join(" | ");
  }

  return "Errore sconosciuto";
}

function toUserSafeErrorMessage(error: unknown): string {
  const detail = errorDetailFromUnknown(error).slice(0, 180);
  if (!detail) {
    return "Salvataggio non riuscito. Riprova.";
  }

  return `Salvataggio non riuscito. Dettaglio: ${detail}`;
}

export async function saveOnboardingPassionsAction(formData: FormData): Promise<never> {
  const selectedSlugs = normalizeSelectedPassionSlugs(
    formData
      .getAll("passionSlugs")
      .filter((value): value is string => typeof value === "string"),
  );
  const selectionError = getPassionSelectionValidationError(selectedSlugs);

  if (selectionError) {
    redirectOnboardingError(selectionError);
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  try {
    const ensuredProfile = await ensureUserProfile(supabase, user);
    if (!ensuredProfile) {
      throw new Error("Impossibile verificare il profilo pubblico utente (public.users).");
    }
  } catch (error) {
    console.error("[onboarding] ensureUserProfile failed", {
      userId: user.id,
      detail: errorDetailFromUnknown(error),
      rawError: error,
    });
    redirectOnboardingError(
      `Profilo utente non pronto. Dettaglio: ${errorDetailFromUnknown(error).slice(0, 160)}`,
    );
  }

  let passions: Awaited<ReturnType<typeof getPassionCatalog>>["passions"] = [];
  try {
    ({ passions } = await getPassionCatalog(supabase));
  } catch (error) {
    console.error("[onboarding] load passions catalog failed", {
      userId: user.id,
      detail: errorDetailFromUnknown(error),
      rawError: error,
    });
    redirectOnboardingError("Catalogo passioni non disponibile. Riprova tra poco.");
  }

  if (passions.length === 0) {
    redirectOnboardingError(
      "Nessuna passione disponibile nel database. Contatta il supporto o riprova piu tardi.",
    );
  }

  const allowedSlugs = new Set(passions.map((passion) => passion.slug));
  const validSelection = selectedSlugs.filter((slug) => allowedSlugs.has(slug));

  if (validSelection.length !== selectedSlugs.length) {
    const invalidSlugs = selectedSlugs.filter((slug) => !allowedSlugs.has(slug));
    redirectOnboardingError(`Passioni non valide: ${invalidSlugs.join(", ")}`);
  }

  const { data: existingPassions, error: existingPassionsError } = await supabase
    .from("passions")
    .select("slug")
    .in("slug", validSelection);

  if (existingPassionsError) {
    console.error("[onboarding] verify passions failed", {
      userId: user.id,
      code: existingPassionsError.code,
      message: existingPassionsError.message,
      details: existingPassionsError.details,
      hint: existingPassionsError.hint,
    });
    redirectOnboardingError(`Verifica passioni fallita: ${existingPassionsError.message}`);
  }

  const existingSet = new Set((existingPassions ?? []).map((row) => row.slug));
  const missingInDatabase = validSelection.filter((slug) => !existingSet.has(slug));
  if (missingInDatabase.length > 0) {
    redirectOnboardingError(
      `Le passioni selezionate non esistono nel database: ${missingInDatabase.join(", ")}`,
    );
  }

  try {
    await saveUserPassions(supabase, user, validSelection);
  } catch (error) {
    console.error("[onboarding] saveUserPassions failed", {
      userId: user.id,
      detail: errorDetailFromUnknown(error),
      rawError: error,
    });
    redirectOnboardingError(toUserSafeErrorMessage(error));
  }

  redirect("/feed");
}
