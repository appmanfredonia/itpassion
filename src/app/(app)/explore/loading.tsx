import { StateCard } from "@/components/state-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExploreLoading() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-20 w-full" />
      <StateCard
        variant="loading"
        title="Caricamento Esplora"
        description="Stiamo recuperando passioni, autori e contenuti da Supabase."
      />
    </section>
  );
}
