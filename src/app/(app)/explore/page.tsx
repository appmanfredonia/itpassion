import Link from "next/link";
import { redirect } from "next/navigation";
import { PostCard } from "@/components/feed/post-card";
import { StateCard } from "@/components/state-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
          title="Errore caricamento discovery"
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
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary" className="text-[10px] tracking-[0.2em] uppercase">
          Milestone 5
        </Badge>
        <h1 className="text-2xl font-semibold md:text-3xl">Esplora</h1>
      </div>

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
        <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background/60 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Filtra per passione
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/explore"
              className={cn(
                buttonVariants({
                  size: "xs",
                  variant: data.selectedPassionSlug ? "ghost" : "secondary",
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
                    size: "xs",
                    variant:
                      data.selectedPassionSlug === passion.slug ? "secondary" : "ghost",
                  }),
                )}
              >
                {passion.name} ({passion.recentPostsCount})
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-card/70 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Passione attiva
          </p>
          <p className="text-sm font-medium">
            {data.selectedPassionName ?? "Tutte le passioni"}
          </p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card/70 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Contenuti in vista
          </p>
          <p className="text-sm font-medium">{data.posts.length}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Autori reali</h2>
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
                className="rounded-xl border border-border/70 bg-background/60 p-3 hover:border-primary/40"
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
        <h2 className="text-lg font-semibold">Contenuti recenti</h2>
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
