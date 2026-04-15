"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ensureUserProfile,
  getPassionCatalog,
  isValidUsername,
  normalizeUsername,
  saveUserPassions,
} from "@/lib/auth";
import {
  blockUserById,
  ensurePrivacySettings,
  unblockUserById,
} from "@/lib/privacy";
import {
  actionErrorDetail,
  safePathFromForm,
  withQueryParam,
} from "@/lib/server-actions";
import { createServerSupabaseClient } from "@/lib/supabase";

type MessagingRule = "everyone" | "followers" | "nobody";

function isMessagingRule(value: string): value is MessagingRule {
  return value === "everyone" || value === "followers" || value === "nobody";
}

function redirectSettingsError(message: string): never {
  redirect(withQueryParam("/settings", "error", message));
}

function redirectSettingsSuccess(message: string): never {
  redirect(withQueryParam("/settings", "success", message));
}

function redirectProfileError(message: string): never {
  redirect(withQueryParam("/settings", "profileError", message));
}

function redirectProfileSuccess(message: string): never {
  redirect(withQueryParam("/settings", "profileSuccess", message));
}

function redirectPassionsError(message: string): never {
  redirect(withQueryParam("/settings", "passionsError", message));
}

function redirectPassionsSuccess(message: string): never {
  redirect(withQueryParam("/settings", "passionsSuccess", message));
}

function redirectPathWithBlockMessage(path: string, key: "blockError" | "blockSuccess", message: string): never {
  redirect(withQueryParam(path, key, message));
}

type ActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

async function getAuthenticatedContext() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await ensureUserProfile(supabase, user);
  await ensurePrivacySettings(supabase, user.id);

  return { supabase, user, profile };
}

