import { StateCard } from "@/components/state-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeedLoading() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-12 w-full" />
      <StateCard
        variant="loading"
        title="Caricamento feed"
        description="Stiamo recuperando i contenuti reali da Supabase."
      />
    </section>
  );
}

