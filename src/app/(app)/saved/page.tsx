import { redirect } from "next/navigation";
import { PostCard } from "@/components/feed/post-card";
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
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <SectionHeader
        badge="Milestone 4"
        title="Contenuti salvati"
        description="Raccogli e ritrova i post che vuoi tenere a portata di mano."
      />

      {params.commentError && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
          {params.commentError}
        </p>
      )}

      {hasUnavailableSaved && (
        <p className="rounded-md border border-border/70 bg-card/70 p-3 text-sm text-muted-foreground">
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
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} returnPath="/saved" />
          ))}
        </div>
      )}
    </section>
  );
}
