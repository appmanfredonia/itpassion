"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, MapPin, Sparkles, Users } from "lucide-react";
import { AreaMap } from "@/components/map/area-map";
import { RitualParticipationButton } from "@/components/rituals/ritual-participation-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { RitualDetail, RitualParticipant } from "@/lib/rituals";
import { formatRitualLocationLabel } from "@/lib/rituals";
import { cn } from "@/lib/utils";

type RitualDetailViewProps = {
  ritual: RitualDetail;
  viewerParticipant: RitualParticipant | null;
};

function formatSchedule(value: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(value));
}

function avatarFallback(username: string): string {
  const normalized = username.trim();
  if (normalized.length === 0) {
    return "IT";
  }

  return normalized.slice(0, 2).toUpperCase();
}

function computeRemainingSpots(ritual: RitualDetail, nextCount: number): number | null {
  if (!ritual.maxParticipants) {
    return null;
  }

  return Math.max(0, ritual.maxParticipants - nextCount);
}

export function RitualDetailView({ ritual, viewerParticipant }: RitualDetailViewProps) {
  const [ritualState, setRitualState] = useState(ritual);

  useEffect(() => {
    setRitualState(ritual);
  }, [ritual]);

  const participantsLabel = ritualState.maxParticipants
    ? `${ritualState.participantCount}/${ritualState.maxParticipants} partecipanti`
    : `${ritualState.participantCount} partecipanti`;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(18rem,0.82fr)] xl:items-start">
      <div className="flex flex-col gap-4">
        <article className="surface-panel flex flex-col gap-4 rounded-[1.8rem] border-border/80 bg-card/92 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <Badge
                variant="secondary"
                className="rounded-full px-3 py-1 text-[10.5px]"
                style={{
                  color: ritualState.color.badgeText,
                  backgroundColor: ritualState.color.badgeBackground,
                  borderColor: ritualState.color.badgeBorder,
                }}
              >
                {ritualState.passionName}
              </Badge>
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">{ritualState.title}</h2>
                <p className="text-sm text-muted-foreground">{ritualState.tribeLabel}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <RitualParticipationButton
                ritualId={ritualState.id}
                joinedByMe={ritualState.joinedByMe}
                participantCount={ritualState.participantCount}
                maxParticipants={ritualState.maxParticipants}
                isCreator={ritualState.isCreator}
                className="rounded-xl"
                onParticipationChange={(nextState) => {
                  setRitualState((currentRitual) => {
                    const nextParticipants =
                      viewerParticipant === null
                        ? currentRitual.participants
                        : nextState.joinedByMe
                          ? currentRitual.participants.some(
                              (participant) => participant.userId === viewerParticipant.userId,
                            )
                            ? currentRitual.participants
                            : [...currentRitual.participants, viewerParticipant]
                          : currentRitual.participants.filter(
                              (participant) => participant.userId !== viewerParticipant.userId,
                            );

                    return {
                      ...currentRitual,
                      joinedByMe: nextState.joinedByMe,
                      participantCount: nextState.participantCount,
                      remainingSpots: computeRemainingSpots(
                        currentRitual,
                        nextState.participantCount,
                      ),
                      participants: nextParticipants,
                    };
                  });
                }}
              />
              <Link
                href={`/profile/${ritualState.creatorUsername}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl")}
              >
                Profilo creatore
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-black/14 px-3 py-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" />
              {formatSchedule(ritualState.scheduledFor)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-black/14 px-3 py-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5" />
              {formatRitualLocationLabel(ritualState)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-black/14 px-3 py-1.5 text-xs text-muted-foreground">
              <Users className="size-3.5" />
              {participantsLabel}
            </span>
            {ritualState.remainingSpots !== null ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/18 bg-primary/8 px-3 py-1.5 text-xs text-primary">
                <Sparkles className="size-3.5" />
                {ritualState.remainingSpots === 0
                  ? "Rituale al completo"
                  : `${ritualState.remainingSpots} posti rimasti`}
              </span>
            ) : null}
          </div>

          {ritualState.description ? (
            <p className="text-sm leading-relaxed text-foreground/90 [overflow-wrap:anywhere]">
              {ritualState.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nessuna descrizione aggiunta. Per ora il rituale si racconta con titolo, luogo, data e tribu di riferimento.
            </p>
          )}
        </article>

        <article className="surface-panel flex flex-col gap-3 rounded-[1.8rem] border-border/80 bg-card/92 p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Mappa locale
              </p>
              <p className="mt-1 text-sm font-semibold tracking-tight">Dove si svolge il rituale</p>
            </div>
            <span className="rounded-full border border-border/80 bg-black/14 px-3 py-1 text-[11px] text-muted-foreground">
              {ritualState.city ? `${ritualState.city}, ${ritualState.province}` : ritualState.province}
            </span>
          </div>

          <AreaMap rituals={[ritualState]} viewerProvince={ritualState.province} />
        </article>
      </div>

      <div className="flex flex-col gap-4">
        <article className="surface-panel flex flex-col gap-3 rounded-[1.8rem] border-border/80 bg-card/92 p-4">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Creatore
          </p>
          <div className="flex items-center gap-3 rounded-[1.15rem] border border-border/70 bg-black/12 px-3 py-3">
            <Avatar className="size-11">
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
        </article>

        <article className="surface-panel flex flex-col gap-3 rounded-[1.8rem] border-border/80 bg-card/92 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Partecipanti
              </p>
              <p className="mt-1 text-sm font-semibold tracking-tight">{participantsLabel}</p>
            </div>
          </div>

          {ritualState.participants.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nessuna partecipazione confermata per ora. Quando qualcuno della tribu aderira, lo vedrai qui.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {ritualState.participants.map((participant) => (
                <div
                  key={participant.userId}
                  className="flex items-center gap-3 rounded-[1.1rem] border border-border/70 bg-black/12 px-3 py-2.5"
                >
                  <Avatar className="size-9">
                    {participant.avatarUrl ? (
                      <AvatarImage src={participant.avatarUrl} alt={`Avatar di @${participant.username}`} />
                    ) : null}
                    <AvatarFallback>{avatarFallback(participant.username)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{participant.displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">@{participant.username}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
