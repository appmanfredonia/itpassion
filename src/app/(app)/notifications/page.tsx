import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Heart,
  MessageCircleMore,
  MessageSquareText,
  UserRoundPlus,
} from "lucide-react";
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

function typeIcon(type: NotificationItem["type"]) {
  if (type === "follow") {
    return UserRoundPlus;
  }
  if (type === "like") {
    return Heart;
  }
  if (type === "comment") {
    return MessageSquareText;
  }
  if (type === "conversation") {
    return MessageCircleMore;
  }
  return MessageCircleMore;
}

function dayLabel(value: string): string {
  const today = new Date();
  const target = new Date(value);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diff = Math.round(
    (startOfToday.getTime() - startOfTarget.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diff === 0) {
    return "Oggi";
  }
  if (diff === 1) {
    return "Ieri";
  }

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "long",
  }).format(target);
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

  const groupedNotifications = notifications.reduce<Map<string, NotificationItem[]>>(
    (groups, notification) => {
      const label = dayLabel(notification.createdAt);
      const current = groups.get(label) ?? [];
      current.push(notification);
      groups.set(label, current);
      return groups;
    },
    new Map(),
  );

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-7">
      <SectionHeader
        badge="Milestone 6"
        title="Notifiche"
        description="Timeline piu ordinata, densa e leggibile per follower, like, commenti e chat."
      />

      <div className="grid grid-cols-3 gap-3">
        <div className="app-grid-stat">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Attivita recenti
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight">{notifications.length}</p>
        </div>
        <div className="app-grid-stat">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Ultima notifica
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight">
            {notifications[0] ? formatCreatedAt(notifications[0].createdAt) : "Nessuna"}
          </p>
        </div>
        <div className="app-grid-stat">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Stato notifiche
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight">
            {notifications.length === 0 ? "Pulita" : "Attiva"}
          </p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <StateCard
          variant="empty"
          title="Nessuna notifica"
          description="Quando ricevi follower, like, commenti, nuove chat o messaggi vedrai tutto qui."
        />
      ) : (
        <div className="app-page-shell flex flex-col gap-3">
          {Array.from(groupedNotifications.entries()).map(([label, items]) => (
            <div key={label} className="flex flex-col gap-2.5">
              <p className="px-1 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                {label}
              </p>
              {items.map((notification) => {
                const Icon = typeIcon(notification.type);

                return (
                  <Link
                    key={notification.id}
                    href={notification.href}
                    className="group/notification rounded-[1.6rem] border border-border/80 bg-surface-1/95 p-4 transition-[border-color,background-color,transform,box-shadow] duration-200 hover:border-primary/45 hover:bg-surface-2/90 hover:shadow-[0_22px_42px_-28px_oklch(0.73_0.16_294_/_0.78)]"
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
                        <div className="flex flex-wrap items-center gap-2.5">
                          <p className="truncate text-sm font-semibold tracking-tight">
                            @{notification.actorUsername}
                          </p>
                          <Badge variant="outline" className="gap-1 border-border/80 bg-black/12">
                            <Icon className="size-3" />
                            {typeLabel(notification.type)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed break-words text-muted-foreground">
                          {notification.content}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground/90">
                          {formatCreatedAt(notification.createdAt)}
                        </p>
                      </div>
                      {notification.previewImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={notification.previewImageUrl}
                          alt=""
                          className="h-16 w-16 rounded-2xl border border-border/70 object-cover"
                        />
                      ) : (
                        <span className="mt-1 size-2 rounded-full bg-primary/70 transition-transform duration-150 group-hover/notification:scale-110" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
