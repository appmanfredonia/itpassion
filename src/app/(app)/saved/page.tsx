import { redirect } from "next/navigation";
import { PostCard } from "@/components/feed/post-card";
import { StateCard } from "@/components/state-card";
import { Badge } from "@/components/ui/badge";
import { ensureUserProfile } from "@/lib/auth";
import { getSavedPosts, type FeedPost } from "@/lib/feed";
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
  let posts: FeedPost[] = [];

  try {
    await ensureUserProfile(supabase, user);
    posts = await getSavedPosts(supabase, user.id);
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

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary" className="text-[10px] tracking-[0.2em] uppercase">
          Milestone 4
        </Badge>
        <h1 className="text-2xl font-semibold md:text-3xl">Contenuti salvati</h1>
      </div>

      {params.commentError && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
          {params.commentError}
        </p>
      )}

      {posts.length === 0 ? (
        <StateCard
          variant="empty"
          title="Nessun contenuto salvato"
          description="Salva post dal feed per ritrovarli in questa pagina."
        />
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
