"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bookmark, Heart, MessageCircle, Play } from "lucide-react";
import { MediaViewer } from "@/components/media/media-viewer";
import { Badge } from "@/components/ui/badge";
import type { FeedPost } from "@/lib/feed";
import { getFirstRenderablePostMedia } from "@/lib/media";
import { cn } from "@/lib/utils";

type PostVisualGridProps = {
  posts: FeedPost[];
  columns?: 2 | 3;
  dense?: boolean;
};

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
  const [postItems, setPostItems] = useState(posts);
  const [viewerPostId, setViewerPostId] = useState<string | null>(null);
  const denseAspectClass =
    columns === 2
      ? "aspect-[0.9] sm:aspect-[1.08] xl:aspect-[1.16]"
      : "aspect-[0.9] sm:aspect-[0.98]";
  const denseTextAspectClass =
    columns === 2
      ? "aspect-[1.08] sm:aspect-[1.26] xl:aspect-[1.42]"
      : "aspect-[1.1] sm:aspect-[1.2]";

  useEffect(() => {
    setPostItems(posts);
  }, [posts]);

  const viewerPost = useMemo(
    () => postItems.find((post) => post.id === viewerPostId) ?? null,
    [postItems, viewerPostId],
  );

  return (
    <>
      <div
        className={cn(
          "grid gap-2.5 sm:gap-3",
          columns === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3",
        )}
      >
        {postItems.map((post) => {
          const media = getFirstRenderablePostMedia(post);
          const href = `/feed?post=${post.id}`;
          const cardClass = cn(
            "group relative overflow-hidden rounded-[1.35rem] border border-border/80 bg-surface-1 shadow-[0_18px_34px_-24px_oklch(0_0_0_/_0.92)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_24px_44px_-26px_oklch(0.73_0.16_294_/_0.7)]",
            dense ? (media ? denseAspectClass : denseTextAspectClass) : "aspect-square",
          );

          if (media) {
            return (
              <button
                key={post.id}
                type="button"
                onClick={() => setViewerPostId(post.id)}
                className={cn(cardClass, "text-left")}
                aria-label={`Apri il media del post di @${post.authorUsername}`}
              >
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
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/88 via-black/20 to-transparent" />
                  {media.kind === "video" ? (
                    <span className="absolute right-2.5 top-2.5 inline-flex size-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm">
                      <Play className="size-3.5 fill-current" />
                    </span>
                  ) : null}
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-2.5">
                    <Badge
                      variant="secondary"
                      className="max-w-[70%] truncate border-white/10 bg-black/35 text-white backdrop-blur-sm"
                    >
                      {post.passionName}
                    </Badge>
                    <span className="shrink-0 text-[10px] font-medium tracking-[0.14em] text-white/80 uppercase">
                      {formatDateLabel(post.createdAt)}
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-2.5 text-[11px] text-white/82">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="inline-flex items-center gap-1">
                        <Heart className={cn("size-3", post.likedByMe && "fill-current")} />
                        {post.likesCount}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle className={cn("size-3", post.commentedByMe && "fill-current")} />
                        {post.commentsCount}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1">
                      <Bookmark className={cn("size-3", post.savedByMe && "fill-current")} />
                    </span>
                  </div>
                </div>
              </button>
            );
          }

          return (
            <Link key={post.id} href={href} className={cardClass}>
              <div className="flex h-full flex-col gap-3 bg-[radial-gradient(circle_at_top,oklch(0.73_0.16_294_/_0.2),transparent_38%),linear-gradient(180deg,oklch(0.18_0.03_272),oklch(0.12_0.02_272))] p-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="secondary"
                    className="max-w-[70%] truncate border-primary/20 bg-primary/10 text-primary"
                  >
                    {post.passionName}
                  </Badge>
                  <span className="shrink-0 text-[10px] font-medium tracking-[0.14em] text-white/80 uppercase">
                    {formatDateLabel(post.createdAt)}
                  </span>
                </div>
                <p className="line-clamp-5 flex-1 text-sm font-medium leading-snug break-words text-white/92 [overflow-wrap:anywhere]">
                  {post.textContent?.trim() || "Contenuto testuale"}
                </p>
                <div className="flex items-center justify-between gap-2 text-[11px] text-white/82">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="inline-flex items-center gap-1">
                      <Heart className={cn("size-3", post.likedByMe && "fill-current")} />
                      {post.likesCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className={cn("size-3", post.commentedByMe && "fill-current")} />
                      {post.commentsCount}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1">
                    <Bookmark className={cn("size-3", post.savedByMe && "fill-current")} />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {viewerPost ? (
        <MediaViewer
          open
          onClose={() => setViewerPostId(null)}
          post={viewerPost}
          initialIndex={0}
          postHref={`/feed?post=${viewerPost.id}`}
          onPostUpdate={(nextPost) =>
            setPostItems((currentPosts) =>
              currentPosts.map((currentPost) =>
                currentPost.id === nextPost.id ? nextPost : currentPost,
              ),
            )
          }
        />
      ) : null}
    </>
  );
}
