import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { PostCard } from "@/components/feed/post-card";
import { FeedStoryStrip } from "@/components/feed/feed-story-strip";
import { SectionHeader } from "@/components/section-header";
import { StateCard } from "@/components/state-card";
import { buttonVariants } from "@/components/ui/button";
import { ensureUserProfile } from "@/lib/auth";
import { getFeedPosts, getPostById, type FeedPost, type FeedTab } from "@/lib/feed";
import { createServerSupabaseClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type FeedPageProps = {
  searchParams: Promise<{
    tab?: string;
    post?: string;
    commentError?: string;
    postError?: string;
    editComment?: string;
  }>;
};

function normalizeTab(tab: string | undefined): FeedTab {
  if (tab === "seguiti") {
    return "seguiti";
  }
  return "per-te";
}

function getReturnPath(tab: FeedTab): string {
  return tab === "seguiti" ? "/feed?tab=seguiti" : "/feed?tab=per-te";
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const params = await searchParams;
  const selectedTab = normalizeTab(params.tab);
  const requestedPostId = typeof params.post === "string" ? params.post : null;
  const baseReturnPath = getReturnPath(selectedTab);
  const returnPath = requestedPostId
    ? `${baseReturnPath}&post=${requestedPostId}`
    : baseReturnPath;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    await ensureUserProfile(supabase, user);
  } catch {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <h1 className="text-2xl font-semibold md:text-3xl">Feed</h1>
        <StateCard
          variant="error"
          title="Profilo utente non disponibile"
          description="Sincronizzazione profilo non riuscita. Riprova tra pochi secondi."
        />
      </section>
    );
  }

  let postsResult: Awaited<ReturnType<typeof getFeedPosts>> | null = null;

  try {
    postsResult = await getFeedPosts(supabase, user, selectedTab);
  } catch {
    postsResult = null;
  }

  if (!postsResult) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <h1 className="text-2xl font-semibold md:text-3xl">Feed</h1>
        <StateCard
          variant="error"
          title="Errore nel caricamento del feed"
          description="Controlla migrazioni e policy RLS per posts, follows, likes, comments e saved_posts."
        />
      </section>
    );
  }

  const { posts, warning } = postsResult;

  let resolvedPosts: FeedPost[] = posts;
  let requestedPostNotFound = false;

  if (requestedPostId) {
    try {
      const requestedPost = await getPostById(supabase, user.id, requestedPostId);
      if (requestedPost) {
        const alreadyInList = posts.some((post) => post.id === requestedPost.id);
        resolvedPosts = alreadyInList ? posts : [requestedPost, ...posts];
      } else {
        requestedPostNotFound = true;
      }
    } catch {
      requestedPostNotFound = true;
    }
  }

  const visiblePostsCount = resolvedPosts.length;
  const tabLabel = selectedTab === "seguiti" ? "Seguiti" : "Per te";
  const storyItems = Array.from(
    new Map(
      resolvedPosts.map((post) => [
        post.userId,
        {
          userId: post.userId,
          username: post.authorUsername,
          displayName: post.authorDisplayName,
          avatarUrl: post.authorAvatarUrl,
        },
      ]),
    ).values(),
  ).slice(0, 8);

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <SectionHeader
        badge="Feed"
        title="Feed"
        description="Per te e Seguiti in una superficie piu mobile-first, con storie visuali e media dominanti."
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className={buttonVariants({ size: "icon-sm", variant: "outline" })}
            >
              <Search className="size-4" />
            </Link>
            <Link href="/create" className={buttonVariants({ size: "sm" })}>
              Nuovo post
            </Link>
          </div>
        }
      />

      <div className="app-page-shell flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4 border-b border-border/80 pb-3">
          <div className="flex items-center gap-5">
            <Link
              href="/feed?tab=per-te"
              className={cn(
                "relative text-sm font-semibold transition-colors",
                selectedTab === "per-te" ? "text-foreground" : "text-muted-foreground",
              )}
            >
              Per te
              {selectedTab === "per-te" ? (
                <span className="absolute -bottom-3 left-0 h-0.5 w-full rounded-full bg-gradient-to-r from-primary to-accent" />
              ) : null}
            </Link>
            <Link
              href="/feed?tab=seguiti"
              className={cn(
                "relative text-sm font-semibold transition-colors",
                selectedTab === "seguiti" ? "text-foreground" : "text-muted-foreground",
              )}
            >
              Seguiti
              {selectedTab === "seguiti" ? (
                <span className="absolute -bottom-3 left-0 h-0.5 w-full rounded-full bg-gradient-to-r from-primary to-accent" />
              ) : null}
            </Link>
          </div>
          <p className="rounded-full border border-border/80 bg-surface-1 px-3 py-1 text-[11px] font-medium text-muted-foreground">
            {tabLabel} / {visiblePostsCount}
          </p>
        </div>

        <FeedStoryStrip items={storyItems} />
      </div>

      {params.commentError && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
          {params.commentError}
        </p>
      )}
      {params.postError && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
          {params.postError}
        </p>
      )}

      {warning && (
        <p className="rounded-md border border-border/70 bg-secondary/30 p-2 text-xs text-muted-foreground">
          {warning}
        </p>
      )}
      {requestedPostNotFound && (
        <p className="rounded-md border border-border/70 bg-secondary/30 p-2 text-xs text-muted-foreground">
          Il post richiesto non e disponibile o non accessibile.
        </p>
      )}

      {resolvedPosts.length === 0 ? (
        <StateCard
          variant="empty"
          title="Nessun contenuto disponibile"
          description={
            selectedTab === "seguiti"
              ? "Segui altri profili per popolare questa sezione."
              : "Pubblica il primo contenuto dalla pagina Crea."
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {resolvedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              returnPath={returnPath}
              commentPreviewLimit={1}
              editingCommentId={typeof params.editComment === "string" ? params.editComment : null}
            />
          ))}
        </div>
      )}
    </section>
  );
}
