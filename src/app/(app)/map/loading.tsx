import { SectionHeader } from "@/components/section-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function MapLoading() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <SectionHeader
        badge="Mappa"
        title="Persone con le tue passioni nella tua provincia"
        description="Stiamo preparando la vista locale e i profili compatibili."
      />

      <div className="stats-grid">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="app-grid-stat flex flex-col gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>

      <div className="surface-elevated rounded-[1.8rem] p-4 sm:p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-3 w-full max-w-2xl" />
        <div className="mt-4 flex flex-wrap gap-2">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(19rem,0.82fr)] xl:items-start">
        <div className="surface-elevated rounded-[1.9rem] p-3">
          <Skeleton className="h-[20rem] w-full rounded-[1.7rem] sm:h-[24rem]" />
        </div>
        <div className="surface-elevated flex flex-col gap-3 rounded-[1.8rem] p-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-full max-w-56" />
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-[1.5rem] border border-border/70 p-3">
              <div className="flex items-start gap-3">
                <Skeleton className="size-12 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-36 rounded-full" />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
