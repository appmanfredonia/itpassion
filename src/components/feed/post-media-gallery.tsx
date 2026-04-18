"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { MediaViewer } from "@/components/media/media-viewer";
import type { FeedPost } from "@/lib/feed";
import {
  getMediaTypeLabel,
  getRenderablePostMedia,
} from "@/lib/media";
import { cn } from "@/lib/utils";

type PostMediaGalleryProps = {
  post: FeedPost;
  onPostUpdate?: (post: FeedPost) => void;
};

export function PostMediaGallery({ post, onPostUpdate }: PostMediaGalleryProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const renderableMedia = getRenderablePostMedia(post.media);
  const invalidMediaCount = post.media.length - renderableMedia.length;
  const visibleMedia = renderableMedia.length > 3 ? renderableMedia.slice(0, 3) : renderableMedia;
  const hiddenMediaCount = renderableMedia.length - visibleMedia.length;

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
            renderableMedia.length === 1
              ? "grid grid-cols-1"
              : renderableMedia.length === 2
                ? "grid grid-cols-2 gap-1.5"
                : "grid h-[16rem] grid-cols-[1.3fr_1fr] grid-rows-2 gap-1.5 sm:h-[20rem]"
          }
        >
          {visibleMedia.map((mediaItem, index) => {
            const mediaLabel = getMediaTypeLabel(mediaItem.kind);
            const mediaAlt = `${mediaLabel} ${index + 1} del post`;
            const tileClass =
              renderableMedia.length === 1
                ? "aspect-[4/3] max-h-[22rem]"
                : renderableMedia.length === 2
                  ? "aspect-[4/4.6] sm:aspect-[4/4.1]"
                  : index === 0
                    ? "row-span-2 h-full"
                    : "h-full";

            return (
              <figure
                key={`${mediaItem.kind}-${mediaItem.url}-${index}`}
                className={cn(
                  "group/media relative mx-auto w-full overflow-hidden rounded-[1.1rem] border border-white/8 bg-surface-2 shadow-[0_20px_30px_-26px_oklch(0_0_0_/_0.86)]",
                  tileClass,
                )}
              >
                <button
                  type="button"
                  onClick={() => setViewerIndex(index)}
                  className="block h-full w-full text-left"
                  aria-label={`Apri ${mediaLabel.toLowerCase()} in fullscreen`}
                >
                  <div className="relative h-full w-full bg-muted/20">
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
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/58 via-black/12 to-transparent" />
                    {mediaItem.kind === "video" ? (
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <span className="inline-flex size-11 items-center justify-center rounded-full border border-white/14 bg-black/42 text-white shadow-[0_18px_38px_-18px_rgba(0,0,0,0.9)] backdrop-blur-sm">
                          <Play className="size-4 fill-current" />
                        </span>
                      </span>
                    ) : null}
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-3 py-2.5">
                      <span className="inline-flex rounded-full border border-white/12 bg-black/34 px-2.5 py-1 text-[9px] font-semibold tracking-[0.16em] text-white/78 uppercase backdrop-blur-sm">
                        {mediaLabel}
                      </span>
                      {hiddenMediaCount > 0 && index === visibleMedia.length - 1 ? (
                        <span className="rounded-full border border-white/12 bg-black/38 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                          +{hiddenMediaCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
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
          onPostUpdate={onPostUpdate}
        />
      ) : null}
    </>
  );
}
