import Link from "next/link";
import { redirect } from "next/navigation";
import {
  blockUserFromMessagesAction,
  sendMessageAction,
  unblockUserFromMessagesAction,
} from "@/app/(app)/messages/actions";
import { StateCard } from "@/components/state-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
      if (normalizedUsername.length >= 3) {
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

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary" className="text-[10px] tracking-[0.2em] uppercase">
          Milestone 6
        </Badge>
        <h1 className="text-2xl font-semibold md:text-3xl">Messaggi privati</h1>
      </div>

      {params.error && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
          {params.error}
        </p>
      )}
      {params.messageError && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
          {params.messageError}
        </p>
      )}
      {bootstrapError && (
        <p className="rounded-md border border-border/70 bg-secondary/30 p-2 text-sm text-muted-foreground">
          {bootstrapError}
        </p>
      )}
      {params.blockError && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
          {params.blockError}
        </p>
      )}
      {params.blockSuccess && (
        <p className="rounded-md border border-border/70 bg-secondary/30 p-2 text-sm text-muted-foreground">
          {params.blockSuccess}
        </p>
      )}

      {conversations.length === 0 ? (
        <StateCard
          variant="empty"
          title="Nessuna conversazione"
          description="Avvia una chat dal profilo pubblico o dalla ricerca utenti."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="flex max-h-[70vh] flex-col gap-2 overflow-auto rounded-xl border border-border/70 bg-background/60 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Conversazioni
            </p>
            {conversations.map((conversation) => (
              <Link
                key={conversation.conversationId}
                href={`/messages?c=${conversation.conversationId}`}
                className={cn(
                  "rounded-lg border border-border/70 bg-card/70 p-3 hover:border-primary/40",
                  selectedConversationId === conversation.conversationId &&
                    "border-primary/50 bg-primary/10",
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
                    <p className="truncate text-sm font-medium">@{conversation.otherUsername}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {conversation.lastMessageText ?? "Nessun messaggio"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </aside>

          <div className="flex min-h-[70vh] flex-col rounded-xl border border-border/70 bg-background/60">
            {!selectedConversationId || !selectedConversation || !selectedConversationItem ? (
              <div className="flex flex-1 items-center p-4">
                <StateCard
                  variant="empty"
                  title="Seleziona una conversazione"
                  description="Apri una chat dalla colonna sinistra per vedere i messaggi."
                />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 border-b border-border/70 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      {selectedConversationItem.otherAvatarUrl && (
                        <AvatarImage
                          src={selectedConversationItem.otherAvatarUrl}
                          alt={`Avatar di @${selectedConversationItem.otherUsername}`}
                        />
                      )}
                      <AvatarFallback>
                        {avatarFallback(selectedConversationItem.otherUsername)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium">
                        @{selectedConversationItem.otherUsername}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ultima attivita {formatCreatedAt(selectedConversationItem.lastMessageAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!selectedConversation.isBlockedByMe && !selectedConversation.hasBlockedMe && (
                      <Link
                        href={`/profile/${selectedConversationItem.otherUsername}`}
                        className={buttonVariants({ size: "xs", variant: "outline" })}
                      >
                        Apri profilo
                      </Link>
                    )}
                    {selectedConversation.isBlockedByMe ? (
                      <form action={unblockUserFromMessagesAction}>
                        <input type="hidden" name="conversationId" value={selectedConversationId} />
                        <input
                          type="hidden"
                          name="targetUserId"
                          value={selectedConversationItem.otherUserId}
                        />
                        <Button type="submit" size="xs" variant="outline">
                          Sblocca
                        </Button>
                      </form>
                    ) : (
                      <form action={blockUserFromMessagesAction}>
                        <input type="hidden" name="conversationId" value={selectedConversationId} />
                        <input
                          type="hidden"
                          name="targetUserId"
                          value={selectedConversationItem.otherUserId}
                        />
                        <Button type="submit" size="xs" variant="destructive">
                          Blocca
                        </Button>
                      </form>
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-2 overflow-auto p-4">
                  {selectedConversation.messages.length === 0 ? (
                    <StateCard
                      variant="empty"
                      title="Nessun messaggio"
                      description={
                        selectedConversation.canSendMessages
                          ? "Invia il primo messaggio per iniziare la conversazione."
                          : "Storico vuoto. Non puoi inviare nuovi messaggi in questa conversazione."
                      }
                    />
                  ) : (
                    selectedConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "max-w-[80%] rounded-lg border border-border/70 p-3",
                          message.isMine
                            ? "ml-auto bg-primary/15"
                            : "mr-auto bg-card/70",
                        )}
                      >
                        <p className="text-xs text-muted-foreground">
                          @{message.senderUsername} - {formatCreatedAt(message.createdAt)}
                        </p>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {!selectedConversation.canSendMessages && (
                  <p className="mx-4 mb-2 rounded-md border border-border/70 bg-secondary/30 p-2 text-sm text-muted-foreground">
                    {selectedConversation.sendBlockedReason ??
                      "Non puoi più inviare messaggi in questa conversazione."}
                  </p>
                )}

                <form action={sendMessageAction} className="border-t border-border/70 p-4">
                  <input type="hidden" name="conversationId" value={selectedConversationId} />
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      name="content"
                      placeholder={
                        selectedConversation.canSendMessages
                          ? "Scrivi un messaggio..."
                          : "Invio disabilitato"
                      }
                      maxLength={2000}
                      autoComplete="off"
                      disabled={!selectedConversation.canSendMessages}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!selectedConversation.canSendMessages}
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
