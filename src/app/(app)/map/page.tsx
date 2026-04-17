import { redirect } from "next/navigation";
import { AreaMap } from "@/components/map/area-map";
import { MapResultCard } from "@/components/map/map-result-card";
import { SectionHeader } from "@/components/section-header";
import { StateCard } from "@/components/state-card";
import { ensureUserProfile } from "@/lib/auth";
import { getPassionMapData } from "@/lib/map";
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
  let mapData: Awaited<ReturnType<typeof getPassionMapData>> | null = null;

  try {
    await ensureUserProfile(supabase, user);
    mapData = await getPassionMapData(supabase, user.id);
  } catch {
    hasError = true;
  }

  if (hasError || !mapData) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <StateCard
          variant="error"
          title="Mappa non disponibile"
          description="Non siamo riusciti a caricare le persone con le tue passioni nella tua provincia."
        />
      </section>
    );
  }

  const mappedResultsCount = mapData.results.filter(
    (result) => result.latitude !== null && result.longitude !== null,
  ).length;

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <SectionHeader
        badge="Mappa"
        title="Persone con le tue passioni nella tua provincia"
        description="Trova utenti che condividono almeno una passione con te e vivono nella tua stessa provincia, senza mostrare posizioni precise."
      />

      <div className="stats-grid">
        <div className="app-grid-stat">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            La tua zona
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight">
            {mapData.viewerLocationLabel ?? "Completa il profilo"}
          </p>
        </div>
        <div className="app-grid-stat">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Passioni usate
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight">{mapData.passions.length}</p>
        </div>
        <div className="app-grid-stat">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Persone compatibili
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight">{mapData.results.length}</p>
        </div>
      </div>

      {mapData.passions.length === 0 ? (
        <StateCard
          variant="empty"
          title="Aggiungi prima le tue passioni"
          description="Completa onboarding o aggiorna il profilo per trovare persone affini nella mappa."
        />
      ) : mapData.locationStatus === "missing-city" ? (
        <StateCard
          variant="empty"
          title="Aggiungi la tua citta"
          description="Inserisci un comune italiano nelle impostazioni per trovare persone con le tue passioni nella tua provincia."
        />
      ) : mapData.locationStatus === "missing-province" ? (
        <StateCard
          variant="empty"
          title="Citta da verificare"
          description="La tua citta non e stata riconosciuta correttamente. Controlla il nome del comune nelle impostazioni per attivare la mappa."
        />
      ) : (
        <>
          <div className="surface-elevated flex flex-col gap-3 rounded-[1.8rem] border border-border/80 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
                  Vista locale
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Ti mostriamo solo profili con almeno una passione in comune nella provincia di{" "}
                  <span className="font-semibold text-foreground">
                    {mapData.viewerProvince ?? "riferimento"}
                  </span>
                  .
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-border/80 bg-black/14 px-3 py-1.5 text-xs text-muted-foreground">
                  Area approssimata
                </span>
                <span className="rounded-full border border-border/80 bg-black/14 px-3 py-1.5 text-xs text-muted-foreground">
                  {mapData.results.length} profili trovati
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {mapData.passions.map((passion) => (
                <span
                  key={passion.slug}
                  className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                >
                  {passion.name}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(19rem,0.82fr)] xl:items-start">
            <div className="order-1 flex flex-col gap-3">
              <div className="surface-elevated overflow-hidden rounded-[1.9rem] border border-border/80 p-2.5 sm:p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-1 pb-3">
                  <div>
                    <p className="text-sm font-semibold tracking-tight">Area condivisa</p>
                    <p className="text-xs text-muted-foreground">
                      Marker e presenza vengono mostrati in modo approssimato.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-primary/18 bg-primary/8 px-2.5 py-1 text-[11px] text-primary">
                      Provincia: {mapData.viewerProvince ?? "n.d."}
                    </span>
                    <span className="rounded-full border border-border/80 bg-black/14 px-2.5 py-1 text-[11px] text-muted-foreground">
                      {mappedResultsCount} marker attivi
                    </span>
                  </div>
                </div>
                <div className="pt-3">
                  <AreaMap results={mapData.results} viewerProvince={mapData.viewerProvince} />
                </div>
              </div>
              <p className="px-1 text-xs leading-relaxed text-muted-foreground">
                Le posizioni sono sempre approssimate per area e servono solo a favorire incontri
                tra persone con passioni in comune nella stessa provincia.
              </p>
            </div>

            <div className="order-2 flex flex-col gap-3">
              <div className="surface-elevated flex flex-col gap-3 rounded-[1.8rem] border border-border/80 p-3.5 sm:p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold tracking-tight">Utenti trovati</p>
                    <p className="text-xs text-muted-foreground">
                      Profili compatibili nella tua provincia, ordinati per passioni in comune.
                    </p>
                  </div>
                  <span className="rounded-full border border-border/80 bg-black/14 px-2.5 py-1 text-[11px] text-muted-foreground">
                    {mapData.results.length} risultati
                  </span>
                </div>

                {mapData.results.length === 0 ? (
                  <StateCard
                    variant="empty"
                    title="Nessun profilo compatibile"
                    description="Al momento non ci sono utenti con passioni in comune nella tua stessa provincia."
                  />
                ) : (
                  <div className="flex flex-col gap-3 xl:max-h-[38rem] xl:overflow-y-auto xl:pr-1">
                    {mapData.results.map((result) => (
                      <MapResultCard key={result.userId} result={result} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
