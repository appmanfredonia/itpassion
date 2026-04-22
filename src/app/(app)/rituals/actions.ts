"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureUserProfile } from "@/lib/auth";
import { getItalianCityValidationError, resolveItalianLocation } from "@/lib/location";
import { getViewerLocalTribes } from "@/lib/rituals";
import { createServerSupabaseClient } from "@/lib/supabase";

function redirectCreateError(message: string): never {
  const params = new URLSearchParams({ error: message });
  redirect(`/rituals/create?${params.toString()}`);
}

function normalizeTextField(value: FormDataEntryValue | null, maxLength: number): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

export async function createRitualAction(formData: FormData): Promise<never> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  try {
    await ensureUserProfile(supabase, user);
  } catch {
    redirectCreateError("Profilo utente non sincronizzato. Ricarica e riprova.");
  }

  const title = normalizeTextField(formData.get("title"), 120);
  const tribeId = normalizeTextField(formData.get("tribeId"), 80);
  const city = normalizeTextField(formData.get("city"), 80);
  const place = normalizeTextField(formData.get("place"), 120);
  const description = normalizeTextField(formData.get("description"), 600);
  const scheduledForIso = normalizeTextField(formData.get("scheduledForIso"), 80);
  const maxParticipantsRaw = normalizeTextField(formData.get("maxParticipants"), 4);

  if (!title || !tribeId || !city || !place || !scheduledForIso) {
    redirectCreateError("Compila i campi obbligatori prima di creare il rituale.");
  }

  if (title.length < 3) {
    redirectCreateError("Il titolo deve contenere almeno 3 caratteri.");
  }

  const scheduledFor = new Date(scheduledForIso);
  if (Number.isNaN(scheduledFor.getTime())) {
    redirectCreateError("Data e ora del rituale non valide.");
  }

  if (scheduledFor.getTime() < Date.now() - 60_000) {
    redirectCreateError("Scegli una data futura per il rituale.");
  }

  let maxParticipants: number | null = null;
  if (maxParticipantsRaw) {
    const parsedMaxParticipants = Number.parseInt(maxParticipantsRaw, 10);
    if (!Number.isFinite(parsedMaxParticipants) || parsedMaxParticipants < 2 || parsedMaxParticipants > 500) {
      redirectCreateError("I partecipanti massimi devono essere compresi tra 2 e 500.");
    }

    maxParticipants = parsedMaxParticipants;
  }

  const { tribes, warning } = await getViewerLocalTribes(supabase, user.id);
  if (warning && tribes.length === 0) {
    redirectCreateError("Le tribu locali non sono ancora disponibili in questo ambiente.");
  }

  const selectedTribe = tribes.find((tribe) => tribe.id === tribeId);
  if (!selectedTribe) {
    redirectCreateError("Puoi creare rituali solo dentro una delle tue tribu locali.");
  }

  const resolvedLocation = resolveItalianLocation({
    city,
    province: selectedTribe.province,
  });
  const cityError = getItalianCityValidationError(resolvedLocation);
  if (cityError) {
    redirectCreateError(cityError);
  }

  const { data: insertedRitual, error: createError } = await supabase
    .from("tribe_rituals")
    .insert({
      tribe_id: selectedTribe.id,
      creator_id: user.id,
      title,
      description: description.length > 0 ? description : null,
      city: resolvedLocation.location.city ?? city,
      place,
      scheduled_for: scheduledFor.toISOString(),
      max_participants: maxParticipants,
    })
    .select("id")
    .single();

  if (createError || !insertedRitual) {
    redirectCreateError("Creazione rituale non riuscita. Verifica schema e policy RLS.");
  }

  const participantInsertResult = await supabase
    .from("tribe_ritual_participants")
    .insert({
      ritual_id: insertedRitual.id,
      user_id: user.id,
    });

  if (participantInsertResult.error && participantInsertResult.error.code !== "42P01") {
    console.error("[rituals] creator participation insert failed", participantInsertResult.error);
  }

  revalidatePath("/feed");
  revalidatePath("/map");
  revalidatePath("/profile");
  revalidatePath(`/rituals/${insertedRitual.id}`);

  redirect(`/rituals/${insertedRitual.id}`);
}
