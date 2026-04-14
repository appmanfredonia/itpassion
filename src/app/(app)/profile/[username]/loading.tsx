import { StateCard } from "@/components/state-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PublicProfileLoading() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-52 w-full" />
      <StateCard
        variant="loading"
        title="Caricamento profilo pubblico"
        description="Stiamo recuperando dati autore, contatori e post."
      />
    </section>
  );
}
