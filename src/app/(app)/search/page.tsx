import Link from "next/link";
import { redirect } from "next/navigation";
import { unblockUserAction } from "@/app/(app)/settings/actions";
import { PostCard } from "@/components/feed/post-card";
import { SectionHeader } from "@/components/section-header";
import { StateCard } from "@/components/state-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ensureUserProfile } from "@/lib/auth";
import { searchDiscoveryData, type SearchData } from "@/lib/search";
import { createServerSupabaseClient } from "@/lib/supabase";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    commentError?: string;
    blockError?: string;
    blockSuccess?: string;
  }>;
};

function avatarFallback(username: string): string {
  const normalized = username.trim();
  if (normalized.length === 0) {
    return "IT";
  }

  return normalized.slice(0, 2).toUpperCase();
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let hasError = false;
  let searchData: SearchData | null = null;

  try {
    await ensureUserProfile(supabase, user);
    searchData = await searchDiscoveryData(supabase, user.id, query);
  } catch {
    hasError = true;
  }

  if (hasError || !searchData) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <h1 className="text-2xl font-semibold md:text-3xl">Ricerca</h1>
        <StateCard
          variant="error"
          title="Errore nella ricerca"
          description="Impossibile interrogare utenti, passioni e contenuti."
        />
      </section>
    );
  }

  const hasAnyResult =
    searchData.users.length > 0 ||
    searchData.passions.length > 0 ||
    searchData.posts.length > 0;
  const returnPath = searchData.term ? `/search?q=${encodeURIComponent(searchData.term)}` : "/search";

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <SectionHeader
        badge="Milestone 5"
        title="Ricerca"
        description="Trova utenti, passioni e contenuti con una ricerca semplice e reale."
      />

      <form action="/search" method="get" className="flex flex-col gap-2 sm:flex-row">
        <Input
          name="q"
          defaultValue={searchData.term}
          placeholder="Cerca utenti, passioni o contenuti..."
          autoComplete="off"
        />
        <Button type="submit" size="sm">
          Cerca
        </Button>
      </form>

      {params.commentError && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
          {params.commentError}
        </p>
      )}
      {params.blockError && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
          {params.blockError}
        </p>
      )}
      {params.blockSuccess && (
        <p className="rounded-md border border-border/70 bg-secondary/30 p-2 text-sm text-muted-foreground">
          {params.blockSuccess}
        </p>
      )}

      {searchData.term.length === 0 ? (
        <StateCard
          variant="empty"
          title="Inserisci una ricerca"
          description="Usa almeno 2 caratteri per cercare utenti, passioni o contenuti."
        />
      ) : searchData.term.length < 2 ? (
        <StateCard
          variant="empty"
          title="Query troppo breve"
          description="Inserisci almeno 2 caratteri per ottenere risultati."
        />
      ) : !hasAnyResult ? (
        <StateCard
          variant="empty"
          title="Nessun risultato"
          description={`Nessun risultato per "${searchData.term}".`}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Utenti</h2>
            {searchData.users.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun utente trovato.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {searchData.users.map((userResult) => (
                  <div
                    key={userResult.id}
                    className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background/60 p-3"
                  >
                    {userResult.isBlockedByMe ? (
                      <div className="flex items-center gap-3">
                        <Avatar>
                          {userResult.avatarUrl && (
                            <AvatarImage
                              src={userResult.avatarUrl}
                              alt={`Avatar di @${userResult.username}`}
                            />
                          )}
                          <AvatarFallback>{avatarFallback(userResult.username)}</AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-col">
                          <p className="truncate text-sm font-medium">@{userResult.username}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {userResult.displayName}
                          </p>
                          <div className="mt-1">
                            <Badge variant="outline">Bloccato</Badge>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Link
                        href={`/profile/${userResult.username}`}
                        className="hover:text-primary"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            {userResult.avatarUrl && (
                              <AvatarImage
                                src={userResult.avatarUrl}
                                alt={`Avatar di @${userResult.username}`}
                              />
                            )}
                            <AvatarFallback>{avatarFallback(userResult.username)}</AvatarFallback>
                          </Avatar>
                          <div className="flex min-w-0 flex-col">
                            <p className="truncate text-sm font-medium">@{userResult.username}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {userResult.displayName}
                            </p>
                          </div>
                        </div>
                      </Link>
                    )}
                    <div className="flex items-center gap-2">
                      {userResult.isBlockedByMe ? (
                        <form action={unblockUserAction}>
                          <input type="hidden" name="targetUserId" value={userResult.id} />
                          <input type="hidden" name="returnPath" value={returnPath} />
                          <Button type="submit" size="xs" variant="outline">
                            Sblocca
                          </Button>
                        </form>
                      ) : (
                        <>
                          <Link
                            href={`/messages?user=${userResult.username}`}
                            className="rounded-md border border-border/70 px-2 py-1 text-xs hover:border-primary/40"
                          >
                            Messaggio
                          </Link>
                          <Link
                            href={`/profile/${userResult.username}`}
                            className="rounded-md border border-border/70 px-2 py-1 text-xs hover:border-primary/40"
                          >
                            Apri profilo
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Passioni</h2>
            {searchData.passions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessuna passione trovata.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {searchData.passions.map((passion) => (
                  <Link key={passion.slug} href={`/explore?passion=${passion.slug}`}>
                    <Badge variant="outline">{passion.name}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Contenuti</h2>
            {searchData.posts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun contenuto trovato.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {searchData.posts.map((post) => (
                  <PostCard key={post.id} post={post} returnPath={returnPath} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
