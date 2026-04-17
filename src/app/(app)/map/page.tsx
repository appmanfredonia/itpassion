import Link from "next/link";
import { redirect } from "next/navigation";
import { AreaMap } from "@/components/map/area-map";
import { SectionHeader } from "@/components/section-header";
import { StateCard } from "@/components/state-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { ensureUserProfile } from "@/lib/auth";
import { formatLocationLabel } from "@/lib/location";
import {
  getPassionMapData,
  normalizeMapAreaFilter,
  type MapAreaFilter,
} from "@/lib/map";
import { createServerSupabaseClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type MapPageProps = {
  searchParams: Promise<{
    area?: string;
  }>;
};

function avatarFallback(username: string): string {
  const normalized = username.trim();
  if (normalized.length === 0) {
    return "IT";
  }

  return normalized.slice(0, 2).toUpperCase();
}

function filterHref(area: MapAreaFilter) {
  return area === "all" ? "/map" : `/map?area=${area}`;
}

export default async function MapPage({ searchParams }: MapPageProps) {
  const params = await searchParams;
  const selectedArea = normalizeMapAreaFilter(params.area);
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
    mapData = await getPassionMapData(supabase, user.id, selectedArea);
  } catch {
    hasError = true;
  }

  if (hasError || !mapData) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <StateCard
          variant="error"
          title="Mappa non disponibile"
          description="Non siamo riusciti a caricare le persone vicine alle tue passioni."
        />
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <SectionHeader
        badge="Mappa"
        title="Persone vicine alle tue passioni"
        description="Un punto d'incontro per trovare profili con interessi in comune nella tua zona, senza mostrare posizioni precise."
      />

      <div className="stats-grid">
        <div className="app-grid-stat">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            La tua area
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
            Profili trovati
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
      ) : (
        <>
          <div className="app-page-shell flex flex-wrap items-center gap-2.5">
            {[
              { label: "Stessa provincia", value: "province" as const },
              { label: "Stessa regione", value: "region" as const },
              { label: "Ovunque", value: "all" as const },
            ].map((filterOption) => (
              <Link
                key={filterOption.value}
                href={filterHref(filterOption.value)}
                className={cn(
                  buttonVariants({
                    size: "sm",
                    variant: selectedArea === filterOption.value ? "secondary" : "outline",
                  }),
                )}
              >
                {filterOption.label}
              </Link>
            ))}
            <div className="ml-auto flex flex-wrap gap-2">
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

          <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="order-2 flex flex-col gap-3 lg:order-1">
              {mapData.results.length === 0 ? (
                <StateCard
                  variant="empty"
                  title="Nessun profilo compatibile"
                  description="Completa citta e provincia nel profilo o allarga il filtro geografico."
                />
              ) : (
                mapData.results.map((result) => (
                  <Link
                    key={result.userId}
                    href={`/profile/${result.username}`}
                    className="surface-panel flex items-start gap-3 rounded-[1.5rem] p-3.5 transition-colors hover:border-primary/40"
                  >
                    <Avatar size="lg">
                      {result.avatarUrl ? (
                        <AvatarImage src={result.avatarUrl} alt={`Avatar di @${result.username}`} />
                      ) : null}
                      <AvatarFallback>{avatarFallback(result.username)}</AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold tracking-tight">{result.displayName}</p>
                        <p className="truncate text-xs text-muted-foreground">@{result.username}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatLocationLabel(result) ?? "Area non completata"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {result.commonPassions.map((passion) => (
                          <span
                            key={`${result.userId}-${passion.slug}`}
                            className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
                          >
                            {passion.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            <div className="order-1 flex flex-col gap-3 lg:order-2">
              <AreaMap clusters={mapData.clusters} />
              <p className="px-1 text-xs leading-relaxed text-muted-foreground">
                Le posizioni sono sempre approssimate per area e servono solo a favorire incontri
                tra passioni comuni nella stessa provincia o regione.
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
