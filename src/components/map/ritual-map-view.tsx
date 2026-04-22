"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AreaMap } from "@/components/map/area-map";
import { MapRitualCard } from "@/components/map/map-ritual-card";
import { StateCard } from "@/components/state-card";
import { Button, buttonVariants } from "@/components/ui/button";
import type { RitualMapData, RitualMapItem } from "@/lib/map";
import { cn } from "@/lib/utils";

type RitualMapViewProps = {
  data: RitualMapData;
};

type TimeFilter = "all" | "today" | "week";

function isToday(dateValue: Date): boolean {
  const now = new Date();
  return (
    dateValue.getFullYear() === now.getFullYear() &&
    dateValue.getMonth() === now.getMonth() &&
    dateValue.getDate() === now.getDate()
  );
}

function isThisWeek(dateValue: Date): boolean {
  const now = new Date();
  const end = new Date(now);
  end.setDate(now.getDate() + 7);
  return dateValue >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) && dateValue < end;
}

function filterRituals(
  rituals: RitualMapItem[],
  timeFilter: TimeFilter,
  passionFilter: string,
) {
  return rituals.filter((ritual) => {
    const ritualDate = new Date(ritual.scheduledFor);
    const timeMatches =
      timeFilter === "all" ||
      (timeFilter === "today" && isToday(ritualDate)) ||
      (timeFilter === "week" && isThisWeek(ritualDate));
    const passionMatches = passionFilter === "all" || ritual.passionSlug === passionFilter;
    return timeMatches && passionMatches;
  });
}

export function RitualMapView({ data }: RitualMapViewProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [passionFilter, setPassionFilter] = useState<string>("all");

  const filteredRituals = useMemo(
    () => filterRituals(data.rituals, timeFilter, passionFilter),
    [data.rituals, passionFilter, timeFilter],
  );

  const mappedRitualsCount = filteredRituals.filter(
    (ritual) => ritual.latitude !== null && ritual.longitude !== null,
  ).length;

  if (data.passions.length === 0) {
    return (
      <StateCard
        variant="empty"
        title="Aggiungi prima le tue passioni"
        description="Scegli da 1 a 3 passioni per vedere i rituali delle tue tribu locali nella mappa."
      />
    );
  }

  if (data.locationStatus === "missing-city") {
    return (
      <StateCard
        variant="empty"
        title="Aggiungi la tua citta"
        description="Inserisci un comune italiano nelle impostazioni per entrare nelle tribu locali della tua provincia e vedere i rituali in mappa."
      />
    );
  }

  if (data.locationStatus === "missing-province") {
    return (
      <StateCard
        variant="empty"
        title="Citta da verificare"
        description="La tua citta non e stata riconosciuta correttamente. Controlla il nome del comune nelle impostazioni per attivare la mappa dei rituali."
      />
    );
  }

  return (
    <>
      <div className="stats-grid">
        <div className="app-grid-stat">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            La tua zona
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight">
            {data.viewerLocationLabel ?? "Completa il profilo"}
          </p>
        </div>
        <div className="app-grid-stat">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Tribu attive
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight">{data.tribeCount}</p>
        </div>
        <div className="app-grid-stat">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Rituali visibili
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight">{filteredRituals.length}</p>
        </div>
      </div>

      {data.warning ? (
        <p className="rounded-md border border-border/70 bg-secondary/30 p-2 text-xs text-muted-foreground">
          {data.warning}
        </p>
      ) : null}

      <div className="surface-elevated flex flex-col gap-3 rounded-[1.8rem] border border-border/80 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
              Rituali delle tue tribu
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Vedi solo i rituali delle tribu locali che corrispondono alle tue passioni nella
              provincia di{" "}
              <span className="font-semibold text-foreground">{data.viewerProvince ?? "riferimento"}</span>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/rituals/create"
              className={buttonVariants({ size: "xs", variant: "outline" })}
            >
              Crea rituale
            </Link>
            <span className="rounded-full border border-border/80 bg-black/14 px-3 py-1.5 text-xs text-muted-foreground">
              {data.tribeCount} tribu locali
            </span>
            <span className="rounded-full border border-border/80 bg-black/14 px-3 py-1.5 text-xs text-muted-foreground">
              {mappedRitualsCount} marker rituali
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {([
            { key: "all", label: "Tutti" },
            { key: "today", label: "Oggi" },
            { key: "week", label: "Questa settimana" },
          ] as const).map((filter) => (
            <Button
              key={filter.key}
              type="button"
              size="xs"
              variant={timeFilter === filter.key ? "secondary" : "outline"}
              className={cn("rounded-full px-3", timeFilter === filter.key && "border-primary/22 bg-primary/12 text-primary")}
              onClick={() => setTimeFilter(filter.key)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Per passione
          </span>
          <Button
            type="button"
            size="xs"
            variant={passionFilter === "all" ? "secondary" : "outline"}
            className={cn("rounded-full px-3", passionFilter === "all" && "border-primary/22 bg-primary/12 text-primary")}
            onClick={() => setPassionFilter("all")}
          >
            Tutte
          </Button>
          {data.passions.map((passion) => (
            <Button
              key={passion.slug}
              type="button"
              size="xs"
              variant={passionFilter === passion.slug ? "secondary" : "outline"}
              className="rounded-full px-3"
              style={
                passionFilter === passion.slug
                  ? {
                      color: passion.color.badgeText,
                      backgroundColor: passion.color.badgeBackground,
                      borderColor: passion.color.badgeBorder,
                    }
                  : undefined
              }
              onClick={() => setPassionFilter(passion.slug)}
            >
              {passion.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(19rem,0.82fr)] xl:items-start">
        <div className="order-1 flex flex-col gap-3">
          <div className="surface-elevated overflow-hidden rounded-[1.9rem] border border-border/80 p-2.5 sm:p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-1 pb-3">
              <div>
                <p className="text-sm font-semibold tracking-tight">Rituali in mappa</p>
                <p className="text-xs text-muted-foreground">
                  Marker colorati per passione, solo per le tribu locali a cui appartieni.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-primary/18 bg-primary/8 px-2.5 py-1 text-[11px] text-primary">
                  Provincia: {data.viewerProvince ?? "n.d."}
                </span>
                <span className="rounded-full border border-border/80 bg-black/14 px-2.5 py-1 text-[11px] text-muted-foreground">
                  {filteredRituals.length} rituali filtrati
                </span>
              </div>
            </div>
            <div className="pt-3">
              <AreaMap rituals={filteredRituals} viewerProvince={data.viewerProvince} />
            </div>
          </div>
        </div>

        <div className="order-2 flex flex-col gap-3">
          <div className="surface-elevated flex flex-col gap-3 rounded-[1.8rem] border border-border/80 p-3.5 sm:p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold tracking-tight">Rituali trovati</p>
                <p className="text-xs text-muted-foreground">
                  Appuntamenti delle tue tribu locali filtrati per tempo e passione.
                </p>
              </div>
              <span className="rounded-full border border-border/80 bg-black/14 px-2.5 py-1 text-[11px] text-muted-foreground">
                {filteredRituals.length} risultati
              </span>
            </div>

            {filteredRituals.length === 0 ? (
              <StateCard
                variant="empty"
                title="Nessun rituale per questi filtri"
                description="Prova a cambiare intervallo o passione, oppure crea un nuovo rituale dentro una delle tue tribu locali."
              />
            ) : (
              <div className="flex flex-col gap-3 xl:max-h-[38rem] xl:overflow-y-auto xl:pr-1">
                {filteredRituals.map((ritual) => (
                  <MapRitualCard key={ritual.id} ritual={ritual} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
