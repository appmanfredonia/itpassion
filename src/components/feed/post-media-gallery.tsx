import type { FeedPost } from "@/lib/feed";

type PostMediaGalleryProps = {
  contentType: FeedPost["contentType"];
  media: FeedPost["media"];
};

type RenderableMediaItem = {
  kind: FeedPost["media"][number]["kind"];
  url: string;
};

function toRenderableMediaUrl(rawUrl: string): string | null {
  const normalized = rawUrl.trim();
  if (normalized.length === 0) {
    return null;
  }

  if (normalized.startsWith("/")) {
    return normalized;
  }

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    return null;
  }

  return null;
}

function getMediaTypeLabel(kind: RenderableMediaItem["kind"]): string {
  return kind === "image" ? "Immagine" : "Video";
}

export function PostMediaGallery({ contentType, media }: PostMediaGalleryProps) {
  if (media.length === 0) {
    if (contentType === "image" || contentType === "video") {
      return (
        <div className="surface-soft p-3 text-xs text-muted-foreground">
          Media non disponibile per questo post.
        </div>
      );
    }

    return null;
  }

  const renderableMedia: RenderableMediaItem[] = media
    .map((item) => ({
      kind: item.kind,
      url: toRenderableMediaUrl(item.url),
    }))
    .filter((item): item is RenderableMediaItem => item.url !== null);
  const invalidMediaCount = media.length - renderableMedia.length;

  if (renderableMedia.length === 0) {
    return (
      <div className="surface-soft p-3 text-xs text-muted-foreground">
        Media non valido o non raggiungibile.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div
        className={
          renderableMedia.length > 1
            ? "grid grid-cols-1 gap-1 sm:grid-cols-2"
            : "grid grid-cols-1 gap-1"
        }
      >
        {renderableMedia.map((mediaItem, index) => {
          const mediaLabel = getMediaTypeLabel(mediaItem.kind);
          const mediaAlt = `${mediaLabel} ${index + 1} del post`;

          return (
            <figure
              key={`${mediaItem.kind}-${mediaItem.url}-${index}`}
              className="group/media mx-auto w-full overflow-hidden rounded-[0.9rem] border border-border/80 bg-surface-2 shadow-[0_10px_22px_-22px_oklch(0_0_0_/_0.84)]"
            >
              <div className="relative aspect-[16/7.4] w-full max-h-[10.5rem] bg-muted/20 sm:aspect-[16/7.8] sm:max-h-[11.75rem]">
                {mediaItem.kind === "image" ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mediaItem.url}
                      alt={mediaAlt}
                      loading="lazy"
                      className="h-full w-full object-cover object-center transition-transform duration-300 group-hover/media:scale-[1.02]"
                    />
                  </>
                ) : (
                  <video
                    controls
                    preload="metadata"
                    playsInline
                    className="h-full w-full object-cover object-center"
                  >
                    <source src={mediaItem.url} />
                    Il tuo browser non supporta la riproduzione video.
                  </video>
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/18 via-black/4 to-transparent" />
              </div>
              <figcaption className="flex min-h-6 items-center justify-between gap-2 border-t border-border/70 bg-black/16 px-1.75 py-0.5">
                <span className="text-[9px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  {mediaLabel}
                </span>
                <a
                  href={mediaItem.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[9.5px] font-medium text-primary hover:underline"
                >
                  Apri
                </a>
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
  );
}
