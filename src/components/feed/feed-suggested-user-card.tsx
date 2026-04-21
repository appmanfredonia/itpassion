import Link from "next/link";
import { MapPin, Sparkles } from "lucide-react";
import { toggleFollowAction } from "@/app/(app)/profile/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import type { FeedSuggestedUser } from "@/lib/feed";
import { cn } from "@/lib/utils";

type FeedSuggestedUserCardProps = {
  user: FeedSuggestedUser;
  returnPath: string;
};

function avatarFallback(username: string): string {
  const normalized = username.trim();
  if (normalized.length === 0) {
    return "IT";
  }

  return normalized.slice(0, 2).toUpperCase();
}

export function FeedSuggestedUserCard({
  user,
  returnPath,
}: FeedSuggestedUserCardProps) {
  const locationLabel = user.city && user.province ? `${user.city}, ${user.province}` : user.province ?? user.city ?? "Provincia in completamento";

  return (
    <article className="surface-panel flex flex-col gap-3 rounded-[1.5rem] border-border/80 bg-card/92 p-3.5">
      <div className="flex items-start gap-3">
        <Avatar size="lg">
          {user.avatarUrl ? (
            <AvatarImage src={user.avatarUrl} alt={`Avatar di @${user.username}`} />
          ) : null}
          <AvatarFallback>{avatarFallback(user.username)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold tracking-tight text-foreground">
            {user.displayName}
          </p>
          <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-black/16 px-1.75 py-0.75 text-[10.5px] text-muted-foreground">
              <MapPin className="size-3" />
              {locationLabel}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-1.75 py-0.75 text-[10.5px] font-medium text-primary">
              <Sparkles className="size-3" />
              {user.overlapCount === 1
                ? "1 passione in comune"
                : `${user.overlapCount} passioni in comune`}
            </span>
          </div>
        </div>
      </div>

      {user.bio ? (
        <p className="text-xs leading-relaxed text-foreground/82 [overflow-wrap:anywhere]">
          {user.bio}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {user.commonPassions.map((passion) => (
          <span
            key={`${user.userId}-${passion.slug}`}
            className="rounded-full border border-primary/18 bg-primary/8 px-2 py-0.75 text-[10.5px] font-medium text-primary"
          >
            {passion.name}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <form action={toggleFollowAction}>
          <input type="hidden" name="targetUserId" value={user.userId} />
          <input type="hidden" name="returnPath" value={returnPath} />
          <Button type="submit" size="sm" className="w-full justify-center">
            Segui
          </Button>
        </form>
        <Link
          href={`/profile/${user.username}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full justify-center")}
        >
          Apri profilo
        </Link>
      </div>
    </article>
  );
}
