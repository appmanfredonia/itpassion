import { StateCard } from "@/components/state-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CreateLoading() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Skeleton className="h-8 w-44" />
      <Skeleton className="h-52 w-full" />
      <StateCard
        variant="loading"
        title="Preparazione editor"
        description="Carichiamo passioni e contesto per creare il post."
      />
    </section>
  );
}

