import { Skeleton } from "@/components/ui/skeleton";
import { StateCard } from "@/components/state-card";

export default function NotificationsLoading() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Skeleton className="h-8 w-44" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <StateCard
        variant="loading"
        title="Caricamento notifiche"
        description="Recupero follower, like, commenti, nuove chat e messaggi recenti."
      />
    </section>
  );
}
