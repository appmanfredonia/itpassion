"use client";

import Link from "next/link";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { ChevronDown, ChevronUp, MessageCircle, Pencil, Trash2 } from "lucide-react";
import {
  addCommentAction,
  deleteCommentAction,
} from "@/app/(app)/feed/actions";
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
};

type FeedbackState =
  | { type: "error"; message: string }
  | { type: "success"; message: string }
  | null;

const MAX_COMMENT_LENGTH = 500;

export function PostComments({
  postId,
  comments: initialComments,
  returnPath,
}: PostCommentsProps) {
  const [comments, setComments] = useState(initialComments);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, startSaving] = useTransition();

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

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

  return (
    <div className="surface-soft flex flex-col gap-1 rounded-[0.95rem] border-border/80 bg-surface-1/95 p-1.25">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
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

      {isExpanded ? (
        comments.length === 0 ? (
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
                        <form action={deleteCommentAction} className="self-start">
                          <input type="hidden" name="commentId" value={comment.id} />
                          <input type="hidden" name="returnPath" value={returnPath} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="xs"
                            className="h-6.5 px-1.75 text-[10px] [&_svg]:size-[11px]"
                          >
                            <Trash2 />
                            Elimina
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )
      ) : null}

      <form action={addCommentAction} className="flex flex-col gap-1 sm:flex-row sm:items-center">
          <input type="hidden" name="postId" value={postId} />
          <input type="hidden" name="returnPath" value={returnPath} />
          <Input
            name="commentContent"
            placeholder="Aggiungi un commento..."
            maxLength={MAX_COMMENT_LENGTH}
            autoComplete="off"
            className="h-7.5 flex-1 text-[11px]"
          />
          <Button
            type="submit"
            size="xs"
            variant="secondary"
            className="h-7.5 px-2 text-[10px] sm:shrink-0"
          >
            Invia
          </Button>
        </form>
    </div>
  );
}
