import { MapPin, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AppProfile } from "@/lib/auth";
import { formatLocationLabel } from "@/lib/location";
import type {
  ProfileCounter,
  ProfileLocalTribe,
  ProfilePassion,
} from "@/lib/profile";
import type { ReactNode } from "react";

type ProfileHeaderProps = {
  profile: AppProfile;
  counters: ProfileCounter;
  passions: ProfilePassion[];
  localTribes: ProfileLocalTribe[];
  actionSlot?: ReactNode;
};

function avatarFallback(username: string): string {
  const normalized = username.trim();
  if (normalized.length === 0) {
    return "IT";
  }

  return normalized.slice(0, 2).toUpperCase();
}

export function ProfileHeader({
  profile,
  counters,
  passions,
  localTribes,
  actionSlot,
}: ProfileHeaderProps) {
  const locationLabel = formatLocationLabel(profile);

  return (
    <Card className="surface-elevated overflow-visible rounded-[1.9rem] border-border/80">
      <div className="relative overflow-hidden rounded-t-[1.9rem] border-b border-border/80">
        <div className="h-[6.9rem] bg-[radial-gradient(circle_at_25%_20%,oklch(0.73_0.16_294_/_0.24),transparent_32%),radial-gradient(circle_at_78%_30%,oklch(0.7_0.15_243_/_0.2),transparent_30%),linear-gradient(135deg,oklch(0.17_0.02_270),oklch(0.13_0.02_272))] md:h-[8.1rem]" />
      </div>
      <CardContent className="flex flex-col gap-3.5 p-4 pt-4 md:gap-4 md:p-5 md:pt-5">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-x-4 md:gap-y-2">
          <div className="row-span-2 flex items-start">
            <Avatar
              size="lg"
              className="-mt-11 size-20 ring-4 ring-background/92 shadow-[0_24px_50px_-30px_oklch(0_0_0_/_0.88)] md:-mt-14 md:size-24"
            >
              {profile.avatarUrl && (
                <AvatarImage src={profile.avatarUrl} alt={`Avatar di @${profile.username}`} />
              )}
              <AvatarFallback>{avatarFallback(profile.username)}</AvatarFallback>
            </Avatar>
          </div>

          <div className="col-start-2 min-w-0 pt-2 md:col-span-1 md:self-end md:pt-4">
            <p className="max-w-full text-xl font-semibold leading-tight tracking-[-0.03em] break-words text-balance md:text-[1.45rem]">
              {profile.displayName}
            </p>
            <p className="pt-0.5 text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
              @{profile.username}
            </p>
            {locationLabel ? (
              <p className="mt-1 inline-flex max-w-full items-center gap-1.5 text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                <MapPin className="size-3.5 shrink-0 text-primary" />
                <span>{locationLabel}</span>
              </p>
            ) : null}
          </div>

          {actionSlot ? (
            <div className="col-start-2 row-start-2 flex min-w-0 flex-wrap items-center gap-2 pt-1 md:col-start-3 md:row-span-2 md:row-start-1 md:items-end md:justify-end md:self-end md:pt-0">
              {actionSlot}
            </div>
          ) : null}
        </div>

        <div className="surface-soft flex items-start gap-2 rounded-[1.35rem] border-border/80 bg-black/14 p-3.5">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <p className="text-sm leading-relaxed break-words text-foreground/90 [overflow-wrap:anywhere]">
            {profile.bio ?? "Bio non impostata."}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          <div className="app-grid-stat">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">Post</p>
            <p className="mt-1 text-xl font-semibold tracking-tight">{counters.postsCount}</p>
          </div>
          <div className="app-grid-stat">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">Follower</p>
            <p className="mt-1 text-xl font-semibold tracking-tight">{counters.followersCount}</p>
          </div>
          <div className="app-grid-stat">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">Seguiti</p>
            <p className="mt-1 text-xl font-semibold tracking-tight">{counters.followingCount}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-2.5">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Passioni principali
            </p>
            <div className="flex min-w-0 flex-wrap gap-2.5 pt-0.5">
              {passions.length === 0 ? (
                <Badge variant="outline" className="min-h-9 rounded-full px-3.5 py-1.5">
                  Nessuna passione selezionata
                </Badge>
              ) : (
                passions.map((passion) => (
                  <Badge
                    key={passion.slug}
                    variant="secondary"
                    className="min-h-9 rounded-full border-primary/20 bg-primary/10 px-3.5 py-1.5 text-primary"
                  >
                    {passion.name}
                  </Badge>
                ))
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-2.5">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Tribu locali
            </p>
            <div className="flex min-w-0 flex-wrap gap-2.5 pt-0.5">
              {localTribes.length === 0 ? (
                <Badge variant="outline" className="min-h-9 rounded-full px-3.5 py-1.5">
                  Si attivano scegliendo da 1 a 3 passioni e la tua citta
                </Badge>
              ) : (
                localTribes.map((tribe) => (
                  <span
                    key={tribe.id}
                    className="inline-flex min-h-9 max-w-full items-center rounded-full border px-3.5 py-1.5 text-sm font-medium"
                    style={{
                      color: tribe.color.badgeText,
                      backgroundColor: tribe.color.badgeBackground,
                      borderColor: tribe.color.badgeBorder,
                    }}
                    title={tribe.label}
                  >
                    <span className="truncate">
                      {tribe.passionName} - {tribe.province}
                    </span>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
