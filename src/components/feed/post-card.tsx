"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bookmark, Heart, MessageCircle, Pencil, Trash2 } from "lucide-react";
import {
  deletePostAction,
  toggleLikeAction,
  toggleSavePostAction,
} from "@/app/(app)/feed/actions";
import { ConfirmSubmitButton } from "@/components/feed/confirm-submit-button";
import { PostEditModal } from "@/components/feed/post-edit-modal";
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
  const [postState, setPostState] = useState(post);
  const [showComments, setShowComments] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const commentsRegionId = `post-comments-${post.id}`;
  const commentButtonRef = useRef<HTMLButtonElement>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const feedActionClass =
    "h-[22px] min-w-[2.8rem] gap-1 px-1.5 text-[10px] [&_svg]:size-[10px] sm:h-6 sm:min-w-[3.4rem]";
  const activeFeedActionClass =
    "border-primary/25 bg-primary/12 text-primary shadow-none hover:bg-primary/16 hover:text-primary";
  const postActionClass = cn(
    buttonVariants({ variant: "outline", size: "xs" }),
    "h-[18px] min-w-0 justify-center gap-0.5 rounded-full border-border/80 bg-black/12 px-1.5 text-[9px] font-medium text-muted-foreground shadow-none hover:bg-black/18 hover:text-foreground sm:h-5 sm:gap-0.75 sm:px-1.25 sm:text-[9.5px] [&_svg]:size-[9px]",
  );

  useEffect(() => {
    setPostState(post);
  }, [post]);

  useEffect(() => {
    if (!showComments) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }

      if (commentButtonRef.current?.contains(target) || commentsContainerRef.current?.contains(target)) {
        return;
      }

      setShowComments(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [showComments]);

  return (
    <>
      <Card
        id={`post-${post.id}`}
        className="surface-panel overflow-hidden rounded-[1.35rem] border-border/80 bg-card/92 shadow-[0_24px_44px_-32px_oklch(0_0_0_/_0.95)]"
      >
        <CardHeader className="gap-2.5 px-3.5 pb-2.5 pt-3.5 sm:gap-3 sm:px-5 sm:pb-3 sm:pt-4">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
              <Avatar className="size-7 sm:size-8">
                {postState.authorAvatarUrl && (
                  <AvatarImage src={postState.authorAvatarUrl} alt={`Avatar di @${postState.authorUsername}`} />
                )}
                <AvatarFallback>{avatarFallback(postState.authorUsername)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-[13px] font-semibold tracking-tight text-foreground sm:text-sm">
                  {postState.authorDisplayName}
                </p>
                <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] leading-tight text-muted-foreground sm:text-[11px]">
                  <Link
                    href={`/profile/${postState.authorUsername}`}
                    className="max-w-full truncate hover:text-primary"
                  >
                    @{postState.authorUsername}
                  </Link>
                  <span className="text-white/18">/</span>
                  <p className="whitespace-nowrap">{formatCreatedAt(postState.createdAt)}</p>
                </div>
              </div>
            </div>

            <div className="inline-grid max-w-full shrink-0 gap-1.5 self-start sm:w-auto sm:min-w-[11.5rem] md:min-w-[12.5rem] sm:justify-items-end">
              <Link
                href={`/explore?passion=${postState.passionSlug}`}
                className="min-w-0 max-w-full justify-self-start sm:justify-self-end"
              >
                <Badge
                  variant="secondary"
                  className="h-[18px] max-w-full border-primary/20 bg-primary/10 px-1.5 text-[9px] text-primary sm:h-5 sm:px-2 sm:text-[10.5px]"
                >
                  {postState.passionName}
                </Badge>
              </Link>

              {postState.canManage ? (
                <div className="inline-grid grid-cols-2 gap-1.25 sm:gap-1.5">
                  <button
                    type="button"
                    className={cn(postActionClass, "min-w-0 whitespace-nowrap")}
                    onClick={() => setShowEditModal(true)}
                  >
                    <Pencil className="size-3" />
                    Modifica
                  </button>

                  <form action={deletePostAction} className="min-w-0">
                    <input type="hidden" name="postId" value={postState.id} />
                    <input type="hidden" name="returnPath" value={returnPath} />
                    <ConfirmSubmitButton
                      type="submit"
                      variant="destructive"
                      size="xs"
                      className="h-[18px] min-w-0 justify-center gap-0.5 rounded-full px-1.5 text-[9px] font-medium whitespace-nowrap shadow-none sm:h-5 sm:gap-0.75 sm:px-1.25 sm:text-[9.5px] [&_svg]:size-[9px]"
                      confirmMessage="Vuoi davvero eliminare questo post? L'azione non si puo annullare."
                    >
                      <Trash2 />
                      Elimina
                    </ConfirmSubmitButton>
                  </form>
                </div>
              ) : null}
            </div>
          </div>

          {postState.textContent ? (
            <p className="text-[12.5px] leading-[1.5] whitespace-pre-wrap break-words text-foreground/92 [overflow-wrap:anywhere] sm:text-[13px] sm:leading-[1.55]">
              {postState.textContent}
            </p>
          ) : null}
        </CardHeader>

        <CardContent className="flex flex-col gap-2.5 px-3.5 pb-3.5 pt-0 sm:gap-3 sm:px-4 sm:pb-4">
          <PostMediaGallery
            post={postState}
            onPostUpdate={(nextPost) => setPostState(nextPost)}
          />

          <div className="flex items-center justify-between gap-1.5 border-t border-white/6 pt-2 sm:gap-2">
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <form action={toggleLikeAction}>
                <input type="hidden" name="postId" value={postState.id} />
                <input type="hidden" name="returnPath" value={returnPath} />
                <Button
                  type="submit"
                  size="xs"
                  variant={postState.likedByMe ? "secondary" : "ghost"}
                  className={cn(
                    feedActionClass,
                    "min-w-[3rem]",
                    postState.likedByMe ? activeFeedActionClass : "text-muted-foreground",
                  )}
                >
                  <Heart className={postState.likedByMe ? "fill-current" : ""} />
                  {postState.likesCount}
                </Button>
              </form>

              <Button
                ref={commentButtonRef}
                type="button"
                size="xs"
                variant={postState.commentedByMe ? "secondary" : "ghost"}
                aria-expanded={showComments}
                aria-controls={commentsRegionId}
                onClick={() => setShowComments((current) => !current)}
                className={cn(
                  feedActionClass,
                  postState.commentedByMe ? activeFeedActionClass : "text-muted-foreground",
                )}
              >
                <MessageCircle className={cn("size-[10px]", postState.commentedByMe && "fill-current")} />
                {postState.commentsCount}
              </Button>

              <form action={toggleSavePostAction}>
                <input type="hidden" name="postId" value={postState.id} />
                <input type="hidden" name="returnPath" value={returnPath} />
                <Button
                  type="submit"
                  size="xs"
                  variant={postState.savedByMe ? "secondary" : "ghost"}
                  className={cn(
                    feedActionClass,
                    postState.savedByMe ? activeFeedActionClass : "text-muted-foreground",
                  )}
                >
                  <Bookmark className={postState.savedByMe ? "fill-current" : ""} />
                  {postState.savedByMe ? "Salvato" : "Salva"}
                </Button>
              </form>
            </div>
          </div>

          {showComments ? (
            <div
              id={commentsRegionId}
              ref={commentsContainerRef}
              className="pt-0.5"
            >
              <PostComments
                postId={postState.id}
                comments={postState.comments}
                returnPath={returnPath}
                commentPreviewLimit={commentPreviewLimit}
                showToggle={false}
                onCommentsChange={(nextComments) => {
                  setPostState((currentPost) => ({
                    ...currentPost,
                    comments: nextComments,
                    commentsCount: nextComments.length,
                    commentedByMe: nextComments.some((comment) => comment.canEdit),
                  }));
                }}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      {showEditModal ? (
        <PostEditModal
          open
          onClose={() => setShowEditModal(false)}
          post={postState}
          onPostUpdate={(nextPost) => {
            setPostState(nextPost);
          }}
        />
      ) : null}
    </>
  );
}

