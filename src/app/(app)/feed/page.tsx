import Link from "next/link";
import { redirect } from "next/navigation";
import { PostCard } from "@/components/feed/post-card";
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

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <SectionHeader
        badge="Milestone 3"
        title="Feed"
        description="Un flusso pulito e moderno per seguire passioni, creator e conversazioni."
        action={
          <Link href="/create" className={buttonVariants({ size: "sm" })}>
            Crea post
          </Link>
        }
      />

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="surface-soft flex items-center gap-2 p-2">
          <Link
            href="/feed?tab=per-te"
            className={cn(
              buttonVariants({ size: "sm", variant: selectedTab === "per-te" ? "secondary" : "ghost" }),
              "flex-1",
            )}
          >
            Per te
          </Link>
          <Link
            href="/feed?tab=seguiti"
            className={cn(
              buttonVariants({ size: "sm", variant: selectedTab === "seguiti" ? "secondary" : "ghost" }),
              "flex-1",
            )}
          >
            Seguiti
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="surface-soft min-w-[132px] p-3">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">Vista</p>
            <p className="mt-1 text-sm font-semibold tracking-tight">{tabLabel}</p>
          </div>
          <div className="surface-soft min-w-[132px] p-3">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">Post visibili</p>
            <p className="mt-1 text-sm font-semibold tracking-tight">{visiblePostsCount}</p>
          </div>
        </div>
      </div>

      {params.commentError && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
          {params.commentError}
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
        <div className="flex flex-col gap-3">
          {resolvedPosts.map((post) => (
            <PostCard key={post.id} post={post} returnPath={returnPath} />
          ))}
        </div>
      )}
    </section>
  );
}
