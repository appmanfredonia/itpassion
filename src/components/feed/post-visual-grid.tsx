import Link from "next/link";
import { Bookmark, Heart, MessageCircle, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { FeedPost } from "@/lib/feed";
import { cn } from "@/lib/utils";

type PostVisualGridProps = {
  posts: FeedPost[];
  columns?: 2 | 3;
  dense?: boolean;
};

function firstRenderableMedia(post: FeedPost): FeedPost["media"][number] | null {
  return post.media.find((item) => item.url.trim().length > 0) ?? null;
}

function formatDateLabel(value: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export function PostVisualGrid({
  posts,
  columns = 3,
  dense = false,
}: PostVisualGridProps) {
  return (
    <div
      className={cn(
        "grid gap-3",
        columns === 2 ? "grid-cols-2" : "grid-cols-3",
      )}
    >
      {posts.map((post) => {
        const media = firstRenderableMedia(post);
        const href = `/feed?post=${post.id}`;

        return (
          <Link
            key={post.id}
            href={href}
            className={cn(
              "group relative overflow-hidden rounded-[1.45rem] border border-border/80 bg-surface-1 shadow-[0_18px_34px_-24px_oklch(0_0_0_/_0.92)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_24px_44px_-26px_oklch(0.73_0.16_294_/_0.7)]",
              dense ? "aspect-[0.8]" : "aspect-square",
            )}
          >
            {media ? (
              <div className="relative h-full w-full">
                {media.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={media.url}
                    alt={post.textContent ?? `Post di @${post.authorUsername}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <video
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  >
                    <source src={media.url} />
                  </video>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/14 to-transparent" />
                {media.kind === "video" ? (
                  <span className="absolute right-2.5 top-2.5 inline-flex size-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm">
                    <Play className="size-3.5 fill-current" />
                  </span>
                ) : null}
              </div>
            ) : (
              <div className="flex h-full flex-col justify-between bg-[radial-gradient(circle_at_top,oklch(0.73_0.16_294_/_0.2),transparent_38%),linear-gradient(180deg,oklch(0.18_0.03_272),oklch(0.12_0.02_272))] p-3">
                <Badge
                  variant="secondary"
                  className="w-fit border-primary/20 bg-primary/10 text-primary"
                >
                  {post.passionName}
                </Badge>
                <p className="line-clamp-4 text-sm font-medium leading-snug text-white/92">
                  {post.textContent?.trim() || "Contenuto testuale"}
                </p>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <Badge
                  variant="secondary"
                  className="border-white/10 bg-black/35 text-white backdrop-blur-sm"
                >
                  {post.passionName}
                </Badge>
                <span className="text-[10px] font-medium tracking-[0.14em] text-white/80 uppercase">
                  {formatDateLabel(post.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-white/82">
                <span className="inline-flex items-center gap-1">
                  <Heart className="size-3" />
                  {post.likesCount}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="size-3" />
                  {post.commentsCount}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Bookmark className="size-3" />
                  {post.savedByMe ? "On" : "Off"}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
