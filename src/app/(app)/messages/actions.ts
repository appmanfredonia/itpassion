"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureUserProfile } from "@/lib/auth";
import {
  getConversationMessages,
  getOrCreateDirectConversation,
} from "@/lib/messages";
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

function redirectWithConversationError(
  conversationId: string | null,
  message: string,
): never {
  const path = conversationId ? `/messages?c=${conversationId}` : "/messages";
  redirect(withQueryParam(path, "error", message));
}

function redirectWithStartError(returnPath: string, message: string): never {
  redirect(withQueryParam(returnPath, "messageError", message));
}

type StartConversationResult =
  | { ok: true; conversationId: string }
  | { ok: false; message: string };

type SendMessageResult =
  | { ok: true; conversationId: string }
  | { ok: false; message: string };

type BlockToggleResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

function redirectWithConversationBlockStatus(
  conversationId: string,
  key: "blockError" | "blockSuccess",
  message: string,
): never {
  redirect(withQueryParam(`/messages?c=${conversationId}`, key, message));
}

export async function startConversationAction(formData: FormData): Promise<never> {
  const targetUserId = formData.get("targetUserId");
  const returnPath = safePathFromForm(formData.get("returnPath"), "/messages");

  if (typeof targetUserId !== "string" || targetUserId.length === 0) {
    redirectWithStartError(returnPath, "Utente destinatario non valido.");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let result: StartConversationResult;

  try {
    await ensureUserProfile(supabase, user);
    await ensurePrivacySettings(supabase, user.id);

    const { data: targetProfileRow, error: targetProfileError } = await supabase
      .from("users")
      .select("id")
      .eq("id", targetUserId)
      .maybeSingle();

    if (targetProfileError) {
      throw targetProfileError;
    }
    if (!targetProfileRow) {
      result = { ok: false, message: "Profilo destinatario non trovato." };
    } else {
      const conversationResult = await getOrCreateDirectConversation(
        supabase,
        user.id,
        targetProfileRow.id,
      );

      if (!conversationResult.conversationId) {
        result = {
          ok: false,
          message: conversationResult.reason ?? "Conversazione non disponibile.",
        };
      } else {
        result = { ok: true, conversationId: conversationResult.conversationId };
      }
    }
  } catch (error) {
    console.error("[messages][startConversationAction] failed", {
      userId: user.id,
      targetUserId,
      detail: actionErrorDetail(error),
      rawError: error,
    });
    result = {
      ok: false,
      message: `Avvio conversazione fallito: ${actionErrorDetail(error).slice(0, 140)}`,
    };
  }

  if (result.ok) {
    revalidatePath("/messages");
    redirect(`/messages?c=${result.conversationId}`);
  }

  redirectWithStartError(returnPath, result.message);
}

export async function sendMessageAction(formData: FormData): Promise<never> {
  const conversationId = formData.get("conversationId");
  const contentRaw = formData.get("content");

  if (typeof conversationId !== "string" || conversationId.length === 0) {
    redirectWithConversationError(null, "Conversazione non valida.");
  }

  if (typeof contentRaw !== "string") {
    redirectWithConversationError(conversationId, "Messaggio non valido.");
  }

  const content = contentRaw.trim();
  if (content.length === 0) {
    redirectWithConversationError(conversationId, "Scrivi un messaggio prima di inviare.");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let result: SendMessageResult;

  try {
    await ensureUserProfile(supabase, user);
    await ensurePrivacySettings(supabase, user.id);

    const conversationData = await getConversationMessages(
      supabase,
      user.id,
      conversationId,
    );
    if (!conversationData) {
      result = {
        ok: false,
        message: "Non puoi inviare messaggi in questa conversazione.",
      };
    } else if (!conversationData.canSendMessages) {
      result = {
        ok: false,
        message:
          conversationData.sendBlockedReason ??
          "Non puoi piu inviare messaggi in questa conversazione.",
      };
    } else {
      const recipient = conversationData.participants.find(
        (participant) => participant.userId !== user.id,
      );
      if (!recipient) {
        result = { ok: false, message: "Destinatario non disponibile." };
      } else {
        const { error: insertMessageError } = await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
        });

        if (insertMessageError) {
          throw insertMessageError;
        }

        result = { ok: true, conversationId };
      }
    }
  } catch (error) {
    console.error("[messages][sendMessageAction] failed", {
      userId: user.id,
      conversationId,
      detail: actionErrorDetail(error),
      rawError: error,
    });
    result = {
      ok: false,
      message: `Invio fallito: ${actionErrorDetail(error).slice(0, 140)}`,
    };
  }

  if (result.ok) {
    revalidatePath("/messages");
    redirect(`/messages?c=${result.conversationId}`);
  }

  redirectWithConversationError(conversationId, result.message);
}

export async function blockUserFromMessagesAction(formData: FormData): Promise<never> {
  const targetUserId = formData.get("targetUserId");
  const conversationId = formData.get("conversationId");

  if (typeof conversationId !== "string" || conversationId.length === 0) {
    redirectWithConversationError(null, "Conversazione non valida.");
  }
  if (typeof targetUserId !== "string" || targetUserId.length === 0) {
    redirectWithConversationBlockStatus(
      conversationId,
      "blockError",
      "Utente non valido.",
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let result: BlockToggleResult;

  try {
    await ensureUserProfile(supabase, user);
    await ensurePrivacySettings(supabase, user.id);

    await blockUserById(supabase, user.id, targetUserId);

    revalidatePath("/messages");
    revalidatePath("/search");
    result = { ok: true, message: "Utente bloccato." };
  } catch (error) {
    console.error("[messages][blockUserFromMessagesAction] failed", {
      userId: user.id,
      targetUserId,
      conversationId,
      detail: actionErrorDetail(error),
      rawError: error,
    });
    result = {
      ok: false,
      message: `Blocco non riuscito: ${actionErrorDetail(error).slice(0, 140)}`,
    };
  }

  if (result.ok) {
    redirectWithConversationBlockStatus(conversationId, "blockSuccess", result.message);
  }

  redirectWithConversationBlockStatus(conversationId, "blockError", result.message);
}

export async function unblockUserFromMessagesAction(formData: FormData): Promise<never> {
  const targetUserId = formData.get("targetUserId");
  const conversationId = formData.get("conversationId");

  if (typeof conversationId !== "string" || conversationId.length === 0) {
    redirectWithConversationError(null, "Conversazione non valida.");
  }
  if (typeof targetUserId !== "string" || targetUserId.length === 0) {
    redirectWithConversationBlockStatus(
      conversationId,
      "blockError",
      "Utente non valido.",
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let result: BlockToggleResult;

  try {
    await ensureUserProfile(supabase, user);
    await ensurePrivacySettings(supabase, user.id);

    await unblockUserById(supabase, user.id, targetUserId);

    revalidatePath("/messages");
    revalidatePath("/search");
    result = { ok: true, message: "Utente sbloccato." };
  } catch (error) {
    console.error("[messages][unblockUserFromMessagesAction] failed", {
      userId: user.id,
      targetUserId,
      conversationId,
      detail: actionErrorDetail(error),
      rawError: error,
    });
    result = {
      ok: false,
      message: `Sblocco non riuscito: ${actionErrorDetail(error).slice(0, 140)}`,
    };
  }

  if (result.ok) {
    redirectWithConversationBlockStatus(conversationId, "blockSuccess", result.message);
  }

  redirectWithConversationBlockStatus(conversationId, "blockError", result.message);
}
