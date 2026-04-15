import Link from "next/link";
import { redirect } from "next/navigation";
import { PostCard } from "@/components/feed/post-card";
import { SectionHeader } from "@/components/section-header";
import { StateCard } from "@/components/state-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { ensureUserProfile } from "@/lib/auth";
import {
  getExploreData,
  normalizePassionFilter,
  type ExploreData,
} from "@/lib/discovery";
import { createServerSupabaseClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type ExplorePageProps = {
  searchParams: Promise<{
    passion?: string;
    commentError?: string;
  }>;
};

function avatarFallback(username: string): string {
  const normalized = username.trim();
  if (normalized.length === 0) {
    return "IT";
  }

  return normalized.slice(0, 2).toUpperCase();
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const selectedPassion = normalizePassionFilter(params.passion);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let hasError = false;
  let data: ExploreData | null = null;

  try {
    await ensureUserProfile(supabase, user);
    data = await getExploreData(supabase, user.id, selectedPassion);
  } catch {
    hasError = true;
  }

  if (hasError || !data) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <h1 className="text-2xl font-semibold md:text-3xl">Esplora</h1>
        <StateCard
          variant="error"
          title="Errore caricamento Esplora"
          description="Impossibile caricare passioni o contenuti da Supabase."
        />
      </section>
    );
  }

  const returnPath = data.selectedPassionSlug
    ? `/explore?passion=${data.selectedPassionSlug}`
    : "/explore";

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <SectionHeader
        badge="Milestone 5"
        title="Esplora"
        description="Scoperta reale basata su passioni, autori e contenuti recenti."
      />

      {params.commentError && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
          {params.commentError}
        </p>
      )}

      {data.passions.length === 0 ? (
        <StateCard
          variant="empty"
          title="Nessuna passione disponibile"
          description="Aggiungi passioni nel database per attivare la discovery."
        />
      ) : (
        <div className="surface-panel flex flex-col gap-3 p-3.5">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Filtra per passione
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/explore"
              className={cn(
                buttonVariants({
                  size: "sm",
                  variant: data.selectedPassionSlug ? "outline" : "secondary",
                }),
              )}
            >
              Tutte
            </Link>
            {data.passions.map((passion) => (
              <Link
                key={passion.slug}
                href={`/explore?passion=${passion.slug}`}
                className={cn(
                  buttonVariants({
                    size: "sm",
                    variant:
                      data.selectedPassionSlug === passion.slug ? "secondary" : "outline",
                  }),
                )}
              >
                {passion.name} ({passion.recentPostsCount})
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="surface-soft p-4">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Passione attiva
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight">
            {data.selectedPassionName ?? "Tutte le passioni"}
          </p>
        </div>
        <div className="surface-soft p-4">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Contenuti in vista
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight">{data.posts.length}</p>
        </div>
        <div className="surface-soft p-4">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Autori in evidenza
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight">{data.authors.length}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Autori reali</h2>
        {data.authors.length === 0 ? (
          <StateCard
            variant="empty"
            title="Nessun autore in evidenza"
            description="Pubblica contenuti per popolare gli autori in Esplora."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.authors.map((author) => (
              <Link
                key={author.userId}
                href={`/profile/${author.username}`}
                className="surface-soft p-3 hover:border-primary/40"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    {author.avatarUrl && (
                      <AvatarImage src={author.avatarUrl} alt={`Avatar di @${author.username}`} />
                    )}
                    <AvatarFallback>{avatarFallback(author.username)}</AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col">
                    <p className="truncate text-sm font-medium">@{author.username}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {author.postsCountInView} contenuti in vista
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Contenuti recenti</h2>
        {data.posts.length === 0 ? (
          <StateCard
            variant="empty"
            title="Nessun contenuto per questo filtro"
            description="Prova una passione diversa o pubblica nuovi contenuti."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {data.posts.map((post) => (
              <PostCard key={post.id} post={post} returnPath={returnPath} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
