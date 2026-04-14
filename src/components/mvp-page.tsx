import type { ReactNode } from "react";
import { StateCard } from "@/components/state-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type MvpPageProps = {
  title: string;
  description: string;
  milestone: string;
  children?: ReactNode;
};

export function MvpPage({ title, description, milestone, children }: MvpPageProps) {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary" className="text-[10px] tracking-[0.2em] uppercase">
          {milestone}
        </Badge>
        <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
      </div>

      <Card className="border-border/70 bg-card/85">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {children ?? (
            <p className="text-sm text-muted-foreground">
              Struttura pronta. In milestone successive verranno collegati dati reali, azioni e redirect.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        <StateCard
          variant="loading"
          title="Loading"
          description="Skeleton e stato di caricamento sono pronti da riusare."
        />
        <StateCard
          variant="empty"
          title="Empty"
          description="Gestiamo subito il caso senza dati per evitare pagine vuote."
        />
        <StateCard
          variant="error"
          title="Error"
          description="Errore presentato in modo chiaro, con messaggio comprensibile."
        />
      </div>
    </section>
  );
}

