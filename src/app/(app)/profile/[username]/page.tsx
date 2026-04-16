import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { startConversationAction } from "@/app/(app)/messages/actions";
import { toggleFollowAction } from "@/app/(app)/profile/actions";
import {
  blockUserAction,
} from "@/app/(app)/settings/actions";
import { PostVisualGrid } from "@/components/feed/post-visual-grid";
import { ProfileHeader } from "@/components/profile/profile-header";
import { SectionHeader } from "@/components/section-header";
import { StateCard } from "@/components/state-card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  ensureUserProfile,
  getProfileByUsername,
  normalizeUsername,
} from "@/lib/auth";
import { getPostsByAuthor, type FeedPost } from "@/lib/feed";
import { areUsersBlocked, getUserPrivacySettings } from "@/lib/privacy";
import {
  getProfilePageData,
  isFollowingProfile,
  type ProfilePageData,
} from "@/lib/profile";
import { createServerSupabaseClient } from "@/lib/supabase";

type PublicProfilePageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{
    commentError?: string;
    messageError?: string;
    blockError?: string;
    blockSuccess?: string;
  }>;
};

export default async function PublicProfilePage({
  params,
  searchParams,
}: PublicProfilePageProps) {
  const [{ username: rawUsername }, pageParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const username = normalizeUsername(decodeURIComponent(rawUsername));

  if (username.length < 3) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <h1 className="text-2xl font-semibold md:text-3xl">Profilo pubblico</h1>
        <StateCard
          variant="empty"
          title="Username non valido"
          description="Formato username non riconosciuto."
        />
      </section>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user: viewerUser },
  } = await supabase.auth.getUser();

  if (!viewerUser) {
    redirect("/login");
  }

  let hasError = false;
  let isNotFound = false;
  let isBlockedRelation = false;
  let isOwnProfile = false;
  let isFollowing = false;
  let isTargetProfilePrivate = false;
  let canViewPrivateProfile = true;
  let returnPath = `/profile/${username}`;
  let profileData: ProfilePageData | null = null;
  let posts: FeedPost[] = [];

  try {
    await ensureUserProfile(supabase, viewerUser);
    const targetProfile = await getProfileByUsername(supabase, username);

    if (!targetProfile) {
      isNotFound = true;
    } else {
      isOwnProfile = targetProfile.id === viewerUser.id;
      returnPath = `/profile/${targetProfile.username}`;
      if (isOwnProfile) {
        isBlockedRelation = false;
      } else {
        const blockedStatus = await areUsersBlocked(
          supabase,
          viewerUser.id,
          targetProfile.id,
        );
        isBlockedRelation =
          blockedStatus.firstBlockedSecond || blockedStatus.secondBlockedFirst;
      }

      if (!isBlockedRelation) {
        const [resolvedProfileData, resolvedPosts, resolvedFollowStatus, targetPrivacy] = await Promise.all([
          getProfilePageData(supabase, targetProfile),
          getPostsByAuthor(supabase, viewerUser.id, targetProfile.id),
          isOwnProfile
            ? Promise.resolve(false)
            : isFollowingProfile(supabase, viewerUser.id, targetProfile.id),
          getUserPrivacySettings(supabase, targetProfile.id),
        ]);

        profileData = resolvedProfileData;
        isFollowing = resolvedFollowStatus;
        isTargetProfilePrivate = targetPrivacy.isProfilePrivate;
        canViewPrivateProfile =
          isOwnProfile || !isTargetProfilePrivate || isFollowing;
        posts = canViewPrivateProfile ? resolvedPosts : [];
      }
    }
  } catch {
    hasError = true;
  }

  if (hasError) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <h1 className="text-2xl font-semibold md:text-3xl">Profilo pubblico</h1>
        <StateCard
          variant="error"
          title="Errore caricamento profilo"
          description="Dati profilo o relazioni social non disponibili in questo momento."
        />
      </section>
    );
  }

  if (isBlockedRelation) {
    notFound();
  }

  if (isNotFound || !profileData) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <h1 className="text-2xl font-semibold md:text-3xl">Profilo pubblico</h1>
        <StateCard
          variant="empty"
          title="Profilo non trovato"
          description="Controlla username o torna al feed per cercare un altro profilo."
        />
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <SectionHeader
        badge="Milestone 4"
        title={`Profilo di @${profileData.profile.username}`}
        description="Profilo pubblico piu forte e visivo, con CTA e contenuti immersivi."
      />

      {pageParams.commentError && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
          {pageParams.commentError}
        </p>
      )}
      {pageParams.messageError && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
          {pageParams.messageError}
        </p>
      )}
      {pageParams.blockError && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
          {pageParams.blockError}
        </p>
      )}
      {pageParams.blockSuccess && (
        <p className="rounded-md border border-border/70 bg-secondary/30 p-2 text-sm text-muted-foreground">
          {pageParams.blockSuccess}
        </p>
      )}
      <ProfileHeader
        profile={profileData.profile}
        counters={profileData.counters}
        passions={profileData.passions}
        actionSlot={
          isOwnProfile ? (
            <Link href="/profile" className={buttonVariants({ size: "sm", variant: "outline" })}>
              Torna al tuo profilo
            </Link>
          ) : (
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <form action={toggleFollowAction}>
                <input type="hidden" name="targetUserId" value={profileData.profile.id} />
                <input type="hidden" name="returnPath" value={returnPath} />
                <Button type="submit" size="sm" variant={isFollowing ? "secondary" : "default"}>
                  {isFollowing ? "Seguito" : "Segui"}
                </Button>
              </form>
              <form action={startConversationAction}>
                <input type="hidden" name="targetUserId" value={profileData.profile.id} />
                <input type="hidden" name="returnPath" value={returnPath} />
                <Button type="submit" size="sm" variant="outline">
                  Messaggio
                </Button>
              </form>
              <form action={blockUserAction}>
                <input type="hidden" name="targetUserId" value={profileData.profile.id} />
                <input type="hidden" name="returnPath" value={returnPath} />
                <Button type="submit" size="sm" variant="destructive">
                  Blocca
                </Button>
              </form>
            </div>
          )
        }
      />

      <div className="app-page-shell flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Contenuti visibili
          </p>
          <p className="text-lg font-semibold tracking-tight">
            {canViewPrivateProfile ? posts.length : 0}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {isTargetProfilePrivate ? "Profilo privato" : "Profilo pubblico"}
        </p>
      </div>

      {!canViewPrivateProfile ? (
        <StateCard
          variant="empty"
          title="Profilo privato"
          description="Segui questo utente per vedere i suoi contenuti."
        />
      ) : posts.length === 0 ? (
        <StateCard
          variant="empty"
          title="Nessun contenuto pubblicato"
          description="Questo profilo non ha ancora pubblicato contenuti."
        />
      ) : (
        <PostVisualGrid posts={posts} columns={3} />
      )}
    </section>
  );
}
