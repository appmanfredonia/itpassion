import Link from "next/link";
import { redirect } from "next/navigation";
import { RitualMapView } from "@/components/map/ritual-map-view";
import { SectionHeader } from "@/components/section-header";
import { StateCard } from "@/components/state-card";
import { buttonVariants } from "@/components/ui/button";
import { ensureUserProfile } from "@/lib/auth";
import { getTribalRitualMapData } from "@/lib/map";
import { createServerSupabaseClient } from "@/lib/supabase";

export default async function MapPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let hasError = false;
  let mapData: Awaited<ReturnType<typeof getTribalRitualMapData>> | null = null;

  try {
    await ensureUserProfile(supabase, user);
    mapData = await getTribalRitualMapData(supabase, user.id);
  } catch {
    hasError = true;
  }

  if (hasError || !mapData) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <StateCard
          variant="error"
          title="Mappa non disponibile"
          description="Non siamo riusciti a caricare i rituali delle tue tribu locali."
        />
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <SectionHeader
        badge="Mappa"
        title="Rituali delle tue tribu"
        description="La mappa mostra solo i rituali delle tribu locali a cui appartieni, colorati per passione e filtrabili per tempo o interesse."
        action={
          <Link href="/rituals/create" className={buttonVariants({ size: "sm" })}>
            Crea rituale
          </Link>
        }
      />

      <RitualMapView data={mapData} />
    </section>
  );
}
