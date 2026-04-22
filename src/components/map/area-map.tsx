"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { CalendarDays, MapPin, Sparkles } from "lucide-react";
import type { RitualMapItem } from "@/lib/map";
import { formatRitualLocationLabel } from "@/lib/rituals";

type AreaMapProps = {
  rituals: RitualMapItem[];
  viewerProvince: string | null;
};

type MarkerPoint = {
  ritual: RitualMapItem;
  latitude: number;
  longitude: number;
};

const OPEN_FREE_MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const DEFAULT_CENTER: [number, number] = [12.5674, 42.1265];
const DEFAULT_ZOOM = 5.4;
const SINGLE_RESULT_ZOOM = 10.25;

function formatSchedule(value: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function buildMarkerPoints(rituals: RitualMapItem[]): MarkerPoint[] {
  const groupedByCoordinate = new Map<string, RitualMapItem[]>();

  rituals
    .filter((ritual) => ritual.latitude !== null && ritual.longitude !== null)
    .forEach((ritual) => {
      const latitude = ritual.latitude?.toFixed(6);
      const longitude = ritual.longitude?.toFixed(6);
      if (!latitude || !longitude) {
        return;
      }

      const key = `${latitude}:${longitude}`;
      const currentGroup = groupedByCoordinate.get(key) ?? [];
      currentGroup.push(ritual);
      groupedByCoordinate.set(key, currentGroup);
    });

  const markerPoints: MarkerPoint[] = [];

  groupedByCoordinate.forEach((group) => {
    const orderedGroup = [...group].sort((firstRitual, secondRitual) =>
      firstRitual.title.localeCompare(secondRitual.title, "it"),
    );

    orderedGroup.forEach((ritual, index) => {
      const baseLatitude = ritual.latitude ?? 0;
      const baseLongitude = ritual.longitude ?? 0;

      if (orderedGroup.length === 1) {
        markerPoints.push({
          ritual,
          latitude: baseLatitude,
          longitude: baseLongitude,
        });
        return;
      }

      const ring = Math.floor(index / 6) + 1;
      const step = Math.min(orderedGroup.length, 6);
      const angle = ((index % step) / step) * Math.PI * 2;
      const latitudeOffset = Math.sin(angle) * 0.0075 * ring;
      const longitudeOffset = Math.cos(angle) * 0.0095 * ring;

      markerPoints.push({
        ritual,
        latitude: baseLatitude + latitudeOffset,
        longitude: baseLongitude + longitudeOffset,
      });
    });
  });

  return markerPoints;
}

function createPopupContent(ritual: RitualMapItem): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.className = "itpassion-map-popup-card";
  wrapper.style.setProperty("--ritual-badge-bg", ritual.color.badgeBackground);
  wrapper.style.setProperty("--ritual-badge-border", ritual.color.badgeBorder);
  wrapper.style.setProperty("--ritual-badge-text", ritual.color.badgeText);

  const header = document.createElement("div");
  header.className = "itpassion-map-popup-header";
  wrapper.appendChild(header);

  const identity = document.createElement("div");
  identity.className = "itpassion-map-popup-identity";
  header.appendChild(identity);

  const title = document.createElement("p");
  title.className = "itpassion-map-popup-name";
  title.textContent = ritual.title;
  identity.appendChild(title);

  const tribe = document.createElement("p");
  tribe.className = "itpassion-map-popup-username";
  tribe.textContent = ritual.tribeLabel;
  identity.appendChild(tribe);

  const location = document.createElement("p");
  location.className = "itpassion-map-popup-location";
  location.textContent = formatRitualLocationLabel(ritual);
  wrapper.appendChild(location);

  const meta = document.createElement("div");
  meta.className = "itpassion-map-popup-meta";
  wrapper.appendChild(meta);

  const passionBadge = document.createElement("span");
  passionBadge.className = "itpassion-map-popup-badge itpassion-map-popup-badge-primary";
  passionBadge.textContent = ritual.passionName;
  meta.appendChild(passionBadge);

  const scheduleBadge = document.createElement("span");
  scheduleBadge.className = "itpassion-map-popup-badge";
  scheduleBadge.textContent = formatSchedule(ritual.scheduledFor);
  meta.appendChild(scheduleBadge);

  const participantsBadge = document.createElement("span");
  participantsBadge.className = "itpassion-map-popup-badge";
  participantsBadge.textContent = ritual.maxParticipants
    ? `${ritual.participantCount}/${ritual.maxParticipants} partecipanti`
    : `${ritual.participantCount} partecipanti`;
  meta.appendChild(participantsBadge);

  if (ritual.description) {
    const description = document.createElement("p");
    description.className = "itpassion-map-popup-location";
    description.textContent = ritual.description;
    wrapper.appendChild(description);
  }

  const action = document.createElement("a");
  action.href = `/rituals/${ritual.id}`;
  action.className = "itpassion-map-popup-link";
  action.textContent = "Apri rituale";
  wrapper.appendChild(action);

  return wrapper;
}

function createMarkerElement(ritual: RitualMapItem): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "itpassion-map-marker";
  button.setAttribute(
    "aria-label",
    `Apri il popup del rituale ${ritual.title}, ${ritual.passionName}`,
  );
  button.style.setProperty("--ritual-marker-color", ritual.color.marker);
  button.style.setProperty("--ritual-marker-soft", ritual.color.markerSoft);

  const pulse = document.createElement("span");
  pulse.className = "itpassion-map-marker-pulse";
  button.appendChild(pulse);

  const core = document.createElement("span");
  core.className = "itpassion-map-marker-core";
  button.appendChild(core);

  const glyph = document.createElement("span");
  glyph.className = "itpassion-map-marker-count";
  glyph.textContent = ritual.passionName.slice(0, 1).toUpperCase();
  button.appendChild(glyph);

  return button;
}

