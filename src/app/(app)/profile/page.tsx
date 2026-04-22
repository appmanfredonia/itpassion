import Link from "next/link";
import { redirect } from "next/navigation";
import { FeedRitualCard } from "@/components/feed/feed-ritual-card";
import { PostVisualGrid } from "@/components/feed/post-visual-grid";
import { ProfileHeader } from "@/components/profile/profile-header";
import { SectionHeader } from "@/components/section-header";
import { StateCard } from "@/components/state-card";
import { buttonVariants } from "@/components/ui/button";
import {
  buildFallbackProfileFromAuthUser,
  ensureUserProfile,
} from "@/lib/auth";
import { getPostsByAuthor, type FeedPost } from "@/lib/feed";
import { getRitualsByCreator, type RitualSummary } from "@/lib/rituals";
import { getProfilePageData, type ProfilePageData } from "@/lib/profile";
import { createServerSupabaseClient } from "@/lib/supabase";

type ProfilePageProps = {
  searchParams: Promise<{
    commentError?: string;
  }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let hasError = false;
  let profileData: ProfilePageData | null = null;
  let posts: FeedPost[] = [];
  let rituals: RitualSummary[] = [];

  try {
    const ensuredProfile = await ensureUserProfile(supabase, user);
    const profile = ensuredProfile ?? buildFallbackProfileFromAuthUser(user);
    profileData = await getProfilePageData(supabase, profile);
    const [resolvedPosts, resolvedRituals] = await Promise.all([
      getPostsByAuthor(supabase, user.id, profile.id),
      getRitualsByCreator(supabase, user.id, profile.id, 3),
    ]);
    posts = resolvedPosts;
    rituals = resolvedRituals.rituals;
  } catch {
    hasError = true;
  }

  if (hasError || !profileData) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <h1 className="text-2xl font-semibold md:text-3xl">Il tuo profilo</h1>
        <StateCard
          variant="error"
          title="Errore caricamento profilo"
          description="Controlla migrazioni, policy RLS e dati utente prima di riprovare."
        />
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-5 md:gap-6">
      <SectionHeader
        badge="Profilo"
        title="Il tuo profilo"
        description="Un profilo leggibile, forte e coerente con i tuoi contenuti."
      />

      {params.commentError && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
          {params.commentError}
        </p>
      )}

      <ProfileHeader
        profile={profileData.profile}
        counters={profileData.counters}
        passions={profileData.passions}
        actionSlot={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <Link href="/settings" className={buttonVariants({ size: "sm", variant: "secondary" })}>
              Modifica profilo
            </Link>
            <Link
              href={`/profile/${profileData.profile.username}`}
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              Vista pubblica
            </Link>
          </div>
        }
      />

      <div className="app-page-shell flex flex-wrap items-center justify-between gap-2.5 rounded-[1.75rem] px-4 py-3.5 md:px-5 md:py-4">
        <div className="flex flex-col">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Contenuti pubblicati
          </p>
          <p className="text-lg font-semibold tracking-tight">{posts.length}</p>
        </div>
        <Link href="/create" className={buttonVariants({ size: "sm" })}>
          Crea nuovo post
        </Link>
      </div>

      {rituals.length > 0 ? (
        <div className="app-page-shell flex flex-col gap-3 rounded-[1.75rem] px-4 py-4 md:px-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Rituali creati
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight">
                I prossimi appuntamenti delle tue tribu
              </h2>
            </div>
            <Link href="/rituals/create" className={buttonVariants({ size: "sm", variant: "outline" })}>
              Crea rituale
            </Link>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {rituals.map((ritual) => (
              <FeedRitualCard key={ritual.id} ritual={ritual} />
            ))}
          </div>
        </div>
      ) : null}

      {posts.length === 0 ? (
        <StateCard
          variant="empty"
          title="Nessun contenuto pubblicato"
          description="Pubblica dal tab Crea per iniziare a popolare il profilo."
        />
      ) : (
        <PostVisualGrid posts={posts} columns={3} />
      )}
    </section>
  );
}
