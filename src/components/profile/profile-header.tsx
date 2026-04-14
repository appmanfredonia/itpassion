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
    <Card className="border-border/70 bg-background/60">
      <CardContent className="flex flex-col gap-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              {profile.avatarUrl && (
                <AvatarImage src={profile.avatarUrl} alt={`Avatar di @${profile.username}`} />
              )}
              <AvatarFallback>{avatarFallback(profile.username)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <p className="text-lg font-semibold">{profile.displayName}</p>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>
          </div>
          {actionSlot}
        </div>

        <p className="text-sm text-muted-foreground">
          {profile.bio ?? "Bio non impostata."}
        </p>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-border/70 bg-card/70 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Post</p>
            <p className="text-lg font-semibold">{counters.postsCount}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-card/70 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Follower</p>
            <p className="text-lg font-semibold">{counters.followersCount}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-card/70 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Seguiti</p>
            <p className="text-lg font-semibold">{counters.followingCount}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {passions.length === 0 ? (
            <Badge variant="outline">Nessuna passione selezionata</Badge>
          ) : (
            passions.map((passion) => (
              <Badge key={passion.slug} variant="outline">
                {passion.name}
              </Badge>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
