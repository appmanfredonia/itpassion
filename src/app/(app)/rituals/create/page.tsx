import Link from "next/link";
import { redirect } from "next/navigation";
import { RitualCreateForm } from "@/components/rituals/ritual-create-form";
import { SectionHeader } from "@/components/section-header";
import { StateCard } from "@/components/state-card";
import { buttonVariants } from "@/components/ui/button";
import { createRitualAction } from "@/app/(app)/rituals/actions";
import { ensureUserProfile } from "@/lib/auth";
import { getViewerLocalTribes } from "@/lib/rituals";
import { createServerSupabaseClient } from "@/lib/supabase";

type RitualCreatePageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function RitualCreatePage({ searchParams }: RitualCreatePageProps) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    await ensureUserProfile(supabase, user);
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

  const { tribes, warning } = await getViewerLocalTribes(supabase, user.id);

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <SectionHeader
        badge="Rituali"
        title="Crea rituale"
        description="Un rituale e un evento creato dagli utenti dentro una delle proprie tribu locali."
        action={
          <div className="flex items-center gap-2">
            <Link href="/map" className={buttonVariants({ size: "sm", variant: "outline" })}>
              Torna alla mappa
            </Link>
          </div>
        }
      />

      {params.error ? (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/12 px-3 py-2 text-sm text-destructive">
          {params.error}
        </p>
      ) : null}

      {warning ? (
        <p className="rounded-2xl border border-border/70 bg-secondary/30 px-3 py-2 text-sm text-muted-foreground">
          {warning}
        </p>
      ) : null}

      {tribes.length === 0 ? (
        <StateCard
          variant="empty"
          title="Nessuna tribu disponibile"
          description="Scegli da 1 a 3 passioni e completa la tua citta. Entrerai automaticamente nelle tribu locali della tua provincia e potrai creare rituali."
        />
      ) : (
        <RitualCreateForm tribes={tribes} action={createRitualAction} />
      )}
    </section>
  );
}
