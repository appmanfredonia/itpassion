import { SectionHeader } from "@/components/section-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function RitualCreateLoading() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <SectionHeader
        badge="Rituali"
        title="Crea rituale"
        description="Stiamo preparando il form della tua tribu locale."
      />

      <div className="surface-elevated flex flex-col gap-4 rounded-[1.8rem] p-5">
        <Skeleton className="h-11 w-full rounded-[1.2rem]" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-20 rounded-[1.2rem]" />
          <Skeleton className="h-20 rounded-[1.2rem]" />
          <Skeleton className="h-20 rounded-[1.2rem]" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-11 rounded-[1.2rem]" />
          <Skeleton className="h-11 rounded-[1.2rem]" />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-11 rounded-[1.2rem]" />
          <Skeleton className="h-11 rounded-[1.2rem]" />
          <Skeleton className="h-11 rounded-[1.2rem]" />
        </div>
        <Skeleton className="h-32 rounded-[1.35rem]" />
        <div className="flex justify-end">
          <Skeleton className="h-11 w-36 rounded-2xl" />
        </div>
      </div>
    </section>
  );
}
