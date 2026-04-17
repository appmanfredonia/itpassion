import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { PostVisualGrid } from "@/components/feed/post-visual-grid";
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

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <SectionHeader
        badge="Esplora"
        title="Esplora"
        description="Ricerca visuale, persone da scoprire e contenuti popolari in una struttura molto piu editoriale."
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
        <div className="app-page-shell flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-[1.4rem] border border-border/80 bg-black/14 px-3 py-3">
            <Search className="size-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Cerca passioni, persone o post visuali
            </p>
          </div>
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

      <div className="stats-grid">
        <div className="app-grid-stat">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Passione attiva
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight">
            {data.selectedPassionName ?? "Tutte le passioni"}
          </p>
        </div>
        <div className="app-grid-stat">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Contenuti in vista
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight">{data.posts.length}</p>
        </div>
        <div className="app-grid-stat">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Autori in evidenza
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight">{data.authors.length}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Persone da scoprire</h2>
        {data.authors.length === 0 ? (
          <StateCard
            variant="empty"
            title="Nessun autore in evidenza"
            description="Pubblica contenuti per popolare gli autori in Esplora."
          />
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {data.authors.map((author) => (
              <Link
                key={author.userId}
                href={`/profile/${author.username}`}
                className="group relative overflow-hidden rounded-[1.5rem] border border-border/80 bg-surface-1/95 p-3.5 shadow-[0_22px_44px_-30px_oklch(0_0_0_/_0.9)] transition-[border-color,transform,background-color] duration-200 hover:border-primary/40 hover:bg-surface-2 hover:-translate-y-0.5"
              >
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-primary/16 via-accent/10 to-transparent" />
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar>
                    {author.avatarUrl && (
                      <AvatarImage src={author.avatarUrl} alt={`Avatar di @${author.username}`} />
                    )}
                    <AvatarFallback>{avatarFallback(author.username)}</AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-sm font-semibold">@{author.username}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {author.postsCountInView} contenuti in vista
                    </p>
                  </div>
                  <span className="ml-auto rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    Apri
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Post popolari</h2>
        {data.posts.length === 0 ? (
          <StateCard
            variant="empty"
            title="Nessun contenuto per questo filtro"
            description="Prova una passione diversa o pubblica nuovi contenuti."
          />
        ) : (
          <PostVisualGrid posts={data.posts} columns={2} dense />
        )}
      </div>
    </section>
  );
}
