import { StateCard } from "@/components/state-card";

export default function MapLoading() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <StateCard
        variant="loading"
        title="Caricamento mappa"
        description="Stiamo cercando persone vicine alle tue passioni."
      />
    </section>
  );
}

