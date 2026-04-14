import { StateCard } from "@/components/state-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SavedLoading() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Skeleton className="h-8 w-56" />
      <StateCard
        variant="loading"
        title="Caricamento salvati"
        description="Stiamo recuperando i contenuti che hai salvato."
      />
    </section>
  );
}
