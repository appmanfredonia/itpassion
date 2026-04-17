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
      <div className="relative flex min-h-[18rem] items-center justify-center overflow-hidden rounded-[1.75rem] border border-border/80 bg-[radial-gradient(circle_at_top,oklch(0.73_0.16_294_/_0.14),transparent_28%),linear-gradient(180deg,rgba(10,13,23,1),rgba(6,9,17,1))] p-6 sm:min-h-[21rem] xl:min-h-[27rem]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:2.3rem_2.3rem] opacity-30" />
        <div className="absolute inset-x-10 top-0 h-24 rounded-full bg-primary/12 blur-3xl" />
        <div className="relative max-w-sm rounded-[1.4rem] border border-border/80 bg-black/24 p-4 text-center backdrop-blur-sm">
          <p className="text-sm font-semibold tracking-tight">Nessun punto da mostrare</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Completa la tua citta per trovare persone con passioni simili nella tua provincia.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[18rem] overflow-hidden rounded-[1.75rem] border border-border/80 bg-[radial-gradient(circle_at_top,oklch(0.73_0.16_294_/_0.16),transparent_28%),linear-gradient(180deg,rgba(10,13,23,1),rgba(6,9,17,1))] sm:min-h-[21rem] xl:min-h-[27rem]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:2.3rem_2.3rem] opacity-30" />
      <div className="absolute inset-x-10 top-0 h-24 rounded-full bg-primary/12 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(9,14,25,0),rgba(6,8,14,0.44)_65%,rgba(5,7,12,0.9))]" />
      <div className="absolute left-[12%] top-[15%] h-[30%] w-[23%] rounded-[45%] border border-white/7 bg-white/4" />
      <div className="absolute left-[30%] top-[28%] h-[37%] w-[24%] rounded-[42%] border border-white/7 bg-white/4" />
      <div className="absolute left-[55%] top-[48%] h-[21%] w-[13%] rounded-[44%] border border-white/7 bg-white/4" />
      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-border/80 bg-black/24 px-2.5 py-1 text-[11px] text-muted-foreground backdrop-blur-sm">
          Vista approssimata
        </span>
        <span className="rounded-full border border-primary/18 bg-primary/10 px-2.5 py-1 text-[11px] text-primary backdrop-blur-sm">
          Persone vicine per passioni condivise
        </span>
      </div>
      <div className="absolute bottom-4 right-4 rounded-full border border-border/80 bg-black/22 px-2.5 py-1 text-[11px] text-muted-foreground backdrop-blur-sm">
        Zoom ottimizzato sull&apos;Italia
      </div>

      {clusters.map((cluster) => {
        const markerPosition = toMarkerPosition(cluster.latitude, cluster.longitude);

        return (
          <div
            key={cluster.key}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={markerPosition}
          >
            <div className="flex flex-col items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-black/28 px-2.5 py-1 text-[11px] font-semibold text-primary shadow-[0_18px_38px_-28px_oklch(0.73_0.16_294_/_0.72)] backdrop-blur-md">
                <MapPin className="size-3" />
                {cluster.label}
                {cluster.count > 1 ? (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary/16 px-1.5 py-0.5 text-[10px] text-primary">
                    {cluster.count}
                  </span>
                ) : null}
              </span>
              <span className="absolute inset-x-auto top-7 size-8 rounded-full bg-primary/14 blur-md" />
              <span
                className={cn(
                  "relative inline-flex size-3 rounded-full border border-white/20 bg-primary shadow-[0_10px_26px_-12px_oklch(0.73_0.16_294_/_0.88)]",
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
