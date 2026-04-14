import Link from "next/link";
import { redirect } from "next/navigation";
import { PostCard } from "@/components/feed/post-card";
import { ProfileHeader } from "@/components/profile/profile-header";
import { StateCard } from "@/components/state-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  buildFallbackProfileFromAuthUser,
  ensureUserProfile,
} from "@/lib/auth";
import { getPostsByAuthor, type FeedPost } from "@/lib/feed";
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

  try {
    const ensuredProfile = await ensureUserProfile(supabase, user);
    const profile = ensuredProfile ?? buildFallbackProfileFromAuthUser(user);
    profileData = await getProfilePageData(supabase, profile);
    posts = await getPostsByAuthor(supabase, user.id, profile.id);
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
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary" className="text-[10px] tracking-[0.2em] uppercase">
          Milestone 4
        </Badge>
        <h1 className="text-2xl font-semibold md:text-3xl">Il tuo profilo</h1>
      </div>

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
          <Link
            href={`/profile/${profileData.profile.username}`}
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            Vista pubblica
          </Link>
        }
      />

      {posts.length === 0 ? (
        <StateCard
          variant="empty"
          title="Nessun contenuto pubblicato"
          description="Pubblica dal tab Crea per iniziare a popolare il profilo."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} returnPath="/profile" />
          ))}
        </div>
      )}
    </section>
  );
}
