"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { MediaViewer } from "@/components/media/media-viewer";
import type { FeedPost } from "@/lib/feed";
import {
  getMediaTypeLabel,
  getRenderablePostMedia,
} from "@/lib/media";

type PostMediaGalleryProps = {
  post: FeedPost;
};

export function PostMediaGallery({ post }: PostMediaGalleryProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const renderableMedia = getRenderablePostMedia(post.media);
  const invalidMediaCount = post.media.length - renderableMedia.length;

  if (post.media.length === 0) {
    if (post.contentType === "image" || post.contentType === "video") {
      return (
        <div className="surface-soft rounded-[0.95rem] p-3 text-xs text-muted-foreground">
          Media non disponibile per questo post.
        </div>
      );
    }

    return null;
  }

  if (renderableMedia.length === 0) {
    return (
      <div className="surface-soft rounded-[0.95rem] p-3 text-xs text-muted-foreground">
        Media non valido o non raggiungibile.
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <div
          className={
            renderableMedia.length > 1
              ? "grid grid-cols-1 gap-1.5 sm:grid-cols-2"
              : "grid grid-cols-1 gap-1.5"
          }
        >
          {renderableMedia.map((mediaItem, index) => {
            const mediaLabel = getMediaTypeLabel(mediaItem.kind);
            const mediaAlt = `${mediaLabel} ${index + 1} del post`;

            return (
              <figure
                key={`${mediaItem.kind}-${mediaItem.url}-${index}`}
                className="group/media mx-auto w-full overflow-hidden rounded-[1rem] border border-border/80 bg-surface-2 shadow-[0_10px_22px_-22px_oklch(0_0_0_/_0.84)]"
              >
                <button
                  type="button"
                  onClick={() => setViewerIndex(index)}
                  className="block w-full text-left"
                  aria-label={`Apri ${mediaLabel.toLowerCase()} in fullscreen`}
                >
                  <div className="relative aspect-[16/7.4] w-full max-h-[10.5rem] bg-muted/20 sm:aspect-[16/7.8] sm:max-h-[11.75rem]">
                    {mediaItem.kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaItem.url}
                        alt={mediaAlt}
                        loading="lazy"
                        className="h-full w-full object-cover object-center transition-transform duration-300 group-hover/media:scale-[1.02]"
                      />
                    ) : (
                      <video
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover object-center"
                      >
                        <source src={mediaItem.url} />
                        Il tuo browser non supporta la riproduzione video.
                      </video>
                    )}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/24 via-black/6 to-transparent" />
                    {mediaItem.kind === "video" ? (
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <span className="inline-flex size-10 items-center justify-center rounded-full border border-white/14 bg-black/42 text-white shadow-[0_18px_38px_-18px_rgba(0,0,0,0.9)] backdrop-blur-sm">
                          <Play className="size-4 fill-current" />
                        </span>
                      </span>
                    ) : null}
                  </div>
                </button>
                <figcaption className="flex min-h-7 items-center justify-between gap-2 border-t border-border/70 bg-black/16 px-2 py-1">
                  <span className="text-[9px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                    {mediaLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => setViewerIndex(index)}
                    className="text-[9.5px] font-medium text-primary hover:underline"
                  >
                    Apri
                  </button>
                </figcaption>
              </figure>
            );
          })}
        </div>

        {invalidMediaCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {invalidMediaCount === 1
              ? "1 media non valido non e stato mostrato."
              : `${invalidMediaCount} media non validi non sono stati mostrati.`}
          </p>
        )}
      </div>

      {viewerIndex !== null ? (
        <MediaViewer
          open
          onClose={() => setViewerIndex(null)}
          post={post}
          initialIndex={viewerIndex}
        />
      ) : null}
    </>
  );
}
