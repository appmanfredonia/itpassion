"use client";

import { useMemo, useState } from "react";
import { CalendarDays, MapPin, Sparkles, Users } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { ViewerLocalTribe } from "@/lib/rituals";

type RitualCreateFormProps = {
  tribes: ViewerLocalTribe[];
  action: (formData: FormData) => void | Promise<void>;
};

function toDateTimeIso(date: string, time: string): string {
  if (!date || !time) {
    return "";
  }

  const localDate = new Date(`${date}T${time}`);
  if (Number.isNaN(localDate.getTime())) {
    return "";
  }

  return localDate.toISOString();
}

export function RitualCreateForm({ tribes, action }: RitualCreateFormProps) {
  const [selectedTribeId, setSelectedTribeId] = useState(tribes[0]?.id ?? "");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const selectedTribe = useMemo(
    () => tribes.find((tribe) => tribe.id === selectedTribeId) ?? tribes[0] ?? null,
    [selectedTribeId, tribes],
  );
  const scheduledForIso = useMemo(
    () => toDateTimeIso(scheduledDate, scheduledTime),
    [scheduledDate, scheduledTime],
  );

  return (
    <form action={action} className="app-page-shell flex flex-col gap-4 rounded-[1.8rem] px-4 py-4 sm:px-5 sm:py-5">
      <input type="hidden" name="scheduledForIso" value={scheduledForIso} />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(15rem,0.8fr)]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ritual-title">Titolo</Label>
          <Input
            id="ritual-title"
            name="title"
            maxLength={120}
            placeholder="Jam session sul lago, photowalk al tramonto, training di gruppo..."
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ritual-tribe">Tribu associata</Label>
          <select
            id="ritual-tribe"
            name="tribeId"
            value={selectedTribeId}
            onChange={(event) => setSelectedTribeId(event.target.value)}
            className="h-11 rounded-[1.2rem] border border-input bg-surface-1 px-3 text-sm"
            required
          >
            {tribes.map((tribe) => (
              <option key={tribe.id} value={tribe.id}>
                {tribe.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedTribe ? (
        <div className="grid gap-3 rounded-[1.35rem] border border-border/80 bg-surface-1/92 p-3.5 sm:grid-cols-3">
          <div className="flex items-center gap-2.5">
            <span
              className="inline-flex size-8 items-center justify-center rounded-full border"
              style={{
                color: selectedTribe.color.badgeText,
                backgroundColor: selectedTribe.color.badgeBackground,
                borderColor: selectedTribe.color.badgeBorder,
              }}
            >
              <Sparkles className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Passione
              </p>
              <p className="truncate text-sm font-semibold">{selectedTribe.passionName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-8 items-center justify-center rounded-full border border-border/80 bg-black/16 text-muted-foreground">
              <MapPin className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Provincia
              </p>
              <p className="truncate text-sm font-semibold">{selectedTribe.province}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-8 items-center justify-center rounded-full border border-border/80 bg-black/16 text-muted-foreground">
              <Users className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Logica
              </p>
              <p className="truncate text-sm font-semibold">Rituale della tua tribu locale</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ritual-city">Citta</Label>
          <Input
            id="ritual-city"
            name="city"
            maxLength={80}
            placeholder="Bologna, Modena, Rimini..."
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ritual-place">Luogo</Label>
          <Input
            id="ritual-place"
            name="place"
            maxLength={120}
            placeholder="Parco della Montagnola, Studio 54, Piazza Maggiore..."
            required
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ritual-date">Data</Label>
          <Input
            id="ritual-date"
            name="scheduledDate"
            type="date"
            value={scheduledDate}
            onChange={(event) => setScheduledDate(event.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ritual-time">Ora</Label>
          <Input
            id="ritual-time"
            name="scheduledTime"
            type="time"
            value={scheduledTime}
            onChange={(event) => setScheduledTime(event.target.value)}
            step={300}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ritual-max-participants">Partecipanti massimi</Label>
          <Input
            id="ritual-max-participants"
            name="maxParticipants"
            type="number"
            min={2}
            max={500}
            placeholder="Facoltativo"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ritual-description">Descrizione</Label>
        <Textarea
          id="ritual-description"
          name="description"
          maxLength={600}
          placeholder="Spiega il mood del rituale, cosa portare e perche vale la pena esserci."
          className="min-h-32 resize-none rounded-[1.35rem]"
        />
      </div>

      <div className="rounded-[1.25rem] border border-border/80 bg-surface-1/92 px-3.5 py-3 text-xs leading-relaxed text-muted-foreground">
        Crea un rituale solo dentro una tribu a cui appartieni. La data viene salvata in base all&apos;orario scelto dal tuo dispositivo, cosi il dettaglio resta coerente tra feed, mappa e pagina rituale.
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" />
          Si aprira una pagina dettaglio con partecipazione e mappa locale.
        </div>
        <Button type="submit" className="h-11 rounded-2xl px-5">
          Crea rituale
        </Button>
      </div>
    </form>
  );
}
