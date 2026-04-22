"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, MapPin, Sparkles, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { RitualParticipationButton } from "@/components/rituals/ritual-participation-button";
import type { FeedRitual } from "@/lib/feed";
import { formatRitualLocationLabel } from "@/lib/rituals";
import { cn } from "@/lib/utils";

type FeedRitualCardProps = {
  ritual: FeedRitual;
};

function avatarFallback(username: string): string {
  const normalized = username.trim();
  if (normalized.length === 0) {
    return "IT";
  }

  return normalized.slice(0, 2).toUpperCase();
}

function formatScheduledLabel(ritual: FeedRitual): string {
  const scheduledDate = new Date(ritual.scheduledFor);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const startOfDayAfterTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);

  if (scheduledDate >= startOfToday && scheduledDate < startOfTomorrow) {
    return `Oggi nella Tribu ${ritual.passionName} - ${ritual.province}`;
  }

  if (scheduledDate >= startOfTomorrow && scheduledDate < startOfDayAfterTomorrow) {
    return `Domani nella Tribu ${ritual.passionName} - ${ritual.province}`;
  }

  return `${new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(scheduledDate)} - Tribu ${ritual.passionName}, ${ritual.province}`;
}

export function FeedRitualCard({ ritual }: FeedRitualCardProps) {
  const [ritualState, setRitualState] = useState(ritual);

  useEffect(() => {
    setRitualState(ritual);
  }, [ritual]);

  const locationLabel = formatRitualLocationLabel(ritualState);
  const participantsLabel = ritualState.maxParticipants
    ? `${ritualState.participantCount}/${ritualState.maxParticipants} partecipanti`
    : `${ritualState.participantCount} partecipanti`;

  return (
    <article className="surface-panel flex flex-col gap-3 rounded-[1.5rem] border-border/80 bg-card/92 p-4">
      <div className="flex items-center justify-between gap-3">
        <Badge
          variant="secondary"
          className="rounded-full border-primary/18 bg-primary/10 px-3 py-1 text-[10.5px] text-primary"
        >
          Nuovo rituale nella tua tribu
        </Badge>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <CalendarDays className="size-3.5" />
          {new Intl.DateTimeFormat("it-IT", {
            dateStyle: "short",
            timeStyle: "short",
          }).format(new Date(ritualState.scheduledFor))}
        </span>
      </div>

      <div className="space-y-1">
        <p className="text-lg font-semibold tracking-tight text-foreground">{ritualState.title}</p>
        <p className="text-sm text-muted-foreground">{formatScheduledLabel(ritualState)}</p>
      </div>

      {ritualState.description ? (
        <p className="text-sm leading-relaxed text-foreground/88 [overflow-wrap:anywhere]">
          {ritualState.description}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-black/14 px-2.5 py-1 text-[11px] text-muted-foreground">
          <MapPin className="size-3.5" />
          {locationLabel}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/18 bg-primary/8 px-2.5 py-1 text-[11px] text-primary">
          <Sparkles className="size-3.5" />
          Tribu {ritualState.passionName}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-black/14 px-2.5 py-1 text-[11px] text-muted-foreground">
          <Users className="size-3.5" />
          {participantsLabel}
        </span>
      </div>

      <div className="flex items-center gap-3 rounded-[1.1rem] border border-border/70 bg-black/12 px-3 py-2.5">
        <Avatar className="size-9">
          {ritualState.creatorAvatarUrl ? (
            <AvatarImage src={ritualState.creatorAvatarUrl} alt={`Avatar di @${ritualState.creatorUsername}`} />
          ) : null}
          <AvatarFallback>{avatarFallback(ritualState.creatorUsername)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{ritualState.creatorDisplayName}</p>
          <p className="truncate text-xs text-muted-foreground">@{ritualState.creatorUsername}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <RitualParticipationButton
          ritualId={ritualState.id}
          joinedByMe={ritualState.joinedByMe}
          participantCount={ritualState.participantCount}
          maxParticipants={ritualState.maxParticipants}
          isCreator={ritualState.isCreator}
          size="sm"
          className="w-full rounded-xl"
          onParticipationChange={(nextState) =>
            setRitualState((currentRitual) => ({
              ...currentRitual,
              joinedByMe: nextState.joinedByMe,
              participantCount: nextState.participantCount,
              remainingSpots:
                currentRitual.maxParticipants === null
                  ? null
                  : Math.max(0, currentRitual.maxParticipants - nextState.participantCount),
            }))
          }
        />
        <Link
          href={`/rituals/${ritualState.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full rounded-xl")}
        >
          Apri rituale
        </Link>
      </div>
    </article>
  );
}
