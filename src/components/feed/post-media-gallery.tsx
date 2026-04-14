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
        <div className="rounded-lg border border-border/70 bg-card/70 p-3 text-xs text-muted-foreground">
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
      <div className="rounded-lg border border-border/70 bg-card/70 p-3 text-xs text-muted-foreground">
        Media non valido o non raggiungibile.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className={
          renderableMedia.length > 1
            ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
            : "grid grid-cols-1 gap-3"
        }
      >
        {renderableMedia.map((mediaItem, index) => {
          const mediaLabel = getMediaTypeLabel(mediaItem.kind);
          const mediaAlt = `${mediaLabel} ${index + 1} del post`;

          return (
            <figure
              key={`${mediaItem.kind}-${mediaItem.url}-${index}`}
              className="overflow-hidden rounded-xl border border-border/70 bg-card/70"
            >
              <div className="aspect-video w-full bg-muted/20">
                {mediaItem.kind === "image" ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mediaItem.url}
                      alt={mediaAlt}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </>
                ) : (
                  <video
                    controls
                    preload="metadata"
                    playsInline
                    className="h-full w-full object-cover"
                  >
                    <source src={mediaItem.url} />
                    Il tuo browser non supporta la riproduzione video.
                  </video>
                )}
              </div>
              <figcaption className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {mediaLabel}
                </span>
                <a
                  href={mediaItem.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline"
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