export function AreaMap({ rituals, viewerProvince }: AreaMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasMapError, setHasMapError] = useState(false);

  const markerPoints = useMemo(() => buildMarkerPoints(rituals), [rituals]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OPEN_FREE_MAP_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    map.scrollZoom.disable();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    const loadTimeout = window.setTimeout(() => {
      if (!map.isStyleLoaded()) {
        setHasMapError(true);
      }
    }, 10000);

    const handleLoad = () => {
      window.clearTimeout(loadTimeout);
      setIsLoaded(true);
      setHasMapError(false);
      window.requestAnimationFrame(() => {
        map.resize();
        window.setTimeout(() => map.resize(), 140);
      });
    };

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(containerRef.current);

    map.once("load", handleLoad);
    mapRef.current = map;

    return () => {
      window.clearTimeout(loadTimeout);
      resizeObserver.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (markerPoints.length === 0) {
      map.easeTo({
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        duration: 700,
      });
      return;
    }

    const bounds = new maplibregl.LngLatBounds();

    markerPoints.forEach((markerPoint) => {
      const popup = new maplibregl.Popup({
        offset: 16,
        closeButton: false,
        maxWidth: "320px",
        className: "itpassion-map-popup",
      }).setDOMContent(createPopupContent(markerPoint.ritual));

      const marker = new maplibregl.Marker({
        element: createMarkerElement(markerPoint.ritual),
        anchor: "bottom",
      })
        .setLngLat([markerPoint.longitude, markerPoint.latitude])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
      bounds.extend([markerPoint.longitude, markerPoint.latitude]);
    });

    if (markerPoints.length === 1) {
      map.easeTo({
        center: [markerPoints[0].longitude, markerPoints[0].latitude],
        zoom: SINGLE_RESULT_ZOOM,
        duration: 850,
      });
      return;
    }

    map.fitBounds(bounds, {
      padding: {
        top: 76,
        right: 52,
        bottom: 76,
        left: 52,
      },
      duration: 900,
      maxZoom: 10.1,
    });
  }, [isLoaded, markerPoints]);

  return (
    <div className="maplibre-shell relative isolate h-[18.5rem] overflow-hidden rounded-[1.75rem] border border-border/80 bg-[linear-gradient(180deg,rgba(8,11,20,1),rgba(5,8,15,1))] sm:h-[21.5rem] xl:h-[27rem]">
      <div className="absolute inset-0 z-0">
        <div ref={containerRef} className="h-full w-full" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-24 bg-[linear-gradient(180deg,rgba(6,9,17,0.34),rgba(6,9,17,0.12),transparent)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-24 bg-[linear-gradient(0deg,rgba(4,6,12,0.34),rgba(4,6,12,0.12),transparent)]" />

      <div className="pointer-events-none absolute left-3 top-3 z-[3] flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2 sm:left-4 sm:top-4">
        <span className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-black/42 px-2.5 py-1 text-[11px] text-muted-foreground backdrop-blur-md">
          <MapPin className="size-3" />
          Provincia: {viewerProvince ?? "n.d."}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] text-primary backdrop-blur-md">
          <Sparkles className="size-3" />
          {markerPoints.length === 1 ? "1 rituale visibile" : `${markerPoints.length} rituali visibili`}
        </span>
      </div>

      {!isLoaded && !hasMapError ? (
        <div className="absolute inset-0 z-[4] flex items-center justify-center bg-[linear-gradient(180deg,rgba(8,11,20,0.52),rgba(5,8,15,0.62))] px-6">
          <div className="rounded-[1.4rem] border border-border/80 bg-black/34 px-5 py-4 text-center backdrop-blur-md">
            <p className="text-sm font-semibold tracking-tight">Stiamo caricando la mappa reale</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Tra pochi secondi vedrai i rituali delle tue tribu locali.
            </p>
          </div>
        </div>
      ) : null}

      {hasMapError ? (
        <div className="absolute inset-0 z-[4] flex items-center justify-center px-6">
          <div className="max-w-sm rounded-[1.4rem] border border-border/80 bg-black/50 px-5 py-4 text-center backdrop-blur-md">
            <p className="text-sm font-semibold tracking-tight">Mappa momentaneamente non disponibile</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Non siamo riusciti a inizializzare la mappa dei rituali. Riprova tra pochi secondi.
            </p>
          </div>
        </div>
      ) : null}

      {isLoaded && !hasMapError && markerPoints.length === 0 ? (
        <div className="absolute inset-x-4 bottom-16 z-[4] sm:bottom-20 sm:left-4 sm:right-auto sm:max-w-sm">
          <div className="rounded-[1.35rem] border border-border/80 bg-black/48 px-4 py-3 text-sm text-muted-foreground backdrop-blur-md">
            Nessun rituale geolocalizzabile da mostrare in questo momento nella tua provincia.
          </div>
        </div>
      ) : null}

      {isLoaded && !hasMapError && markerPoints.length > 0 ? (
        <div className="pointer-events-none absolute right-3 top-14 z-[3] hidden max-w-[15rem] rounded-[1.1rem] border border-border/80 bg-black/38 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground backdrop-blur-md sm:block">
          <div className="flex items-center gap-1.5 text-white/82">
            <CalendarDays className="size-3.5" />
            Solo rituali delle tue tribu attive
          </div>
        </div>
      ) : null}
    </div>
  );
}
