import Link from "next/link";
import {
  ArrowUpRight,
  Bookmark,
  Heart,
  MessageCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  deletePostAction,
  toggleLikeAction,
  toggleSavePostAction,
} from "@/app/(app)/feed/actions";
import { ConfirmSubmitButton } from "@/components/feed/confirm-submit-button";
import { PostComments } from "@/components/feed/post-comments";
import { PostMediaGallery } from "@/components/feed/post-media-gallery";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  return (
    <Card
      id={`post-${post.id}`}
      className="surface-panel rounded-[1.6rem] border-border/80 bg-card/88 py-1.5"
    >
      <CardHeader className="pb-1.5">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar>
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

          <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-auto sm:max-w-[24rem] sm:items-end">
            <Link href={`/explore?passion=${post.passionSlug}`}>
              <Badge
                variant="secondary"
                className="max-w-full self-start border-primary/20 bg-primary/10 text-primary sm:self-auto"
              >
                {post.passionName}
              </Badge>
            </Link>

            <div
              className={cn(
                "grid w-full gap-1.5 sm:w-auto",
                post.canManage ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1",
              )}
            >
              <Link
                href={`/feed?post=${post.id}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "xs" }),
                  "min-w-0 justify-center rounded-full border-border/80 bg-black/16 px-3 text-muted-foreground hover:text-foreground",
                )}
              >
                Apri
                <ArrowUpRight className="size-3" />
              </Link>

              {post.canManage ? (
                <>
                  <Link
                    href={`/create?edit=${post.id}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "xs" }),
                      "min-w-0 justify-center rounded-full border-border/80 bg-black/16 px-3 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Pencil className="size-3" />
                    Modifica
                  </Link>

                  <form action={deletePostAction} className="col-span-2 sm:col-span-1">
                    <input type="hidden" name="postId" value={post.id} />
                    <input type="hidden" name="returnPath" value={returnPath} />
                    <ConfirmSubmitButton
                      type="submit"
                      variant="destructive"
                      size="xs"
                      className="w-full justify-center rounded-full"
                      confirmMessage="Vuoi davvero eliminare questo post? L'azione non si puo annullare."
                    >
                      <Trash2 />
                      Elimina
                    </ConfirmSubmitButton>
                  </form>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-2.5">
        {post.textContent && (
          <p className="px-0.5 text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground/95 [overflow-wrap:anywhere]">
            {post.textContent}
          </p>
        )}

        <div className="-mx-4 sm:mx-0">
          <PostMediaGallery contentType={post.contentType} media={post.media} />
        </div>

        <div className="surface-soft flex flex-wrap items-center gap-2 rounded-[1.2rem] border-border/80 bg-black/14 p-2">
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

        <PostComments
          postId={post.id}
          comments={post.comments}
          returnPath={returnPath}
          commentPreviewLimit={commentPreviewLimit}
        />
      </CardContent>
    </Card>
  );
}
