"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { MapPin, Sparkles } from "lucide-react";
import type { MapUserMatch } from "@/lib/map";
import { formatLocationLabel } from "@/lib/location";

type AreaMapProps = {
  results: MapUserMatch[];
  viewerProvince: string | null;
};

type MarkerPoint = {
  result: MapUserMatch;
  latitude: number;
  longitude: number;
};

const OPEN_FREE_MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const DEFAULT_CENTER: [number, number] = [12.5674, 42.1265];
const DEFAULT_ZOOM = 5.4;
const SINGLE_RESULT_ZOOM = 9.6;

function avatarFallback(username: string): string {
  const normalized = username.trim();
  if (normalized.length === 0) {
    return "IT";
  }

  return normalized.slice(0, 2).toUpperCase();
}

function createPopupContent(result: MapUserMatch): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.className = "itpassion-map-popup-card";

  const header = document.createElement("div");
  header.className = "itpassion-map-popup-header";
  wrapper.appendChild(header);

  const avatar = document.createElement("div");
  avatar.className = "itpassion-map-popup-avatar";
  header.appendChild(avatar);

  if (result.avatarUrl) {
    const image = document.createElement("img");
    image.src = result.avatarUrl;
    image.alt = `Avatar di @${result.username}`;
    image.className = "itpassion-map-popup-avatar-image";
    image.loading = "lazy";
    image.onerror = () => {
      avatar.textContent = avatarFallback(result.username);
      image.remove();
    };
    avatar.appendChild(image);
  } else {
    avatar.textContent = avatarFallback(result.username);
  }

  const identity = document.createElement("div");
  identity.className = "itpassion-map-popup-identity";
  header.appendChild(identity);

  const displayName = document.createElement("p");
  displayName.className = "itpassion-map-popup-name";
  displayName.textContent = result.displayName;
  identity.appendChild(displayName);

  const username = document.createElement("p");
  username.className = "itpassion-map-popup-username";
  username.textContent = `@${result.username}`;
  identity.appendChild(username);

  const location = document.createElement("p");
  location.className = "itpassion-map-popup-location";
  location.textContent = formatLocationLabel(result) ?? "Area non disponibile";
  wrapper.appendChild(location);

  const meta = document.createElement("div");
  meta.className = "itpassion-map-popup-meta";
  wrapper.appendChild(meta);

  const sharedPassions = document.createElement("span");
  sharedPassions.className = "itpassion-map-popup-badge itpassion-map-popup-badge-primary";
  sharedPassions.textContent =
    result.overlapCount === 1 ? "1 passione in comune" : `${result.overlapCount} passioni in comune`;
  meta.appendChild(sharedPassions);

  const approximateArea = document.createElement("span");
  approximateArea.className = "itpassion-map-popup-badge";
  approximateArea.textContent = "Posizione approssimata";
  meta.appendChild(approximateArea);

  if (result.commonPassions.length > 0) {
    const chips = document.createElement("div");
    chips.className = "itpassion-map-popup-chips";

    result.commonPassions.slice(0, 4).forEach((passion) => {
      const chip = document.createElement("span");
      chip.className = "itpassion-map-popup-chip";
      chip.textContent = passion.name;
      chips.appendChild(chip);
    });

    wrapper.appendChild(chips);
  }

  const action = document.createElement("a");
  action.href = `/profile/${result.username}`;
  action.className = "itpassion-map-popup-link";
  action.textContent = "Apri profilo";
  wrapper.appendChild(action);

  return wrapper;
}

