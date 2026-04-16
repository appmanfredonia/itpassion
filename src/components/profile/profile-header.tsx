import { Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AppProfile } from "@/lib/auth";
import type { ProfileCounter, ProfilePassion } from "@/lib/profile";
import type { ReactNode } from "react";

type ProfileHeaderProps = {
  profile: AppProfile;
  counters: ProfileCounter;
  passions: ProfilePassion[];
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
  actionSlot,
}: ProfileHeaderProps) {
  return (
    <Card className="surface-elevated overflow-hidden rounded-[2rem] border-border/80">
      <div className="relative h-[8.5rem] border-b border-border/80 bg-[radial-gradient(circle_at_25%_20%,oklch(0.73_0.16_294_/_0.34),transparent_32%),radial-gradient(circle_at_78%_30%,oklch(0.7_0.15_243_/_0.28),transparent_30%),linear-gradient(135deg,oklch(0.17_0.02_270),oklch(0.13_0.02_272))]" />
      <CardContent className="flex flex-col gap-5 p-5 md:p-6">
        <div className="-mt-16 flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar
              size="lg"
              className="size-24 ring-4 ring-background/85 shadow-[0_24px_50px_-30px_oklch(0_0_0_/_0.88)]"
            >
              {profile.avatarUrl && (
                <AvatarImage src={profile.avatarUrl} alt={`Avatar di @${profile.username}`} />
              )}
              <AvatarFallback>{avatarFallback(profile.username)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-xl font-semibold tracking-[-0.03em]">{profile.displayName}</p>
              <p className="truncate text-sm text-muted-foreground">@{profile.username}</p>
            </div>
          </div>
          {actionSlot}
        </div>

        <div className="surface-soft flex items-start gap-2 rounded-[1.5rem] border-border/80 bg-black/14 p-3.5">
          <Sparkles className="mt-0.5 size-4 text-primary" />
          <p className="text-sm leading-relaxed text-foreground/90">
            {profile.bio ?? "Bio non impostata."}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
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

        <div className="flex flex-wrap gap-2">
          {passions.length === 0 ? (
            <Badge variant="outline" className="rounded-full px-3 py-1">
              Nessuna passione selezionata
            </Badge>
          ) : (
            passions.map((passion) => (
              <Badge
                key={passion.slug}
                variant="secondary"
                className="rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-primary"
              >
                {passion.name}
              </Badge>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
