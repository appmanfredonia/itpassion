import { StateCard } from "@/components/state-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MessagesLoading() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Skeleton className="h-8 w-44" />
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Skeleton className="h-[520px] w-full" />
        <Skeleton className="h-[520px] w-full" />
      </div>
      <StateCard
        variant="loading"
        title="Caricamento messaggi"
        description="Stiamo recuperando conversazioni e cronologia chat."
      />
    </section>
  );
}
