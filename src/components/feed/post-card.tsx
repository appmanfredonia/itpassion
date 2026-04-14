import Link from "next/link";
import {
  addCommentAction,
  deleteCommentAction,
  toggleLikeAction,
  toggleSavePostAction,
} from "@/app/(app)/feed/actions";
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
    <Card id={`post-${post.id}`} className="border-border/70 bg-background/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar>
              {post.authorAvatarUrl && (
                <AvatarImage src={post.authorAvatarUrl} alt={`Avatar di @${post.authorUsername}`} />
              )}
              <AvatarFallback>{avatarFallback(post.authorUsername)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <Link
                href={`/profile/${post.authorUsername}`}
                className="text-sm font-medium hover:text-primary"
              >
                @{post.authorUsername}
              </Link>
              <p className="text-xs text-muted-foreground">{formatCreatedAt(post.createdAt)}</p>
            </div>
          </div>
          <Link href={`/explore?passion=${post.passionSlug}`}>
            <Badge variant="outline">{post.passionName}</Badge>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {post.textContent && <p className="text-sm text-muted-foreground">{post.textContent}</p>}

        {post.media.length > 0 && (
          <div className="flex flex-col gap-2">
            {post.media.map((mediaItem) => (
              <div
                key={`${post.id}-${mediaItem.url}`}
                className="rounded-lg border border-border/70 bg-card/70 p-3"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {mediaItem.kind}
                </p>
                <a
                  href={mediaItem.url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-sm text-primary hover:underline"
                >
                  {mediaItem.url}
                </a>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/feed?post=${post.id}`} className="text-xs text-primary hover:underline">
            Apri post
          </Link>

          <form action={toggleLikeAction}>
            <input type="hidden" name="postId" value={post.id} />
            <input type="hidden" name="returnPath" value={returnPath} />
            <Button type="submit" size="xs" variant={post.likedByMe ? "secondary" : "ghost"}>
              {post.likedByMe ? "Ti piace" : "Mi piace"} ({post.likesCount})
            </Button>
          </form>

          <form action={toggleSavePostAction}>
            <input type="hidden" name="postId" value={post.id} />
            <input type="hidden" name="returnPath" value={returnPath} />
            <Button type="submit" size="xs" variant={post.savedByMe ? "secondary" : "ghost"}>
              {post.savedByMe ? "Salvato" : "Salva"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground">Commenti: {post.commentsCount}</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card/70 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Commenti
          </p>

          {post.comments.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nessun commento al momento.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {post.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex items-start justify-between gap-3 rounded-md border border-border/70 bg-background/70 p-2"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <Link
                      href={`/profile/${comment.authorUsername}`}
                      className="truncate text-xs font-medium hover:text-primary"
                    >
                      @{comment.authorUsername}
                    </Link>
                    <p className="text-sm text-muted-foreground">{comment.content}</p>
                  </div>
                  {comment.canDelete && (
                    <form action={deleteCommentAction}>
                      <input type="hidden" name="commentId" value={comment.id} />
                      <input type="hidden" name="returnPath" value={returnPath} />
                      <Button type="submit" variant="ghost" size="xs">
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
