import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircleMore, Plus, ShieldAlert } from "lucide-react";
import {
  blockUserFromMessagesAction,
  sendMessageAction,
  unblockUserFromMessagesAction,
} from "@/app/(app)/messages/actions";
import { SectionHeader } from "@/components/section-header";
import { StateCard } from "@/components/state-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ensureUserProfile,
  getProfileByUsername,
  normalizeUsername,
} from "@/lib/auth";
import {
  getConversationList,
  getConversationMessages,
  getOrCreateDirectConversation,
  type ConversationListItem,
} from "@/lib/messages";
import { ensurePrivacySettings } from "@/lib/privacy";
import { createServerSupabaseClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type MessagesPageProps = {
  searchParams: Promise<{
    c?: string;
    user?: string;
    error?: string;
    messageError?: string;
    blockError?: string;
    blockSuccess?: string;
  }>;
};

function messagesPath(conversationId: string | null): string {
  return conversationId ? `/messages?c=${conversationId}` : "/messages";
}

function formatCreatedAt(isoDate: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(isoDate));
}

function avatarFallback(username: string): string {
  const normalized = username.trim();
  if (normalized.length === 0) {
    return "IT";
  }
  return normalized.slice(0, 2).toUpperCase();
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const params = await searchParams;
  const requestedConversationId = typeof params.c === "string" ? params.c : null;
  const requestedUsername = typeof params.user === "string" ? params.user : null;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let hasError = false;
  let bootstrapError: string | null = null;
  let conversations: ConversationListItem[] = [];
  let selectedConversationId: string | null = requestedConversationId;
  let selectedConversation: Awaited<ReturnType<typeof getConversationMessages>> = null;

  try {
    await ensureUserProfile(supabase, user);
    await ensurePrivacySettings(supabase, user.id);

    if (requestedUsername) {
      const normalizedUsername = normalizeUsername(requestedUsername);
      if (normalizedUsername.length < 3) {
        bootstrapError = "Username destinatario non valido.";
      } else {
        const targetProfile = await getProfileByUsername(supabase, normalizedUsername);
        if (!targetProfile) {
          bootstrapError = "Profilo destinatario non trovato.";
        } else if (targetProfile.id === user.id) {
          bootstrapError = "Non puoi avviare una chat con te stesso.";
        } else {
          const result = await getOrCreateDirectConversation(
            supabase,
            user.id,
            targetProfile.id,
          );
          if (!result.conversationId) {
            bootstrapError = result.reason ?? "Conversazione non disponibile.";
          } else if (requestedConversationId !== result.conversationId) {
            redirect(`/messages?c=${result.conversationId}`);
          }
        }
      }
    }

    conversations = await getConversationList(supabase, user.id);

    if (selectedConversationId) {
      const existsInList = conversations.some(
        (conversation) => conversation.conversationId === selectedConversationId,
      );
      if (!existsInList) {
        bootstrapError = "Conversazione non trovata o non accessibile.";
        selectedConversationId = null;
      }
    }

    if (!selectedConversationId && conversations.length > 0) {
      selectedConversationId = conversations[0].conversationId;
    }

    if (selectedConversationId) {
      selectedConversation = await getConversationMessages(
        supabase,
        user.id,
        selectedConversationId,
      );
      if (!selectedConversation) {
        bootstrapError = "Conversazione non trovata o non accessibile.";
        selectedConversationId = null;
      }
    }
  } catch {
    hasError = true;
  }

  if (hasError) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <h1 className="text-2xl font-semibold md:text-3xl">Messaggi</h1>
        <StateCard
          variant="error"
          title="Errore caricamento messaggi"
          description="Conversazioni o messaggi non disponibili in questo momento."
        />
      </section>
    );
  }

  const selectedConversationItem = selectedConversationId
    ? conversations.find((conversation) => conversation.conversationId === selectedConversationId) ?? null
    : null;
  const isConversationSelected = Boolean(
    selectedConversationId && selectedConversation && selectedConversationItem,
  );
  const activeConversation = isConversationSelected
    ? {
        id: selectedConversationId as string,
        data: selectedConversation as NonNullable<typeof selectedConversation>,
        item: selectedConversationItem as ConversationListItem,
      }
    : null;
  const topBanners: Array<{ id: string; text: string; variant: "error" | "info" }> = [];

  if (params.error) {
    topBanners.push({ id: "error", text: params.error, variant: "error" });
  }
  if (params.messageError) {
    topBanners.push({
      id: "message-error",
      text: params.messageError,
      variant: "error",
    });
  }
  if (bootstrapError) {
    topBanners.push({ id: "bootstrap", text: bootstrapError, variant: "info" });
  }
  if (params.blockError) {
    topBanners.push({ id: "block-error", text: params.blockError, variant: "error" });
  }
  if (params.blockSuccess) {
    topBanners.push({ id: "block-success", text: params.blockSuccess, variant: "info" });
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-7">
      <SectionHeader
        badge="Milestone 6"
        title="Messaggi privati"
        description="Chat 1:1 semplici e private, con regole di privacy e blocco attive."
      />

      <div className="grid gap-3 md:grid-cols-3">
        <div className="surface-soft p-4">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Conversazioni
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight">{conversations.length}</p>
        </div>
        <div className="surface-soft p-4">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Chat attiva
          </p>
          <p className="mt-1 truncate text-sm font-semibold tracking-tight">
            {activeConversation ? `@${activeConversation.item.otherUsername}` : "Nessuna selezionata"}
          </p>
        </div>
        <div className="surface-soft p-4">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Stato invio
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight">
            {activeConversation
              ? activeConversation.data.canSendMessages
                ? "Attivo"
                : "Disattivato"
              : "In attesa"}
          </p>
        </div>
      </div>

      {topBanners.length > 0 && (
        <div className="flex flex-col gap-2">
          {topBanners.map((banner) => (
            <p
              key={banner.id}
              className={cn(
                "rounded-xl border p-2.5 text-sm",
                banner.variant === "error"
                  ? "border-destructive/50 bg-destructive/10 text-destructive"
                  : "border-border/70 bg-secondary/30 text-muted-foreground",
              )}
            >
              {banner.text}
            </p>
          ))}
        </div>
      )}

      <form action="/messages" method="get" className="surface-panel flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border/70 bg-surface-1 p-1.5">
            <Plus className="size-3.5 text-primary" />
          </span>
          <p className="text-sm font-semibold tracking-tight">Nuova conversazione</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            name="user"
            placeholder="Inserisci username (es. mario.rossi)"
            defaultValue={requestedUsername ?? ""}
            autoComplete="off"
            minLength={3}
            maxLength={24}
          />
          <Button type="submit" size="sm" className="sm:min-w-28">
            Apri chat
          </Button>
        </div>
      </form>

      {conversations.length === 0 ? (
        <StateCard
          variant="empty"
          title="Nessuna conversazione"
          description="Avvia una chat dal profilo pubblico o dalla ricerca utenti."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside
            className={cn(
              "surface-panel no-scrollbar flex max-h-[72vh] flex-col gap-2 overflow-auto p-3.5",
              isConversationSelected && "hidden lg:flex",
            )}
          >
            <div className="flex items-center gap-2 px-1">
              <MessageCircleMore className="size-4 text-primary" />
              <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Conversazioni
              </p>
            </div>
            <p className="px-1 text-xs text-muted-foreground">
              Scorri le chat recenti
            </p>
            {conversations.map((conversation) => (
              <Link
                key={conversation.conversationId}
                href={messagesPath(conversation.conversationId)}
                className={cn(
                  "rounded-xl border border-border/70 bg-surface-1 p-3.5 transition-[border-color,background-color,transform] duration-150 hover:border-primary/45 hover:bg-surface-2/90",
                  selectedConversationId === conversation.conversationId &&
                    "border-primary/50 bg-primary/12",
                )}
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    {conversation.otherAvatarUrl && (
                      <AvatarImage
                        src={conversation.otherAvatarUrl}
                        alt={`Avatar di @${conversation.otherUsername}`}
                      />
                    )}
                    <AvatarFallback>{avatarFallback(conversation.otherUsername)}</AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col">
                    <p className="truncate text-sm font-semibold tracking-tight">
                      @{conversation.otherUsername}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {conversation.otherDisplayName}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {conversation.lastMessageText ?? "Nessun messaggio"}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground/90">
                      {formatCreatedAt(conversation.lastMessageAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </aside>

          <div
            className={cn(
              "surface-panel flex min-h-[72vh] flex-col overflow-hidden",
              !isConversationSelected && "hidden lg:flex",
            )}
          >
            {!isConversationSelected ? (
              <div className="flex flex-1 items-center p-5">
                <StateCard
                  variant="empty"
                  title="Seleziona una conversazione"
                  description="Apri una chat dalla colonna sinistra per vedere i messaggi."
                />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-surface-1 px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      {activeConversation!.item.otherAvatarUrl && (
                        <AvatarImage
                          src={activeConversation!.item.otherAvatarUrl}
                          alt={`Avatar di @${activeConversation!.item.otherUsername}`}
                        />
                      )}
                      <AvatarFallback>
                        {avatarFallback(activeConversation!.item.otherUsername)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-semibold tracking-tight">
                        @{activeConversation!.item.otherUsername}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ultima attivita {formatCreatedAt(activeConversation!.item.lastMessageAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <Link
                      href="/messages"
                      className={cn(buttonVariants({ size: "xs", variant: "ghost" }), "lg:hidden")}
                    >
                      Conversazioni
                    </Link>
                    {!activeConversation!.data.isBlockedByMe && !activeConversation!.data.hasBlockedMe && (
                      <Link
                        href={`/profile/${activeConversation!.item.otherUsername}`}
                        className={buttonVariants({ size: "xs", variant: "outline" })}
                      >
                        Apri profilo
                      </Link>
                    )}
                    {activeConversation!.data.isBlockedByMe ? (
                      <form action={unblockUserFromMessagesAction}>
                        <input type="hidden" name="conversationId" value={activeConversation!.id} />
                        <input
                          type="hidden"
                          name="targetUserId"
                          value={activeConversation!.item.otherUserId}
                        />
                        <Button type="submit" size="xs" variant="outline">
                          Sblocca
                        </Button>
                      </form>
                    ) : (
                      <form action={blockUserFromMessagesAction}>
                        <input type="hidden" name="conversationId" value={activeConversation!.id} />
                        <input
                          type="hidden"
                          name="targetUserId"
                          value={activeConversation!.item.otherUserId}
                        />
                        <Button type="submit" size="xs" variant="destructive">
                          Blocca
                        </Button>
                      </form>
                    )}
                  </div>
                </div>

                <div className="no-scrollbar flex flex-1 flex-col gap-2.5 overflow-auto px-4 py-4">
                  {activeConversation!.data.messages.length === 0 ? (
                    <StateCard
                      variant="empty"
                      title="Nessun messaggio"
                      description={
                        activeConversation!.data.canSendMessages
                          ? "Invia il primo messaggio per iniziare la conversazione."
                          : "Storico vuoto. Non puoi inviare nuovi messaggi in questa conversazione."
                      }
                    />
                  ) : (
                    activeConversation!.data.messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "max-w-[80%] rounded-2xl border p-3",
                          message.isMine
                            ? "ml-auto border-primary/45 bg-primary/14"
                            : "mr-auto border-border/70 bg-surface-1",
                        )}
                      >
                        <p className="text-[11px] text-muted-foreground">
                          @{message.senderUsername} - {formatCreatedAt(message.createdAt)}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed break-words">{message.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {!activeConversation!.data.canSendMessages && (
                  <div className="mx-4 mb-2 flex items-start gap-2 rounded-xl border border-border/70 bg-secondary/35 p-2.5 text-sm text-muted-foreground">
                    <ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" />
                    <p>
                      {activeConversation!.data.sendBlockedReason ??
                        "In questa conversazione non puoi piu inviare nuovi messaggi."}
                    </p>
                  </div>
                )}

                <form action={sendMessageAction} className="border-t border-border/70 bg-surface-1 px-4 py-3.5">
                  <input type="hidden" name="conversationId" value={activeConversation!.id} />
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      name="content"
                      placeholder={
                        activeConversation!.data.canSendMessages
                          ? "Scrivi un messaggio..."
                          : "Invio disabilitato"
                      }
                      maxLength={2000}
                      autoComplete="off"
                      disabled={!activeConversation!.data.canSendMessages}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="sm:min-w-24"
                      disabled={!activeConversation!.data.canSendMessages}
                    >
                      Invia
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

