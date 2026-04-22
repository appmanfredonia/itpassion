import { SectionHeader } from "@/components/section-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function RitualDetailLoading() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <SectionHeader
        badge="Rituale"
        title="Stiamo preparando il rituale"
        description="Carichiamo dettagli, partecipanti e mappa locale."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(18rem,0.82fr)] xl:items-start">
        <div className="flex flex-col gap-4">
          <div className="surface-elevated rounded-[1.8rem] p-5">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="mt-4 h-8 w-2/3" />
            <Skeleton className="mt-2 h-4 w-1/2" />
            <div className="mt-4 flex flex-wrap gap-2">
              <Skeleton className="h-8 w-40 rounded-full" />
              <Skeleton className="h-8 w-36 rounded-full" />
              <Skeleton className="h-8 w-32 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-16 w-full" />
          </div>
          <div className="surface-elevated rounded-[1.8rem] p-4">
            <Skeleton className="h-[18rem] w-full rounded-[1.4rem]" />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="surface-elevated rounded-[1.8rem] p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-16 w-full rounded-[1.1rem]" />
          </div>
          <div className="surface-elevated rounded-[1.8rem] p-4">
            <Skeleton className="h-4 w-28" />
            <div className="mt-3 flex flex-col gap-2">
              <Skeleton className="h-14 w-full rounded-[1.1rem]" />
              <Skeleton className="h-14 w-full rounded-[1.1rem]" />
              <Skeleton className="h-14 w-full rounded-[1.1rem]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
