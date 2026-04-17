import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type AreaMapProps = {
  clusters: {
    key: string;
    label: string;
    latitude: number;
    longitude: number;
    count: number;
  }[];
};

const ITALY_BOUNDS = {
  minLatitude: 36.5,
  maxLatitude: 47.2,
  minLongitude: 6.3,
  maxLongitude: 18.7,
};

function toMarkerPosition(latitude: number, longitude: number) {
  const xProgress =
    ((longitude - ITALY_BOUNDS.minLongitude) /
      (ITALY_BOUNDS.maxLongitude - ITALY_BOUNDS.minLongitude)) *
    100;
  const yProgress =
    100 -
    ((latitude - ITALY_BOUNDS.minLatitude) /
      (ITALY_BOUNDS.maxLatitude - ITALY_BOUNDS.minLatitude)) *
      100;

  return {
    left: `${Math.min(92, Math.max(8, xProgress))}%`,
    top: `${Math.min(86, Math.max(12, yProgress))}%`,
  };
}

export function AreaMap({ clusters }: AreaMapProps) {
  if (clusters.length === 0) {
    return (
      <div className="relative flex min-h-[20rem] items-center justify-center overflow-hidden rounded-[1.8rem] border border-border/80 bg-[radial-gradient(circle_at_top,oklch(0.73_0.16_294_/_0.16),transparent_30%),linear-gradient(180deg,rgba(12,17,30,1),rgba(7,10,18,1))] p-6">
        <div className="text-center">
          <p className="text-sm font-semibold tracking-tight">Nessun punto da mostrare</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Completa la tua citta per trovare persone con passioni simili nella tua provincia.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[22rem] overflow-hidden rounded-[1.8rem] border border-border/80 bg-[radial-gradient(circle_at_top,oklch(0.73_0.16_294_/_0.18),transparent_30%),linear-gradient(180deg,rgba(12,17,30,1),rgba(7,10,18,1))]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:2.2rem_2.2rem] opacity-35" />
      <div className="absolute inset-x-12 top-6 h-28 rounded-full bg-primary/18 blur-[96px]" />
      <div className="absolute left-[14%] top-[16%] h-[28%] w-[24%] rounded-[45%] border border-white/6 bg-white/4 blur-[0.5px]" />
      <div className="absolute left-[32%] top-[30%] h-[34%] w-[24%] rounded-[42%] border border-white/6 bg-white/4 blur-[0.5px]" />
      <div className="absolute left-[56%] top-[48%] h-[20%] w-[12%] rounded-[44%] border border-white/6 bg-white/4 blur-[0.5px]" />

      {clusters.map((cluster) => {
        const markerPosition = toMarkerPosition(cluster.latitude, cluster.longitude);

        return (
          <div
            key={cluster.key}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={markerPosition}
          >
            <div className="flex flex-col items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/16 px-2.5 py-1 text-[11px] font-semibold text-primary shadow-[0_18px_38px_-26px_oklch(0.73_0.16_294_/_0.82)] backdrop-blur-sm">
                <MapPin className="size-3" />
                {cluster.count > 1 ? `${cluster.label} - ${cluster.count}` : cluster.label}
              </span>
              <span
                className={cn(
                  "inline-flex size-3 rounded-full border border-white/20 bg-primary shadow-[0_10px_26px_-12px_oklch(0.73_0.16_294_/_0.88)]",
                  cluster.count > 1 && "size-3.5",
                )}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
