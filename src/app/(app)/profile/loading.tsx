import { StateCard } from "@/components/state-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-52 w-full" />
      <StateCard
        variant="loading"
        title="Caricamento profilo"
        description="Stiamo recuperando i dati del profilo e i contenuti pubblicati."
      />
    </section>
  );
}
