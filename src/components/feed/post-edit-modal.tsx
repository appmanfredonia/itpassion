"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { ImagePlus, Loader2, Video, X } from "lucide-react";
import {
  updatePostInlineAction,
  type InlineUpdatePostResult,
} from "@/app/(app)/create/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FeedPost } from "@/lib/feed";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type PostEditModalProps = {
  open: boolean;
  onClose: () => void;
  post: FeedPost;
  onPostUpdate: (post: FeedPost) => void;
};

type PassionOption = {
  slug: string;
  name: string;
};

type ContentType = FeedPost["contentType"];

function avatarFallback(username: string): string {
  const normalized = username.replace("@", "").trim();
  if (normalized.length === 0) {
    return "IT";
  }

  return normalized.slice(0, 2).toUpperCase();
}

function formatCreatedAt(isoDate: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoDate));
}

function localPreviewLabel(contentType: ContentType) {
  return contentType === "video" ? "Nuovo video selezionato" : "Nuova immagine selezionata";
}

export function PostEditModal({
  open,
  onClose,
  post,
  onPostUpdate,
}: PostEditModalProps) {
  const [textContent, setTextContent] = useState(post.textContent ?? "");
  const [passionSlug, setPassionSlug] = useState(post.passionSlug);
  const [contentType, setContentType] = useState<ContentType>(post.contentType);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [passions, setPassions] = useState<PassionOption[]>([
    { slug: post.passionSlug, name: post.passionName },
  ]);
  const [isPending, startTransition] = useTransition();
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile],
  );

  useEffect(() => {
    if (!previewUrl) {
      return;
    }

    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return;
    }

    const body = document.body;
    const previous = {
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
    };

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    window.setTimeout(() => {
      firstFieldRef.current?.focus();
    }, 0);

    return () => {
      body.style.overflow = previous.overflow;
      body.style.paddingRight = previous.paddingRight;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const supabase = createBrowserSupabaseClient();
    let cancelled = false;

    const loadPassions = async () => {
      const { data, error } = await supabase
        .from("passions")
        .select("slug, name")
        .order("name", { ascending: true });

      if (cancelled) {
        return;
      }

      if (error || !data) {
        setCatalogError("Catalogo passioni non disponibile al momento.");
        return;
      }

      const nextPassions = data.length > 0 ? data : [{ slug: post.passionSlug, name: post.passionName }];
      setPassions(nextPassions);
      setCatalogError(null);
    };

    void loadPassions();

    return () => {
      cancelled = true;
    };
  }, [open, post.passionName, post.passionSlug]);

  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPending, onClose, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const selectedPassionName =
    passions.find((passion) => passion.slug === passionSlug)?.name ?? post.passionName;

  const visibleMedia =
    contentType === "text"
      ? []
      : previewUrl
        ? [{ kind: contentType === "video" ? "video" : "image", url: previewUrl, isPreview: true }]
        : post.media;

  async function handleSubmit() {
    const formData = new FormData();
    formData.set("editingPostId", post.id);
    formData.set("textContent", textContent);
    formData.set("passionSlug", passionSlug);
    formData.set("contentType", contentType);

    if (selectedFile) {
      formData.set("mediaFile", selectedFile);
    }

    startTransition(async () => {
      const result = (await updatePostInlineAction(formData)) as InlineUpdatePostResult;

      if (!result.success) {
        setFeedback(result.error);
        return;
      }

      onPostUpdate({
        ...post,
        passionSlug: result.post.passionSlug,
        passionName: result.post.passionName,
        contentType: result.post.contentType,
        textContent: result.post.textContent,
        updatedAt: result.post.updatedAt,
        media: result.post.media,
      });
      setFeedback(null);
      onClose();
    });
  }

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 py-6 md:px-6">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/76 backdrop-blur-[2px]"
        onClick={() => {
          if (!isPending) {
            onClose();
          }
        }}
      />

      <div className="relative z-10 flex max-h-[min(92vh,58rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[1.85rem] border border-border/80 bg-[linear-gradient(180deg,rgba(18,22,34,0.96),rgba(10,12,20,0.98))] shadow-[0_38px_90px_-34px_rgba(0,0,0,0.92)]">
        <div className="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
              Editor
            </p>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground">
              Modifica post
            </h2>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Chiudi modale modifica post"
            onClick={onClose}
            disabled={isPending}
            className="rounded-full border border-white/10 bg-white/[0.03] text-foreground hover:bg-white/[0.08]"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              {post.authorAvatarUrl ? (
                <AvatarImage src={post.authorAvatarUrl} alt={`Avatar di @${post.authorUsername}`} />
              ) : null}
              <AvatarFallback>{avatarFallback(post.authorUsername)}</AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{post.authorDisplayName}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span className="truncate">@{post.authorUsername}</span>
                <span className="text-white/22">/</span>
                <span>{formatCreatedAt(post.createdAt)}</span>
              </div>
            </div>

            <Badge variant="secondary" className="ml-auto border-primary/20 bg-primary/10 text-primary">
              {selectedPassionName}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor={`post-edit-text-${post.id}`}>Contenuto</Label>
                <Textarea
                  ref={firstFieldRef}
                  id={`post-edit-text-${post.id}`}
                  value={textContent}
                  onChange={(event) => setTextContent(event.target.value)}
                  placeholder="Racconta il momento, aggiungi contesto o aggiorna la caption."
                  className="min-h-40 resize-none rounded-[1.25rem] border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed"
                  disabled={isPending}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`post-edit-passion-${post.id}`}>Passione</Label>
                  <select
                    id={`post-edit-passion-${post.id}`}
                    value={passionSlug}
                    onChange={(event) => setPassionSlug(event.target.value)}
                    className="h-11 rounded-[1.1rem] border border-white/10 bg-white/[0.03] px-3 text-sm text-foreground"
                    disabled={isPending}
                  >
                    {passions.map((passion) => (
                      <option key={passion.slug} value={passion.slug}>
                        {passion.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor={`post-edit-type-${post.id}`}>Tipo contenuto</Label>
                  <select
                    id={`post-edit-type-${post.id}`}
                    value={contentType}
                    onChange={(event) => setContentType(event.target.value as ContentType)}
                    className="h-11 rounded-[1.1rem] border border-white/10 bg-white/[0.03] px-3 text-sm text-foreground"
                    disabled={isPending}
                  >
                    <option value="text">Testo</option>
                    <option value="image">Foto</option>
                    <option value="video">Video</option>
                  </select>
                </div>
              </div>

              {catalogError ? (
                <p className="text-xs text-muted-foreground">{catalogError}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                    Media
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-foreground">
                    Anteprima contenuto
                  </h3>
                </div>

                {contentType !== "text" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isPending}
                    className="rounded-full border-white/10 bg-white/[0.03] text-foreground hover:bg-white/[0.08]"
                  >
                    <ImagePlus className="size-3" />
                    {selectedFile ? "Sostituisci file" : "Carica file"}
                  </Button>
                ) : null}
              </div>

              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              />

              {contentType === "text" ? (
                <div className="rounded-[1.2rem] border border-dashed border-white/10 bg-black/16 px-4 py-5 text-sm leading-relaxed text-muted-foreground">
                  Questo post verra salvato come contenuto testuale. I media attuali verranno rimossi.
                </div>
              ) : visibleMedia.length > 0 ? (
                <div className={cn("grid gap-2", visibleMedia.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                  {visibleMedia.map((mediaItem, index) => (
                    <div
                      key={`${mediaItem.url}-${index}`}
                      className="overflow-hidden rounded-[1.15rem] border border-white/10 bg-black/18"
                    >
                      <div className="aspect-[4/4.2] bg-black/30">
                        {mediaItem.kind === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={mediaItem.url}
                            alt="Anteprima media del post"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <video
                            controls
                            preload="metadata"
                            className="h-full w-full object-cover"
                          >
                            <source src={mediaItem.url} />
                          </video>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 border-t border-white/8 px-3 py-2 text-[11px] text-muted-foreground">
                        <span>{mediaItem.kind === "video" ? "Video" : "Immagine"}</span>
                        {"isPreview" in mediaItem && mediaItem.isPreview ? (
                          <span className="text-primary">{localPreviewLabel(contentType)}</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.2rem] border border-dashed border-white/10 bg-black/16 px-4 py-5 text-sm leading-relaxed text-muted-foreground">
                  Nessun media disponibile. Carica un file per completare il post.
                </div>
              )}

              {contentType === "video" ? (
                <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <Video className="size-3.5" />
                  Se cambi video, il nuovo file sostituisce quello esistente.
                </p>
              ) : null}
            </div>
          </div>

          {feedback ? (
            <p className="rounded-[1rem] border border-destructive/35 bg-destructive/12 px-3 py-2 text-sm text-destructive">
              {feedback}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/8 px-5 py-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isPending}
            className="rounded-full text-foreground/82"
          >
            Annulla
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => void handleSubmit()}
            disabled={isPending}
            className="min-w-[8rem] rounded-full"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Salvataggio...
              </>
            ) : (
              "Salva"
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

