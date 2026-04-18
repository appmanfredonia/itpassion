"use client";

import Link from "next/link";
import { useState } from "react";
import { Bookmark, Heart, MessageCircle, Pencil, Trash2 } from "lucide-react";
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
  commentPreviewLimit = 0,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const commentsRegionId = `post-comments-${post.id}`;
  const feedActionClass =
    "h-6 min-w-[3.4rem] gap-1 px-1.5 text-[10px] [&_svg]:size-[10px]";
  const activeFeedActionClass =
    "border-primary/25 bg-primary/12 text-primary shadow-none hover:bg-primary/16 hover:text-primary";
  const postActionClass = cn(
    buttonVariants({ variant: "outline", size: "xs" }),
    "h-5 min-w-0 justify-center gap-0.75 rounded-full border-border/80 bg-black/12 px-1.25 text-[9.5px] font-medium text-muted-foreground shadow-none hover:bg-black/18 hover:text-foreground [&_svg]:size-[9px]",
  );

  return (
    <Card
      id={`post-${post.id}`}
      className="surface-panel rounded-[1.15rem] border-border/80 bg-card/88"
    >
      <CardHeader className="pb-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar size="sm">
              {post.authorAvatarUrl && (
                <AvatarImage src={post.authorAvatarUrl} alt={`Avatar di @${post.authorUsername}`} />
              )}
              <AvatarFallback>{avatarFallback(post.authorUsername)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col leading-tight">
              <p className="truncate text-[11px] font-semibold tracking-tight">{post.authorDisplayName}</p>
              <Link
                href={`/profile/${post.authorUsername}`}
                className="truncate text-[9.5px] text-muted-foreground hover:text-primary"
              >
                @{post.authorUsername}
              </Link>
              <p className="text-[9px] text-muted-foreground/90">{formatCreatedAt(post.createdAt)}</p>
            </div>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-1 sm:w-auto sm:max-w-[20rem] sm:items-end">
            {post.canManage ? (
              <div className="grid w-full min-w-0 grid-cols-[minmax(0,max-content)_auto_auto] items-center gap-1 sm:w-auto">
                <Link href={`/explore?passion=${post.passionSlug}`} className="min-w-0">
                  <Badge
                    variant="secondary"
                    className="max-w-[7rem] justify-center truncate border-primary/20 bg-primary/10 text-primary sm:justify-start"
                  >
                    {post.passionName}
                  </Badge>
                </Link>

                <Link href={`/create?edit=${post.id}`} className={postActionClass}>
                  <Pencil className="size-3" />
                  Modifica
                </Link>

                <form action={deletePostAction} className="min-w-0">
                  <input type="hidden" name="postId" value={post.id} />
                  <input type="hidden" name="returnPath" value={returnPath} />
                  <ConfirmSubmitButton
                    type="submit"
                    variant="destructive"
                    size="xs"
                    className="h-5 w-auto justify-center gap-0.75 rounded-full px-1.25 text-[9.5px] font-medium shadow-none [&_svg]:size-[9px]"
                    confirmMessage="Vuoi davvero eliminare questo post? L'azione non si puo annullare."
                  >
                    <Trash2 />
                    Elimina
                  </ConfirmSubmitButton>
                </form>
              </div>
            ) : (
              <Link href={`/explore?passion=${post.passionSlug}`} className="self-start sm:self-auto">
                <Badge
                  variant="secondary"
                  className="max-w-[7rem] border-primary/20 bg-primary/10 text-primary"
                >
                  {post.passionName}
                </Badge>
              </Link>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        {post.textContent && (
          <p className="px-0.5 text-[11px] leading-[1.42] whitespace-pre-wrap break-words text-foreground/95 [overflow-wrap:anywhere]">
            {post.textContent}
          </p>
        )}

        <div className="px-0.5">
          <PostMediaGallery post={post} />
        </div>

        <div className="flex items-center justify-between gap-2 px-0.5 pt-0.5">
          <form action={toggleLikeAction}>
            <input type="hidden" name="postId" value={post.id} />
            <input type="hidden" name="returnPath" value={returnPath} />
            <Button
              type="submit"
              size="xs"
              variant={post.likedByMe ? "secondary" : "ghost"}
              className={cn(
                feedActionClass,
                "min-w-[3rem]",
                post.likedByMe ? activeFeedActionClass : "text-muted-foreground",
              )}
            >
              <Heart className={post.likedByMe ? "fill-current" : ""} />
              {post.likesCount}
            </Button>
          </form>

          <Button
            type="button"
            size="xs"
            variant={post.commentedByMe ? "secondary" : "ghost"}
            aria-expanded={showComments}
            aria-controls={commentsRegionId}
            onClick={() => setShowComments((current) => !current)}
            className={cn(
              feedActionClass,
              post.commentedByMe ? activeFeedActionClass : "text-muted-foreground",
            )}
          >
            <MessageCircle className={cn("size-[10px]", post.commentedByMe && "fill-current")} />
            {post.commentsCount}
          </Button>

          <form action={toggleSavePostAction}>
            <input type="hidden" name="postId" value={post.id} />
            <input type="hidden" name="returnPath" value={returnPath} />
            <Button
              type="submit"
              size="xs"
              variant={post.savedByMe ? "secondary" : "ghost"}
              className={cn(
                feedActionClass,
                post.savedByMe ? activeFeedActionClass : "text-muted-foreground",
              )}
            >
              <Bookmark className={post.savedByMe ? "fill-current" : ""} />
              {post.savedByMe ? "Salvato" : "Salva"}
            </Button>
          </form>
        </div>

        {showComments ? (
          <div id={commentsRegionId} className="px-0.5 pt-0.5">
            <PostComments
              postId={post.id}
              comments={post.comments}
              returnPath={returnPath}
              commentPreviewLimit={commentPreviewLimit}
              showToggle={false}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
