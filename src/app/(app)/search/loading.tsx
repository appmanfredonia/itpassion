import { StateCard } from "@/components/state-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-10 w-full" />
      <StateCard
        variant="loading"
        title="Ricerca in corso"
        description="Stiamo cercando utenti, passioni e contenuti."
      />
    </section>
  );
}
