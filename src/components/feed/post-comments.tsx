"use client";

import Link from "next/link";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { ChevronDown, ChevronUp, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FeedComment } from "@/lib/feed";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type PostCommentsProps = {
  postId: string;
  comments: FeedComment[];
  returnPath: string;
  commentPreviewLimit: number;
  showToggle?: boolean;
  onCommentsChange?: (comments: FeedComment[]) => void;
};

type FeedbackState =
  | { type: "error"; message: string }
  | { type: "success"; message: string }
  | null;

const MAX_COMMENT_LENGTH = 500;

export function PostComments({
  postId,
  comments: initialComments,
  showToggle = true,
  onCommentsChange,
}: PostCommentsProps) {
  const [comments, setComments] = useState(initialComments);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [newCommentContent, setNewCommentContent] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  useEffect(() => {
    onCommentsChange?.(comments);
  }, [comments, onCommentsChange]);

  function startEditing(comment: FeedComment) {
    setIsExpanded(true);
    setEditingCommentId(comment.id);
    setDraftContent(comment.content);
    setFeedback(null);
  }

  function cancelEditing() {
    setEditingCommentId(null);
    setDraftContent("");
    setFeedback(null);
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const targetCommentId = editingCommentId;
    if (!targetCommentId) {
      return;
    }

    const nextContent = draftContent.trim();
    if (nextContent.length === 0) {
      setFeedback({ type: "error", message: "Scrivi un commento prima di salvare." });
      return;
    }

    if (nextContent.length > MAX_COMMENT_LENGTH) {
      setFeedback({
        type: "error",
        message: "Commento troppo lungo (max 500 caratteri).",
      });
      return;
    }

    const currentComment = comments.find((comment) => comment.id === targetCommentId);
    if (!currentComment || !currentComment.canEdit) {
      setFeedback({
        type: "error",
        message: "Non puoi modificare questo commento.",
      });
      return;
    }

    if (nextContent === currentComment.content) {
      cancelEditing();
      return;
    }

    startSaving(async () => {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from("comments")
        .update({
          content: nextContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetCommentId)
        .eq("user_id", currentComment.userId)
        .select("id, content")
        .maybeSingle();

      if (error || !data) {
        const detail =
          error?.message?.trim() ||
          "Non siamo riusciti a salvare la modifica. Riprova tra pochi secondi.";
        setFeedback({ type: "error", message: detail });
        return;
      }

      setComments((currentComments) =>
        currentComments.map((comment) =>
          comment.id === targetCommentId
            ? {
                ...comment,
                content: data.content,
              }
            : comment,
        ),
      );
      setEditingCommentId(null);
      setDraftContent("");
      setIsExpanded(true);
      setFeedback({ type: "success", message: "Commento aggiornato." });
    });
  }

  const isVisible = showToggle ? isExpanded : true;

  async function handleAddComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = newCommentContent.trim();
    if (content.length === 0) {
      setFeedback({ type: "error", message: "Scrivi un commento prima di inviare." });
      return;
    }

    if (content.length > MAX_COMMENT_LENGTH) {
      setFeedback({
        type: "error",
        message: "Commento troppo lungo (max 500 caratteri).",
      });
      return;
    }

    setIsSubmittingComment(true);
    setFeedback(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setFeedback({ type: "error", message: "Sessione non valida. Effettua di nuovo l'accesso." });
        return;
      }

      const { data: insertedComment, error: insertError } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
        })
        .select("id, post_id, user_id, content, created_at, updated_at")
        .single();

      if (insertError || !insertedComment) {
        setFeedback({
          type: "error",
          message: "Salvataggio commento non riuscito.",
        });
        return;
      }

      const { data: authorRow } = await supabase
        .from("users")
        .select("username, display_name")
        .eq("id", user.id)
        .maybeSingle();

      const authorUsername = authorRow?.username ?? `utente_${user.id.replace(/-/g, "").slice(0, 8)}`;
      const nextComments = [
        ...comments,
        {
          id: insertedComment.id,
          userId: insertedComment.user_id,
          authorUsername,
          authorDisplayName: authorRow?.display_name ?? `@${authorUsername}`,
          content: insertedComment.content,
          createdAt: insertedComment.created_at,
          canEdit: true,
          canDelete: true,
        },
      ];

      setComments(nextComments);
      setNewCommentContent("");
      setIsExpanded(true);
      setFeedback({ type: "success", message: "Commento pubblicato." });
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function handleDeleteComment(comment: FeedComment) {
    if (!comment.canDelete || deletingCommentId) {
      return;
    }

    setDeletingCommentId(comment.id);
    setFeedback(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", comment.id)
        .eq("user_id", comment.userId);

      if (error) {
        setFeedback({ type: "error", message: "Eliminazione commento non riuscita." });
        return;
      }

      setComments((currentComments) =>
        currentComments.filter((currentComment) => currentComment.id !== comment.id),
      );
      setFeedback({ type: "success", message: "Commento eliminato." });
    } finally {
      setDeletingCommentId(null);
    }
  }

  return (
    <div className="surface-soft flex flex-col gap-1 rounded-[0.95rem] border-border/80 bg-surface-1/95 p-1.25">
      {showToggle || feedback ? (
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          {showToggle ? (
            <button
              type="button"
              onClick={() => setIsExpanded((current) => !current)}
              aria-label={isExpanded ? "Nascondi commenti" : "Apri commenti"}
              className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-black/12 px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <MessageCircle className="size-[11px]" />
              {comments.length > 0 ? (
                <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-black/18 px-1 text-[9px] leading-none">
                  {comments.length}
                </span>
              ) : null}
              {isExpanded ? <ChevronUp className="size-[11px]" /> : <ChevronDown className="size-[11px]" />}
            </button>
          ) : (
            <span />
          )}
          {feedback ? (
            <p
              aria-live="polite"
              className={cn(
                "text-xs",
                feedback.type === "error" ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {feedback.message}
            </p>
          ) : null}
        </div>
      ) : null}

      {isVisible ? (
        <>
          {comments.length === 0 ? (
            <p className="text-[10px] text-muted-foreground">Nessun commento al momento.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {comments.map((comment) => {
                const isEditing = comment.canEdit && editingCommentId === comment.id;

                return (
                  <div
                    key={comment.id}
                    className={cn(
                      "flex flex-col gap-1 rounded-[0.9rem] border border-border/80 bg-black/12 px-2 py-1.5 sm:flex-row sm:items-start sm:justify-between",
                      isEditing && "border-primary/20 bg-primary/[0.04]",
                    )}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <Link
                        href={`/profile/${comment.authorUsername}`}
                        className="truncate text-[11px] font-semibold tracking-tight hover:text-primary"
                      >
                        @{comment.authorUsername}
                      </Link>

                      {isEditing ? (
                        <form onSubmit={handleSave} className="flex flex-col gap-2">
                          <Textarea
                            name="commentContent"
                            value={draftContent}
                            onChange={(event) => setDraftContent(event.target.value)}
                            maxLength={MAX_COMMENT_LENGTH}
                            className="min-h-20 rounded-xl"
                            disabled={isSaving}
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <Button type="submit" size="xs" variant="secondary" disabled={isSaving}>
                              {isSaving ? "Salvataggio..." : "Salva"}
                            </Button>
                            <Button
                              type="button"
                              size="xs"
                              variant="ghost"
                              onClick={cancelEditing}
                              disabled={isSaving}
                            >
                              Annulla
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <p className="text-[12px] leading-relaxed break-words text-foreground/90 [overflow-wrap:anywhere]">
                          {comment.content}
                        </p>
                      )}
                    </div>

                    {!isEditing && (comment.canEdit || comment.canDelete) ? (
                      <div className="flex items-center gap-1 self-start">
                        {comment.canEdit ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            className="h-6.5 px-1.75 text-[10px] [&_svg]:size-[11px]"
                            onClick={() => startEditing(comment)}
                          >
                            <Pencil className="size-3" />
                            Modifica
                          </Button>
                        ) : null}
                        {comment.canDelete ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            className="h-6.5 px-1.75 text-[10px] [&_svg]:size-[11px]"
                            onClick={() => void handleDeleteComment(comment)}
                            disabled={deletingCommentId === comment.id}
                          >
                            <Trash2 />
                            {deletingCommentId === comment.id ? "..." : "Elimina"}
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          <form onSubmit={handleAddComment} className="flex flex-col gap-1 sm:flex-row sm:items-center">
            <Input
              name="commentContent"
              value={newCommentContent}
              onChange={(event) => setNewCommentContent(event.target.value)}
              placeholder="Aggiungi un commento..."
              maxLength={MAX_COMMENT_LENGTH}
              autoComplete="off"
              className="h-7.5 flex-1 text-[11px]"
              disabled={isSubmittingComment}
            />
            <Button
              type="submit"
              size="xs"
              variant="secondary"
              className="h-7.5 px-2 text-[10px] sm:shrink-0"
              disabled={isSubmittingComment}
            >
              {isSubmittingComment ? "Invio..." : "Invia"}
            </Button>
          </form>
        </>
      ) : null}
    </div>
  );
}
