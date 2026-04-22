import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RitualDetailView } from "@/components/rituals/ritual-detail-view";
import { SectionHeader } from "@/components/section-header";
import { StateCard } from "@/components/state-card";
import { buttonVariants } from "@/components/ui/button";
import { ensureUserProfile } from "@/lib/auth";
import { getRitualDetailForViewer } from "@/lib/rituals";
import { createServerSupabaseClient } from "@/lib/supabase";

type RitualDetailPageProps = {
  params: Promise<{
    ritualId: string;
  }>;
};

export default async function RitualDetailPage({ params }: RitualDetailPageProps) {
  const { ritualId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let viewerProfile: Awaited<ReturnType<typeof ensureUserProfile>> | null = null;
  try {
    viewerProfile = await ensureUserProfile(supabase, user);
  } catch {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <StateCard
          variant="error"
          title="Profilo non disponibile"
          description="Sincronizzazione profilo non riuscita. Riprova tra pochi secondi."
        />
      </section>
    );
  }

  const { ritual, warning } = await getRitualDetailForViewer(supabase, user.id, ritualId);
  if (!ritual) {
    notFound();
  }

  const viewerParticipant =
    viewerProfile === null
      ? null
      : {
          userId: viewerProfile.id,
          username: viewerProfile.username,
          displayName: viewerProfile.displayName,
          avatarUrl: viewerProfile.avatarUrl,
        };

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <SectionHeader
        badge="Rituale"
        title={ritual.title}
        description="Un rituale e un evento creato dagli utenti dentro una sola tribu locale: stessa passione, stessa provincia."
        action={
          <div className="flex items-center gap-2">
            <Link href="/map" className={buttonVariants({ size: "sm", variant: "outline" })}>
              Torna alla mappa
            </Link>
            <Link href="/rituals/create" className={buttonVariants({ size: "sm" })}>
              Crea rituale
            </Link>
          </div>
        }
      />

      {warning ? (
        <p className="rounded-2xl border border-border/70 bg-secondary/30 px-3 py-2 text-sm text-muted-foreground">
          {warning}
        </p>
      ) : null}

      <RitualDetailView ritual={ritual} viewerParticipant={viewerParticipant} />
    </section>
  );
}
