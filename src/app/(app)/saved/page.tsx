import { redirect } from "next/navigation";
import { PostVisualGrid } from "@/components/feed/post-visual-grid";
import { SectionHeader } from "@/components/section-header";
import { StateCard } from "@/components/state-card";
import { ensureUserProfile } from "@/lib/auth";
import { getSavedPosts, type SavedPostsResult } from "@/lib/feed";
import { createServerSupabaseClient } from "@/lib/supabase";

type SavedPageProps = {
  searchParams: Promise<{
    commentError?: string;
  }>;
};

export default async function SavedPage({ searchParams }: SavedPageProps) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let hasError = false;
  let savedResult: SavedPostsResult = {
    posts: [],
    totalSavedCount: 0,
    unavailableSavedCount: 0,
  };

  try {
    await ensureUserProfile(supabase, user);
    savedResult = await getSavedPosts(supabase, user.id);
  } catch {
    hasError = true;
  }

  if (hasError) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <h1 className="text-2xl font-semibold md:text-3xl">Contenuti salvati</h1>
        <StateCard
          variant="error"
          title="Errore caricamento salvati"
          description="Controlla tabella saved_posts e policy RLS prima di riprovare."
        />
      </section>
    );
  }

  const posts = savedResult.posts;
  const hasUnavailableSaved = savedResult.unavailableSavedCount > 0;

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-7">
      <SectionHeader
        badge="Salvati"
        title="Contenuti salvati"
        description="Una raccolta piu compatta e premium, coerente con il feed e con gli stati privacy."
      />

      <div className="stats-grid">
        <div className="app-grid-stat">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Salvati totali
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight">{savedResult.totalSavedCount}</p>
        </div>
        <div className="app-grid-stat">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Disponibili ora
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight">{posts.length}</p>
        </div>
        <div className="app-grid-stat">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Non disponibili
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight">
            {savedResult.unavailableSavedCount}
          </p>
        </div>
      </div>

      {params.commentError && (
        <p className="rounded-xl border border-destructive/50 bg-destructive/10 p-2.5 text-sm text-destructive">
          {params.commentError}
        </p>
      )}

      {hasUnavailableSaved && (
        <p className="rounded-xl border border-border/70 bg-secondary/35 p-3 text-sm text-muted-foreground">
          {savedResult.unavailableSavedCount === 1
            ? "1 contenuto salvato non e disponibile per privacy, blocco utente o rimozione."
            : `${savedResult.unavailableSavedCount} contenuti salvati non sono disponibili per privacy, blocco utente o rimozione.`}
        </p>
      )}

      {posts.length === 0 ? (
        hasUnavailableSaved ? (
          <StateCard
            variant="empty"
            title="Nessun contenuto disponibile"
            description="I contenuti salvati al momento non sono visibili. Possono essere stati rimossi o resi non accessibili."
          />
        ) : (
          <StateCard
            variant="empty"
            title="Nessun contenuto salvato"
            description="Salva post dal feed per ritrovarli in questa pagina."
          />
        )
      ) : (
        <div className="app-page-shell flex flex-col gap-3">
          <PostVisualGrid posts={posts} columns={2} dense />
        </div>
      )}
    </section>
  );
}