function buildMarkerPoints(results: MapUserMatch[]): MarkerPoint[] {
  const groupedByCoordinate = new Map<string, MapUserMatch[]>();

  results
    .filter((result) => result.latitude !== null && result.longitude !== null)
    .forEach((result) => {
      const latitude = result.latitude?.toFixed(6);
      const longitude = result.longitude?.toFixed(6);
      if (!latitude || !longitude) {
        return;
      }

      const key = `${latitude}:${longitude}`;
      const currentGroup = groupedByCoordinate.get(key) ?? [];
      currentGroup.push(result);
      groupedByCoordinate.set(key, currentGroup);
    });

  const markerPoints: MarkerPoint[] = [];

  groupedByCoordinate.forEach((group) => {
    const orderedGroup = [...group].sort((firstUser, secondUser) =>
      firstUser.displayName.localeCompare(secondUser.displayName, "it"),
    );

    orderedGroup.forEach((result, index) => {
      const baseLatitude = result.latitude ?? 0;
      const baseLongitude = result.longitude ?? 0;

      if (orderedGroup.length === 1) {
        markerPoints.push({
          result,
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
        result,
        latitude: baseLatitude + latitudeOffset,
        longitude: baseLongitude + longitudeOffset,
      });
    });
  });

  return markerPoints;
}

function createMarkerElement(result: MapUserMatch): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "itpassion-map-marker";
  button.setAttribute(
    "aria-label",
    `Apri il popup di ${result.displayName}, ${result.overlapCount} passioni in comune`,
  );

  const pulse = document.createElement("span");
  pulse.className = "itpassion-map-marker-pulse";
  button.appendChild(pulse);

  const core = document.createElement("span");
  core.className = "itpassion-map-marker-core";
  button.appendChild(core);

  const count = document.createElement("span");
  count.className = "itpassion-map-marker-count";
  count.textContent = String(result.overlapCount);
  button.appendChild(count);

  return button;
}

export function AreaMap({ results, viewerProvince }: AreaMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasMapError, setHasMapError] = useState(false);

  const markerPoints = useMemo(() => buildMarkerPoints(results), [results]);

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
      map.resize();
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
      }).setDOMContent(createPopupContent(markerPoint.result));

      const marker = new maplibregl.Marker({
        element: createMarkerElement(markerPoint.result),
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
      maxZoom: 9.25,
    });
  }, [isLoaded, markerPoints]);

  return (
    <div className="maplibre-shell relative isolate min-h-[18rem] overflow-hidden rounded-[1.75rem] border border-border/80 bg-[linear-gradient(180deg,rgba(8,11,20,1),rgba(5,8,15,1))] sm:min-h-[21rem] xl:min-h-[27rem]">
      <div ref={containerRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(0.73_0.16_294_/_0.12),transparent_32%),linear-gradient(180deg,rgba(7,10,18,0.05),rgba(4,6,12,0.22))]" />

      <div className="pointer-events-none absolute left-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2 sm:left-4 sm:top-4">
        <span className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-black/42 px-2.5 py-1 text-[11px] text-muted-foreground backdrop-blur-md">
          <MapPin className="size-3" />
          Provincia: {viewerProvince ?? "n.d."}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] text-primary backdrop-blur-md">
          <Sparkles className="size-3" />
          {markerPoints.length} marker reali
        </span>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[17rem] rounded-2xl border border-border/70 bg-black/40 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground backdrop-blur-md sm:bottom-4 sm:left-4">
        Le posizioni sono mostrate in modo approssimato per proteggere la privacy.
      </div>

      {!isLoaded && !hasMapError ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[linear-gradient(180deg,rgba(8,11,20,0.7),rgba(5,8,15,0.82))] px-6">
          <div className="rounded-[1.4rem] border border-border/80 bg-black/34 px-5 py-4 text-center backdrop-blur-md">
            <p className="text-sm font-semibold tracking-tight">Stiamo caricando la mappa reale</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Tra pochi secondi vedrai i marker delle persone con le tue stesse passioni.
            </p>
          </div>
        </div>
      ) : null}

      {hasMapError ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
          <div className="max-w-sm rounded-[1.4rem] border border-border/80 bg-black/50 px-5 py-4 text-center backdrop-blur-md">
            <p className="text-sm font-semibold tracking-tight">Mappa momentaneamente non disponibile</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Non siamo riusciti a inizializzare la mappa reale. Riprova tra pochi secondi.
            </p>
          </div>
        </div>
      ) : null}

      {isLoaded && !hasMapError && markerPoints.length === 0 ? (
        <div className="absolute inset-x-4 bottom-16 z-10 sm:bottom-20 sm:left-4 sm:right-auto sm:max-w-sm">
          <div className="rounded-[1.35rem] border border-border/80 bg-black/48 px-4 py-3 text-sm text-muted-foreground backdrop-blur-md">
            Nessun profilo geolocalizzato da mostrare in questo momento nella tua provincia.
          </div>
        </div>
      ) : null}
    </div>
  );
}
