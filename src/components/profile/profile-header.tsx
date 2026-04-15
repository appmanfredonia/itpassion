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
    <Card className="surface-elevated overflow-hidden">
      <div className="h-24 border-b border-border/70 bg-gradient-to-r from-primary/22 via-accent/16 to-transparent" />
      <CardContent className="flex flex-col gap-5 p-5 md:p-6">
        <div className="-mt-13 flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar size="lg" className="ring-4 ring-background/85 shadow-[0_16px_36px_-24px_oklch(0_0_0_/_0.8)]">
              {profile.avatarUrl && (
                <AvatarImage src={profile.avatarUrl} alt={`Avatar di @${profile.username}`} />
              )}
              <AvatarFallback>{avatarFallback(profile.username)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-lg font-semibold tracking-tight">{profile.displayName}</p>
              <p className="truncate text-sm text-muted-foreground">@{profile.username}</p>
            </div>
          </div>
          {actionSlot}
        </div>

        <div className="surface-soft flex items-start gap-2 p-3">
          <Sparkles className="mt-0.5 size-4 text-primary" />
          <p className="text-sm leading-relaxed text-foreground/90">
            {profile.bio ?? "Bio non impostata."}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-surface-1 p-3">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">Post</p>
            <p className="mt-1 text-xl font-semibold tracking-tight">{counters.postsCount}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-surface-1 p-3">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">Follower</p>
            <p className="mt-1 text-xl font-semibold tracking-tight">{counters.followersCount}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-surface-1 p-3">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">Seguiti</p>
            <p className="mt-1 text-xl font-semibold tracking-tight">{counters.followingCount}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {passions.length === 0 ? (
            <Badge variant="outline">Nessuna passione selezionata</Badge>
          ) : (
            passions.map((passion) => (
              <Badge key={passion.slug} variant="secondary">
                {passion.name}
              </Badge>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
