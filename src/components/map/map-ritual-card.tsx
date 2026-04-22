"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, MapPin, Sparkles, Users } from "lucide-react";
import { RitualParticipationButton } from "@/components/rituals/ritual-participation-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatItalianMediumDateTime } from "@/lib/date";
import type { RitualMapItem } from "@/lib/map";
import { formatRitualLocationLabel } from "@/lib/rituals";
import { cn } from "@/lib/utils";

type MapRitualCardProps = {
  ritual: RitualMapItem;
};

function formatSchedule(value: string): string {
  return formatItalianMediumDateTime(value);
}

export function MapRitualCard({ ritual }: MapRitualCardProps) {
  const [ritualState, setRitualState] = useState(ritual);

  useEffect(() => {
    setRitualState(ritual);
  }, [ritual]);

  const locationLabel = formatRitualLocationLabel(ritualState);
  const participantsLabel = ritualState.maxParticipants
    ? `${ritualState.participantCount}/${ritualState.maxParticipants} partecipanti`
    : `${ritualState.participantCount} partecipanti`;

  return (
    <article
      id={`map-ritual-${ritualState.id}`}
      className="surface-panel flex scroll-mt-28 flex-col gap-3 rounded-[1.5rem] border-border/80 bg-card/92 p-3.5"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-foreground">{ritualState.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{ritualState.tribeLabel}</p>
        </div>
        <Badge
          variant="secondary"
          className="rounded-full px-2.5 py-1 text-[10.5px]"
          style={{
            color: ritualState.color.badgeText,
            backgroundColor: ritualState.color.badgeBackground,
            borderColor: ritualState.color.badgeBorder,
          }}
        >
          {ritualState.passionName}
        </Badge>
      </div>

      {ritualState.description ? (
        <p className="text-sm leading-relaxed text-foreground/88 [overflow-wrap:anywhere]">
          {ritualState.description}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-black/14 px-2.5 py-1 text-[11px] text-muted-foreground">
          <MapPin className="size-3.5" />
          {locationLabel}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-black/14 px-2.5 py-1 text-[11px] text-muted-foreground">
          <CalendarDays className="size-3.5" />
          {formatSchedule(ritualState.scheduledFor)}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-black/14 px-2.5 py-1 text-[11px] text-muted-foreground">
          <Users className="size-3.5" />
          {participantsLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <RitualParticipationButton
          ritualId={ritualState.id}
          joinedByMe={ritualState.joinedByMe}
          participantCount={ritualState.participantCount}
          maxParticipants={ritualState.maxParticipants}
          isCreator={ritualState.isCreator}
          size="sm"
          className="w-full"
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
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full justify-center")}
        >
          Apri rituale
        </Link>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Sparkles className="size-3.5" />
        Creato da {ritualState.creatorDisplayName}
      </div>
    </article>
  );
}
