import Link from "next/link";
import { ArrowUpRight, Bookmark, Heart, MessageCircle, Trash2 } from "lucide-react";
import {
  addCommentAction,
  deleteCommentAction,
  toggleLikeAction,
  toggleSavePostAction,
} from "@/app/(app)/feed/actions";
import { PostMediaGallery } from "@/components/feed/post-media-gallery";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { FeedPost } from "@/lib/feed";
import { cn } from "@/lib/utils";

type PostCardProps = {
  post: FeedPost;
  returnPath: string;
  commentPreviewLimit?: number;
};

function formatCreatedAt(isoDate: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoDate));
}

function avatarFallback(username: string): string {
  const normalized = username.replace("@", "").trim();
  if (normalized.length === 0) {
    return "IT";
  }

  return normalized.slice(0, 2).toUpperCase();
}

export function PostCard({
  post,
  returnPath,
  commentPreviewLimit = 1,
}: PostCardProps) {
  const hiddenCommentsCount = Math.max(post.comments.length - commentPreviewLimit, 0);

  return (
    <Card id={`post-${post.id}`} className="surface-panel rounded-[1.8rem] border-border/80 bg-card/85 py-2.5">
      <CardHeader className="pb-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar size="lg">
              {post.authorAvatarUrl && (
                <AvatarImage src={post.authorAvatarUrl} alt={`Avatar di @${post.authorUsername}`} />
              )}
              <AvatarFallback>{avatarFallback(post.authorUsername)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-sm font-semibold tracking-tight">{post.authorDisplayName}</p>
              <Link
                href={`/profile/${post.authorUsername}`}
                className="truncate text-xs text-muted-foreground hover:text-primary"
              >
                @{post.authorUsername}
              </Link>
              <p className="text-[11px] text-muted-foreground/90">{formatCreatedAt(post.createdAt)}</p>
            </div>
          </div>

          <div className="flex max-w-full shrink-0 flex-wrap items-center justify-end gap-1.5">
            <Link href={`/explore?passion=${post.passionSlug}`}>
              <Badge variant="secondary" className="max-w-full border-primary/20 bg-primary/10 text-primary">
                {post.passionName}
              </Badge>
            </Link>
            <Link
              href={`/feed?post=${post.id}`}
              className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-black/16 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Apri
              <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {post.textContent && (
          <p className="px-0.5 text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground/95 [overflow-wrap:anywhere]">
            {post.textContent}
          </p>
        )}

        <div className="-mx-4 sm:mx-0">
          <PostMediaGallery contentType={post.contentType} media={post.media} />
        </div>

        <div className="surface-soft flex flex-wrap items-center gap-2 rounded-[1.35rem] border-border/80 bg-black/14 p-2.5">
          <form action={toggleLikeAction}>
            <input type="hidden" name="postId" value={post.id} />
            <input type="hidden" name="returnPath" value={returnPath} />
            <Button type="submit" size="xs" variant={post.likedByMe ? "secondary" : "ghost"}>
              <Heart className={post.likedByMe ? "fill-current" : ""} />
              {post.likesCount}
            </Button>
          </form>

          <form action={toggleSavePostAction}>
            <input type="hidden" name="postId" value={post.id} />
            <input type="hidden" name="returnPath" value={returnPath} />
            <Button type="submit" size="xs" variant={post.savedByMe ? "secondary" : "ghost"}>
              <Bookmark className={post.savedByMe ? "fill-current" : ""} />
              {post.savedByMe ? "Salvato" : "Salva"}
            </Button>
          </form>

          <p className="ml-auto min-w-0 truncate text-right text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-3.5" />
            {post.commentsCount} commenti
            </span>
          </p>
        </div>

        <div className="surface-soft flex flex-col gap-2.5 rounded-[1.45rem] border-border/80 bg-surface-1/95 p-3">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Commenti
          </p>

          {post.comments.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nessun commento al momento.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {post.comments.map((comment, index) => (
                <div
                  key={comment.id}
                  className={cn(
                    "flex-col gap-2 rounded-2xl border border-border/80 bg-black/12 px-3 py-2.5 sm:flex-row sm:items-start sm:justify-between",
                    index < commentPreviewLimit ? "flex" : "hidden sm:flex",
                  )}
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <Link
                      href={`/profile/${comment.authorUsername}`}
                      className="truncate text-xs font-semibold tracking-tight hover:text-primary"
                    >
                      @{comment.authorUsername}
                    </Link>
                    <p className="text-sm leading-relaxed break-words text-foreground/90 [overflow-wrap:anywhere]">
                      {comment.content}
                    </p>
                  </div>
                  {comment.canDelete && (
                    <form action={deleteCommentAction} className="self-start">
                      <input type="hidden" name="commentId" value={comment.id} />
                      <input type="hidden" name="returnPath" value={returnPath} />
                      <Button type="submit" variant="ghost" size="xs">
                        <Trash2 />
                        Elimina
                      </Button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}

          {hiddenCommentsCount > 0 ? (
            <p className="text-[11px] text-muted-foreground">
              {hiddenCommentsCount === 1
                ? "1 commento in piu visibile aprendo il post."
                : `${hiddenCommentsCount} commenti in piu visibili aprendo il post.`}
            </p>
          ) : null}

          <form action={addCommentAction} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input type="hidden" name="postId" value={post.id} />
            <input type="hidden" name="returnPath" value={returnPath} />
            <Input
              name="commentContent"
              placeholder="Aggiungi un commento..."
              maxLength={500}
              autoComplete="off"
              className="flex-1"
            />
            <Button type="submit" size="sm" variant="secondary" className="sm:shrink-0">
              Invia
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
