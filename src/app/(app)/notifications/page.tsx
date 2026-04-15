import Link from "next/link";
import { redirect } from "next/navigation";
import { SectionHeader } from "@/components/section-header";
import { ensureUserProfile } from "@/lib/auth";
import { getNotifications, type NotificationItem } from "@/lib/notifications";
import { createServerSupabaseClient } from "@/lib/supabase";
import { StateCard } from "@/components/state-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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

function typeLabel(type: NotificationItem["type"]): string {
  if (type === "follow") {
    return "Follower";
  }
  if (type === "like") {
    return "Like";
  }
  if (type === "comment") {
    return "Commento";
  }
  if (type === "conversation") {
    return "Nuova chat";
  }
  return "Messaggio";
}

export default async function NotificationsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let hasError = false;
  let notifications: NotificationItem[] = [];

  try {
    await ensureUserProfile(supabase, user);
    notifications = await getNotifications(supabase, user.id, 50);
  } catch {
    hasError = true;
  }

  if (hasError) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <h1 className="text-2xl font-semibold md:text-3xl">Notifiche</h1>
        <StateCard
          variant="error"
          title="Errore caricamento notifiche"
          description="Impossibile caricare le attivita recenti. Riprova tra poco."
        />
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <SectionHeader
        badge="Milestone 6"
        title="Notifiche"
        description="Follower, like, commenti e attivita chat recenti in un unico stream."
      />

      {notifications.length === 0 ? (
        <StateCard
          variant="empty"
          title="Nessuna notifica"
          description="Quando ricevi follower, like, commenti, nuove chat o messaggi vedrai tutto qui."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((notification) => (
            <Link
              key={notification.id}
              href={notification.href}
              className="rounded-xl border border-border/70 bg-background/60 p-4 hover:border-primary/40"
            >
              <div className="flex items-start gap-3">
                <Avatar>
                  {notification.actorAvatarUrl && (
                    <AvatarImage
                      src={notification.actorAvatarUrl}
                      alt={`Avatar di @${notification.actorUsername}`}
                    />
                  )}
                  <AvatarFallback>{avatarFallback(notification.actorUsername)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      @{notification.actorUsername}
                    </p>
                    <Badge variant="outline">{typeLabel(notification.type)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {notification.content}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatCreatedAt(notification.createdAt)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
