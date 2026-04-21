import { CalendarDays, MapPin, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { FeedRitual } from "@/lib/feed";

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
  const locationLabel = ritual.city ? `${ritual.city}, ${ritual.province}` : ritual.province;

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
          }).format(new Date(ritual.scheduledFor))}
        </span>
      </div>

      <div className="space-y-1">
        <p className="text-lg font-semibold tracking-tight text-foreground">{ritual.title}</p>
        <p className="text-sm text-muted-foreground">{formatScheduledLabel(ritual)}</p>
      </div>

      {ritual.description ? (
        <p className="text-sm leading-relaxed text-foreground/88 [overflow-wrap:anywhere]">
          {ritual.description}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-black/14 px-2.5 py-1 text-[11px] text-muted-foreground">
          <MapPin className="size-3.5" />
          {locationLabel}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/18 bg-primary/8 px-2.5 py-1 text-[11px] text-primary">
          <Sparkles className="size-3.5" />
          Tribu {ritual.passionName}
        </span>
      </div>

      <div className="flex items-center gap-3 rounded-[1.1rem] border border-border/70 bg-black/12 px-3 py-2.5">
        <Avatar className="size-9">
          {ritual.creatorAvatarUrl ? (
            <AvatarImage src={ritual.creatorAvatarUrl} alt={`Avatar di @${ritual.creatorUsername}`} />
          ) : null}
          <AvatarFallback>{avatarFallback(ritual.creatorUsername)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{ritual.creatorDisplayName}</p>
          <p className="truncate text-xs text-muted-foreground">@{ritual.creatorUsername}</p>
        </div>
      </div>
    </article>
  );
}
