import { redirect } from "next/navigation";
import { saveOnboardingPassionsAction } from "@/app/(app)/onboarding/actions";
import { StateCard } from "@/components/state-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPassionCatalog, getUserSelectedPassionSlugs } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

type OnboardingPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let passions: Awaited<ReturnType<typeof getPassionCatalog>>["passions"] = [];
  let catalogErrorMessage: string | null = null;
  try {
    ({ passions } = await getPassionCatalog(supabase));
  } catch (error) {
    console.error("[onboarding] load passions failed", error);
    catalogErrorMessage = "Impossibile caricare le passioni dal database. Riprova tra poco.";
  }

  const selectedPassions = catalogErrorMessage
    ? []
    : await getUserSelectedPassionSlugs(supabase, user);
  const selectedSet = new Set(selectedPassions);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary" className="text-[10px] tracking-[0.2em] uppercase">
          Milestone 2
        </Badge>
        <h1 className="text-2xl font-semibold md:text-3xl">Scegli le tue passioni</h1>
      </div>

      <Card className="border-border/70 bg-card/85">
        <CardHeader>
          <CardTitle>Personalizza il tuo feed</CardTitle>
          <CardDescription>
            Seleziona almeno una passione. Useremo la scelta per impostare il tuo ingresso nell&apos;app.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {params.error && (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
              {params.error}
            </p>
          )}
          {catalogErrorMessage ? (
            <StateCard
              variant="error"
              title="Catalogo passioni non disponibile"
              description={catalogErrorMessage}
            />
          ) : passions.length === 0 ? (
            <p className="rounded-md border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
              Nessuna passione disponibile nel database. Aggiungi almeno una passione per completare
              l&apos;onboarding.
            </p>
          ) : (
            <form className="flex flex-col gap-4" action={saveOnboardingPassionsAction}>
              <div className="grid gap-2 sm:grid-cols-2">
                {passions.map((passion) => (
                  <label
                    key={passion.slug}
                    className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/60 p-3 text-sm hover:border-primary/40"
                  >
                    <input
                      type="checkbox"
                      name="passionSlugs"
                      value={passion.slug}
                      defaultChecked={selectedSet.has(passion.slug)}
                      className="size-4 rounded border-border bg-background accent-primary"
                    />
                    <span className="font-medium">{passion.name}</span>
                  </label>
                ))}
              </div>
              <Button type="submit">Continua al feed</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
