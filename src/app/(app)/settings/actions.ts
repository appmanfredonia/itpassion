"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureUserProfile, normalizeUsername } from "@/lib/auth";
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

  await ensureUserProfile(supabase, user);
  await ensurePrivacySettings(supabase, user.id);

  return { supabase, user };
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