export async function updateProfileDetailsAction(formData: FormData): Promise<never> {
  const usernameRaw = formData.get("username");
  const displayNameRaw = formData.get("displayName");
  const bioRaw = formData.get("bio");

  const normalizedUsername =
    typeof usernameRaw === "string" ? normalizeUsername(usernameRaw) : "";
  if (!isValidUsername(normalizedUsername)) {
    redirectProfileError(
      "Username non valido (3-24 caratteri: lettere minuscole, numeri, underscore o punto).",
    );
  }

  const trimmedDisplayName =
    typeof displayNameRaw === "string" ? displayNameRaw.trim() : "";
  const displayName = trimmedDisplayName.length > 0 ? trimmedDisplayName : normalizedUsername;
  if (displayName.length > 60) {
    redirectProfileError("Il nome visualizzato non puo superare 60 caratteri.");
  }

  const trimmedBio = typeof bioRaw === "string" ? bioRaw.trim() : "";
  if (trimmedBio.length > 280) {
    redirectProfileError("La bio non puo superare 280 caratteri.");
  }
  const bio = trimmedBio.length > 0 ? trimmedBio : null;

  const { supabase, user, profile } = await getAuthenticatedContext();
  let result: ActionResult;

  try {
    const { data: usernameConflictRows, error: usernameConflictError } = await supabase
      .from("users")
      .select("id")
      .eq("username", normalizedUsername)
      .neq("id", user.id)
      .limit(1);

    if (usernameConflictError) {
      throw usernameConflictError;
    }

    if ((usernameConflictRows ?? []).length > 0) {
      result = { ok: false, message: "Username gia in uso. Scegline uno diverso." };
    } else {
      const { error: updateProfileError } = await supabase
        .from("users")
        .update({
          username: normalizedUsername,
          display_name: displayName,
          bio,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateProfileError) {
        throw updateProfileError;
      }

      const { error: updateMetadataError } = await supabase.auth.updateUser({
        data: {
          username: normalizedUsername,
          display_name: displayName,
          bio,
        },
      });

      if (updateMetadataError) {
        console.error("[settings][updateProfileDetailsAction] metadata sync failed", {
          userId: user.id,
          detail: actionErrorDetail(updateMetadataError),
          rawError: updateMetadataError,
        });
      }

      revalidatePath("/settings");
      revalidatePath("/profile");
      revalidatePath("/feed");
      if (profile?.username) {
        revalidatePath(`/profile/${profile.username}`);
      }
      revalidatePath(`/profile/${normalizedUsername}`);
      result = { ok: true, message: "Profilo aggiornato con successo." };
    }
  } catch (error) {
    console.error("[settings][updateProfileDetailsAction] failed", {
      userId: user.id,
      detail: actionErrorDetail(error),
      rawError: error,
    });
    result = {
      ok: false,
      message: `Aggiornamento profilo non riuscito: ${actionErrorDetail(error).slice(0, 140)}`,
    };
  }

  if (result.ok) {
    redirectProfileSuccess(result.message);
  }

  redirectProfileError(result.message);
}

export async function updateProfilePassionsAction(formData: FormData): Promise<never> {
  const selectedSlugs = Array.from(
    new Set(
      formData
        .getAll("passionSlugs")
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );

  if (selectedSlugs.length === 0) {
    redirectPassionsError("Seleziona almeno una passione.");
  }

  const { supabase, user, profile } = await getAuthenticatedContext();
  let result: ActionResult;

  try {
    const { passions } = await getPassionCatalog(supabase);
    if (passions.length === 0) {
      result = {
        ok: false,
        message: "Catalogo passioni non disponibile. Aggiungi passioni nel database.",
      };
    } else {
      const allowedSlugs = new Set(passions.map((passion) => passion.slug));
      const invalidSlugs = selectedSlugs.filter((slug) => !allowedSlugs.has(slug));

      if (invalidSlugs.length > 0) {
        result = { ok: false, message: `Passioni non valide: ${invalidSlugs.join(", ")}` };
      } else {
        await saveUserPassions(supabase, user, selectedSlugs);

        revalidatePath("/settings");
        revalidatePath("/profile");
        revalidatePath("/feed");
        revalidatePath("/explore");
        if (profile?.username) {
          revalidatePath(`/profile/${profile.username}`);
        }
        result = { ok: true, message: "Passioni aggiornate." };
      }
    }
  } catch (error) {
    console.error("[settings][updateProfilePassionsAction] failed", {
      userId: user.id,
      detail: actionErrorDetail(error),
      rawError: error,
    });
    result = {
      ok: false,
      message: `Aggiornamento passioni non riuscito: ${actionErrorDetail(error).slice(0, 140)}`,
    };
  }

  if (result.ok) {
    redirectPassionsSuccess(result.message);
  }

  redirectPassionsError(result.message);
}

export async function updatePrivacySettingsAction(formData: FormData): Promise<never> {
  const whoCanMessageRaw = formData.get("whoCanMessage");
  const isProfilePrivate = formData.get("isProfilePrivate") === "on";
  const showOnlineStatus = formData.get("showOnlineStatus") === "on";

  if (typeof whoCanMessageRaw !== "string" || !isMessagingRule(whoCanMessageRaw)) {
    redirectSettingsError("Preferenza messaggi non valida.");
  }

  const { supabase, user } = await getAuthenticatedContext();
  let result: ActionResult;

  try {
    const { error } = await supabase
      .from("privacy_settings")
      .upsert(
        {
          user_id: user.id,
          is_profile_private: isProfilePrivate,
          who_can_message: whoCanMessageRaw,
          show_online_status: showOnlineStatus,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (error) {
      throw error;
    }

    revalidatePath("/settings");
    revalidatePath("/messages");
    result = { ok: true, message: "Impostazioni privacy aggiornate." };
  } catch (error) {
    console.error("[settings][updatePrivacySettingsAction] failed", {
      detail: actionErrorDetail(error),
      rawError: error,
    });
    result = {
      ok: false,
      message: `Aggiornamento non riuscito: ${actionErrorDetail(error).slice(0, 140)}`,
    };
  }

  if (result.ok) {
    redirectSettingsSuccess(result.message);
  }

  redirectSettingsError(result.message);
}

export async function blockUserAction(formData: FormData): Promise<never> {
  const targetUserId = formData.get("targetUserId");
  const targetUsername = formData.get("targetUsername");
  const returnPath = safePathFromForm(formData.get("returnPath"), "/settings");
  const { supabase, user } = await getAuthenticatedContext();
  let result: ActionResult;

  try {
    let resolvedTargetId: string | null = null;
    if (typeof targetUserId === "string" && targetUserId.length > 0) {
      resolvedTargetId = targetUserId;
    } else if (typeof targetUsername === "string" && targetUsername.trim().length > 0) {
      const normalizedUsername = normalizeUsername(targetUsername);
      const { data: targetUserRow, error: targetUserError } = await supabase
        .from("users")
        .select("id")
        .eq("username", normalizedUsername)
        .maybeSingle();

      if (targetUserError) {
        throw targetUserError;
      }

      resolvedTargetId = targetUserRow?.id ?? null;
    }

    if (!resolvedTargetId) {
      result = { ok: false, message: "Utente da bloccare non trovato." };
    } else {
      await blockUserById(supabase, user.id, resolvedTargetId);

      revalidatePath("/settings");
      revalidatePath("/messages");
      revalidatePath("/profile");
      result = { ok: true, message: "Utente bloccato." };
    }
  } catch (error) {
    console.error("[settings][blockUserAction] failed", {
      detail: actionErrorDetail(error),
      rawError: error,
    });
    result = {
      ok: false,
      message: `Blocco non riuscito: ${actionErrorDetail(error).slice(0, 140)}`,
    };
  }

  if (result.ok) {
    redirect("/feed");
  }

  redirectPathWithBlockMessage(returnPath, "blockError", result.message);
}

export async function unblockUserAction(formData: FormData): Promise<never> {
  const targetUserId = formData.get("targetUserId");
  const returnPath = safePathFromForm(formData.get("returnPath"), "/settings");

  if (typeof targetUserId !== "string" || targetUserId.length === 0) {
    redirectPathWithBlockMessage(returnPath, "blockError", "Utente non valido.");
  }

  const { supabase, user } = await getAuthenticatedContext();
  let result: ActionResult;

  try {
    await unblockUserById(supabase, user.id, targetUserId);

    revalidatePath("/settings");
    revalidatePath("/messages");
    revalidatePath("/profile");
    result = { ok: true, message: "Utente sbloccato." };
  } catch (error) {
    console.error("[settings][unblockUserAction] failed", {
      detail: actionErrorDetail(error),
      rawError: error,
    });
    result = {
      ok: false,
      message: `Sblocco non riuscito: ${actionErrorDetail(error).slice(0, 140)}`,
    };
  }

  if (result.ok) {
    redirectPathWithBlockMessage(returnPath, "blockSuccess", result.message);
  }

  redirectPathWithBlockMessage(returnPath, "blockError", result.message);
}
