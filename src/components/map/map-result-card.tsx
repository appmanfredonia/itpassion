import Link from "next/link";
import { ArrowUpRight, MapPin, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import type { MapUserMatch } from "@/lib/map";
import { formatLocationLabel } from "@/lib/location";
import { cn } from "@/lib/utils";

type MapResultCardProps = {
  result: MapUserMatch;
};

function avatarFallback(username: string): string {
  const normalized = username.trim();
  if (normalized.length === 0) {
    return "IT";
  }

  return normalized.slice(0, 2).toUpperCase();
}

export function MapResultCard({ result }: MapResultCardProps) {
  const locationLabel = formatLocationLabel(result) ?? "Area non completata";
  const sharedPassionsLabel =
    result.overlapCount === 1 ? "1 passione in comune" : `${result.overlapCount} passioni in comune`;

  return (
    <article className="surface-panel flex flex-col gap-3 rounded-[1.5rem] border-border/80 bg-card/92 p-3.5">
      <div className="flex items-start gap-3">
        <Avatar size="lg">
          {result.avatarUrl ? (
            <AvatarImage src={result.avatarUrl} alt={`Avatar di @${result.username}`} />
          ) : null}
          <AvatarFallback>{avatarFallback(result.username)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="truncate text-sm font-semibold tracking-tight">{result.displayName}</p>
            <p className="truncate text-xs text-muted-foreground">@{result.username}</p>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-black/16 px-2 py-1 text-[11px] text-muted-foreground">
              <MapPin className="size-3" />
              {locationLabel}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
              <Sparkles className="size-3" />
              {sharedPassionsLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {result.commonPassions.map((passion) => (
          <span
            key={`${result.userId}-${passion.slug}`}
            className="rounded-full border border-primary/18 bg-primary/8 px-2.5 py-1 text-[11px] font-medium text-primary"
          >
            {passion.name}
          </span>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        <Link
          href={`/profile/${result.username}`}
          className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "w-full justify-center")}
        >
          Apri profilo
          <ArrowUpRight className="size-3.5" />
        </Link>
        <div className="flex items-center justify-center rounded-xl border border-border/70 bg-black/12 px-3 py-2 text-[11px] text-muted-foreground sm:justify-start xl:justify-center">
          Presenza approssimata nella tua provincia
        </div>
      </div>
    </article>
  );
}
