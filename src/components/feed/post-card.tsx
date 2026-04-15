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

type PostCardProps = {
  post: FeedPost;
  returnPath: string;
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

export function PostCard({ post, returnPath }: PostCardProps) {
  return (
    <Card id={`post-${post.id}`} className="surface-panel">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
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
              <p className="text-[11px] text-muted-foreground">{formatCreatedAt(post.createdAt)}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link href={`/explore?passion=${post.passionSlug}`}>
              <Badge variant="secondary">{post.passionName}</Badge>
            </Link>
            <Link
              href={`/feed?post=${post.id}`}
              className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-surface-1 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Apri
              <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {post.textContent && (
          <p className="text-sm leading-relaxed text-foreground/95">{post.textContent}</p>
        )}

        <PostMediaGallery contentType={post.contentType} media={post.media} />

        <div className="surface-soft flex flex-wrap items-center gap-2 p-2">
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

          <p className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MessageCircle className="size-3.5" />
            {post.commentsCount} commenti
          </p>
        </div>

        <div className="surface-soft flex flex-col gap-3 p-3">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Commenti
          </p>

          {post.comments.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nessun commento al momento.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {post.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border/70 bg-surface-2 px-3 py-2.5"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <Link
                      href={`/profile/${comment.authorUsername}`}
                      className="truncate text-xs font-semibold tracking-tight hover:text-primary"
                    >
                      @{comment.authorUsername}
                    </Link>
                    <p className="text-sm leading-relaxed text-foreground/90">{comment.content}</p>
                  </div>
                  {comment.canDelete && (
                    <form action={deleteCommentAction}>
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

          <form action={addCommentAction} className="flex flex-col gap-2 sm:flex-row">
            <input type="hidden" name="postId" value={post.id} />
            <input type="hidden" name="returnPath" value={returnPath} />
            <Input
              name="commentContent"
              placeholder="Aggiungi un commento..."
              maxLength={500}
              autoComplete="off"
            />
            <Button type="submit" size="xs" variant="secondary">
              Invia
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
