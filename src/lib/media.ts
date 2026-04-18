import type { FeedPost } from "@/lib/feed";

export type RenderablePostMedia = {
  kind: FeedPost["media"][number]["kind"];
  url: string;
};

export function toRenderableMediaUrl(rawUrl: string): string | null {
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

export function getRenderablePostMedia(
  media: FeedPost["media"],
): RenderablePostMedia[] {
  return media
    .map((item) => ({
      kind: item.kind,
      url: toRenderableMediaUrl(item.url),
    }))
    .filter((item): item is RenderablePostMedia => item.url !== null);
}

export function getFirstRenderablePostMedia(
  post: Pick<FeedPost, "media">,
): RenderablePostMedia | null {
  return getRenderablePostMedia(post.media)[0] ?? null;
}

export function getMediaTypeLabel(kind: RenderablePostMedia["kind"]): string {
  return kind === "image" ? "Immagine" : "Video";
}
