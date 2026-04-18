"use client";

import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import { createPortal } from "react-dom";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Flag,
  Heart,
  Link2,
  MessageCircle,
  MoreHorizontal,
  Share2,
  X,
} from "lucide-react";
import { PostComments } from "@/components/feed/post-comments";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { FeedPost } from "@/lib/feed";
import {
  getMediaTypeLabel,
  getRenderablePostMedia,
} from "@/lib/media";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type MediaViewerProps = {
  open: boolean;
  onClose: () => void;
  post: FeedPost;
  initialIndex?: number;
  postHref?: string;
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

export function MediaViewer({
  open,
  onClose,
  post,
  initialIndex = 0,
  postHref,
}: MediaViewerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const media = useMemo(() => getRenderablePostMedia(post.media), [post.media]);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showReportPrompt, setShowReportPrompt] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [likedByMe, setLikedByMe] = useState(post.likedByMe);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [savedByMe, setSavedByMe] = useState(post.savedByMe);
  const [comments, setComments] = useState(post.comments);
  const [commentedByMe, setCommentedByMe] = useState(post.commentedByMe);
  const [isSubmittingLike, setIsSubmittingLike] = useState(false);
  const [isSubmittingSave, setIsSubmittingSave] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const commentButtonRef = useRef<HTMLButtonElement>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const scrollYRef = useRef(0);
  const touchStartXRef = useRef<number | null>(null);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const currentMedia = media[currentIndex] ?? null;
  const hasMultipleMedia = media.length > 1;
  const effectivePostHref = postHref ?? `/feed?post=${post.id}`;
  const currentReturnPath = searchParams.size > 0 ? `${pathname}?${searchParams.toString()}` : pathname;

  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return;
    }

    scrollYRef.current = window.scrollY;
    const body = document.body;
    const previous = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollYRef.current}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    return () => {
      body.style.overflow = previous.overflow;
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.left = previous.left;
      body.style.right = previous.right;
      body.style.width = previous.width;
      window.scrollTo(0, scrollYRef.current);
    };
  }, [open]);

  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }

      if (!hasMultipleMedia) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setCurrentIndex((value) => (value - 1 + media.length) % media.length);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setCurrentIndex((value) => (value + 1) % media.length);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasMultipleMedia, media.length, onClose, open]);

  useEffect(() => {
    if (!shareFeedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => setShareFeedback(null), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [shareFeedback]);

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

  function showPreviousMedia() {
    if (!hasMultipleMedia) {
      return;
    }

    setCurrentIndex((value) => (value - 1 + media.length) % media.length);
  }

  function showNextMedia() {
    if (!hasMultipleMedia) {
      return;
    }

    setCurrentIndex((value) => (value + 1) % media.length);
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (!hasMultipleMedia || touchStartXRef.current === null) {
      return;
    }

    const touchEndX = event.changedTouches[0]?.clientX;
    if (typeof touchEndX !== "number") {
      touchStartXRef.current = null;
      return;
    }

    const deltaX = touchEndX - touchStartXRef.current;
    touchStartXRef.current = null;

    if (Math.abs(deltaX) < 40) {
      return;
    }

    if (deltaX > 0) {
      showPreviousMedia();
      return;
    }

    showNextMedia();
  }

  async function handleShare() {
    if (!currentMedia || typeof window === "undefined") {
      return;
    }

    const shareUrl = new URL(effectivePostHref, window.location.origin).toString();
    const sharePayload = {
      title: `${post.authorDisplayName} su ItPassion`,
      text: post.textContent?.trim() || `Guarda questo contenuto di @${post.authorUsername} su ItPassion`,
      url: shareUrl,
    };

    try {
      if (typeof navigator.share === "function") {
        await navigator.share(sharePayload);
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setShareFeedback("Link copiato");
    } catch {
      setShareFeedback("Condivisione non riuscita");
    }
  }

  async function copyMediaUrl() {
    if (!currentMedia || typeof navigator.clipboard?.writeText !== "function") {
      setShareFeedback("Link non disponibile");
      return;
    }

    try {
      await navigator.clipboard.writeText(currentMedia.url);
      setShareFeedback("Link media copiato");
      setMenuOpen(false);
    } catch {
      setShareFeedback("Link non disponibile");
    }
  }

  function handleReport() {
    setMenuOpen(false);
    setShowReportPrompt(true);
    setShareFeedback(null);
  }

  async function getViewerUserId(): Promise<string | null> {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      setShareFeedback("Sessione non valida");
      return null;
    }

    return user.id;
  }

  async function handleToggleLike() {
    if (isSubmittingLike) {
      return;
    }

    setIsSubmittingLike(true);
    const userId = await getViewerUserId();
    if (!userId) {
      setIsSubmittingLike(false);
      return;
    }

    const nextLikedState = !likedByMe;
    setLikedByMe(nextLikedState);
    setLikesCount((value) => Math.max(0, value + (nextLikedState ? 1 : -1)));

    const mutation = nextLikedState
      ? supabase.from("likes").insert({ post_id: post.id, user_id: userId })
      : supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", userId);

    const { error } = await mutation;
    if (error) {
      setLikedByMe(!nextLikedState);
      setLikesCount((value) => Math.max(0, value + (nextLikedState ? -1 : 1)));
      setShareFeedback("Interazione non riuscita");
    }

    setIsSubmittingLike(false);
  }

  async function handleToggleSave() {
    if (isSubmittingSave) {
      return;
    }

    setIsSubmittingSave(true);
    const userId = await getViewerUserId();
    if (!userId) {
      setIsSubmittingSave(false);
      return;
    }

    const nextSavedState = !savedByMe;
    setSavedByMe(nextSavedState);

    const mutation = nextSavedState
      ? supabase.from("saved_posts").insert({ post_id: post.id, user_id: userId })
      : supabase.from("saved_posts").delete().eq("post_id", post.id).eq("user_id", userId);

    const { error } = await mutation;
    if (error) {
      setSavedByMe(!nextSavedState);
      setShareFeedback("Salvataggio non riuscito");
    }

    setIsSubmittingSave(false);
  }

  async function handleSubmitReport() {
    if (isSubmittingReport) {
      return;
    }

    setIsSubmittingReport(true);
    window.setTimeout(() => {
      setIsSubmittingReport(false);
      setShowReportPrompt(false);
      setShareFeedback("Segnalazione inviata");
    }, 500);
  }

  if (!open || !currentMedia || typeof document === "undefined") {
    return null;
  }

  const viewerActionClass =
    "inline-flex h-9 items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 text-[11px] font-medium text-white/86 backdrop-blur-sm";
  const activeViewerActionClass =
    "border-primary/30 bg-primary/16 text-white";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Visualizzatore media"
      className="fixed inset-0 z-[120] overflow-hidden bg-black/96 text-white"
    >
      <div className="absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-black/72 via-black/28 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-10 h-44 bg-gradient-to-t from-black/86 via-black/48 to-transparent" />

      <div className="absolute inset-x-0 top-0 z-30 flex items-start justify-between px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.85rem)] md:px-6">
        <Button
          ref={closeButtonRef}
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Chiudi viewer"
          onClick={onClose}
          className="rounded-full border border-white/12 bg-black/34 text-white hover:bg-black/52"
        >
          <X className="size-4" />
        </Button>

        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Azioni media"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
            className="rounded-full border border-white/12 bg-black/34 text-white hover:bg-black/52"
          >
            <MoreHorizontal className="size-4" />
          </Button>

          {menuOpen ? (
            <div className="absolute right-0 top-12 flex min-w-48 flex-col gap-1 rounded-2xl border border-white/12 bg-black/76 p-2 text-sm shadow-[0_18px_42px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl">
              <button
                type="button"
                onClick={copyMediaUrl}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-left text-white/88 transition-colors hover:bg-white/8"
              >
                <Link2 className="size-4" />
                Copia link media
              </button>
              <button
                type="button"
                onClick={handleReport}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-left text-white/88 transition-colors hover:bg-white/8"
              >
                <Flag className="size-4" />
                Segnala
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div
        className="relative flex h-full min-h-0 flex-col"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-4 pt-[calc(env(safe-area-inset-top)+4.25rem)] md:px-8 md:pb-5 md:pt-24">
          <div className="relative flex h-full w-full items-center justify-center">
            {hasMultipleMedia ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Media precedente"
                  onClick={showPreviousMedia}
                  className="absolute left-1 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-white/12 bg-black/36 text-white hover:bg-black/52 md:inline-flex"
                >
                  <ChevronLeft className="size-5" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Media successivo"
                  onClick={showNextMedia}
                  className="absolute right-1 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-white/12 bg-black/36 text-white hover:bg-black/52 md:inline-flex"
                >
                  <ChevronRight className="size-5" />
                </Button>
              </>
            ) : null}

            {currentMedia.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentMedia.url}
                alt={`${getMediaTypeLabel(currentMedia.kind)} del post di @${post.authorUsername}`}
                className="max-h-full max-w-full rounded-[1.6rem] object-contain shadow-[0_28px_80px_-30px_rgba(0,0,0,0.85)]"
              />
            ) : (
              <video
                controls
                autoPlay
                playsInline
                preload="metadata"
                className="max-h-full max-w-full rounded-[1.6rem] bg-black shadow-[0_28px_80px_-30px_rgba(0,0,0,0.85)]"
              >
                <source src={currentMedia.url} />
                Il tuo browser non supporta la riproduzione video.
              </video>
            )}
          </div>
        </div>

        {hasMultipleMedia ? (
          <div className="pointer-events-none relative z-20 flex items-center justify-center gap-1.5 pb-3">
            {media.map((item, index) => (
              <span
                key={`${item.url}-${index}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  currentIndex === index ? "w-6 bg-white" : "w-1.5 bg-white/35",
                )}
              />
            ))}
          </div>
        ) : null}

        <div className="relative z-30 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:px-6 md:pb-6">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 rounded-[1.85rem] border border-white/10 bg-black/42 p-4 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.92)] backdrop-blur-xl md:p-5">
            <div className="flex items-start gap-3">
              <Avatar size="sm">
                {post.authorAvatarUrl ? (
                  <AvatarImage src={post.authorAvatarUrl} alt={`Avatar di @${post.authorUsername}`} />
                ) : null}
                <AvatarFallback>{avatarFallback(post.authorUsername)}</AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="truncate text-sm font-semibold tracking-tight text-white">
                    {post.authorDisplayName}
                  </p>
                  <p className="truncate text-[11px] text-white/62">
                    @{post.authorUsername}
                  </p>
                  <span className="text-[11px] text-white/38">•</span>
                  <p className="truncate text-[11px] text-white/62">
                    {formatCreatedAt(post.createdAt)}
                  </p>
                </div>
                {post.textContent ? (
                  <p className="mt-1.5 max-h-24 overflow-y-auto pr-1 text-sm leading-relaxed break-words text-white/88 [overflow-wrap:anywhere]">
                    {post.textContent}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleLike}
                  disabled={isSubmittingLike}
                  className={cn(
                    viewerActionClass,
                    likedByMe && activeViewerActionClass,
                  )}
                >
                  <Heart className={cn("size-4", likedByMe && "fill-current")} />
                  {likesCount}
                </button>
                <button
                  ref={commentButtonRef}
                  type="button"
                  onClick={() => setShowComments((value) => !value)}
                  className={cn(
                    viewerActionClass,
                    (commentedByMe || showComments) && activeViewerActionClass,
                  )}
                >
                  <MessageCircle className={cn("size-4", commentedByMe && "fill-current")} />
                  {comments.length}
                </button>
                <button
                  type="button"
                  onClick={handleToggleSave}
                  disabled={isSubmittingSave}
                  className={cn(
                    viewerActionClass,
                    savedByMe && activeViewerActionClass,
                  )}
                >
                  <Bookmark className={cn("size-4", savedByMe && "fill-current")} />
                  {savedByMe ? "Salvato" : "Salva"}
                </button>
              </div>
              <button
                type="button"
                onClick={handleShare}
                className={cn(viewerActionClass, "ml-auto shrink-0")}
              >
                <Share2 className="size-4" />
                Inoltra
              </button>
            </div>

            {shareFeedback ? (
              <p className="text-[11px] text-white/68">{shareFeedback}</p>
            ) : null}

            {showReportPrompt ? (
              <div className="flex flex-col gap-3 rounded-[1.15rem] border border-white/10 bg-black/34 p-3">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-white">Segnala contenuto</p>
                  <p className="text-[11px] leading-relaxed text-white/68">
                    Vuoi segnalare questo contenuto al team di ItPassion? Potrai aggiungere la gestione completa in un secondo momento.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setShowReportPrompt(false)}
                    className="text-white/82"
                  >
                    Annulla
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    onClick={handleSubmitReport}
                    disabled={isSubmittingReport}
                  >
                    {isSubmittingReport ? "Invio..." : "Conferma"}
                  </Button>
                </div>
              </div>
            ) : null}

            {showComments ? (
              <div
                ref={commentsContainerRef}
                className="max-h-[32vh] overflow-y-auto pt-1"
              >
                <PostComments
                  postId={post.id}
                  comments={comments}
                  returnPath={currentReturnPath}
                  commentPreviewLimit={0}
                  showToggle={false}
                  onCommentsChange={(nextComments) => {
                    setComments(nextComments);
                    setCommentedByMe(nextComments.some((comment) => comment.canEdit));
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
