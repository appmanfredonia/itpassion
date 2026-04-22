import { ChevronLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { saveOnboardingPassionsAction } from "@/app/(app)/onboarding/actions";
import { MockPhone } from "@/components/marketing/mock-phone";
import { PassionSelectionFieldset } from "@/components/passions/passion-selection-fieldset";
import { SectionHeader } from "@/components/section-header";
import { StateCard } from "@/components/state-card";
import { Button } from "@/components/ui/button";
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
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <SectionHeader
        badge="Onboarding"
        title="Scegli le tue passioni"
        description="Scegli da 1 a 3 passioni. Entrerai automaticamente nelle tribu locali della tua provincia."
        className="hidden md:flex"
      />

      <div className="flex justify-center">
        <MockPhone
          header={
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-2.5 text-[11px] text-muted-foreground">
              <span className="inline-flex size-7 items-center justify-center rounded-full border border-border/80 bg-surface-1 text-muted-foreground">
                <ChevronLeft className="size-3.5" />
              </span>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3].map((index) => (
                  <span
                    key={index}
                    className={`inline-flex h-1.5 rounded-full ${
                      index === 1
                        ? "w-6 bg-gradient-to-r from-primary to-accent"
                        : "w-1.5 bg-muted-foreground/25"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">Salta</span>
            </div>
          }
          className="max-w-[24rem]"
          bodyClassName="p-4 sm:p-[1.05rem]"
        >
          <div className="flex flex-col gap-[1.125rem]">
            <div className="flex flex-col gap-1.5">
              <h1 className="max-w-[12ch] text-3xl font-semibold tracking-[-0.04em]">
                Quali sono le tue passioni?
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Scegli da 1 a 3 passioni. Entrerai automaticamente nelle tribu locali della tua
                provincia.
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Nel feed vedrai contenuti di persone con passioni in comune, rituali delle tue
                tribu e suggerimenti di utenti affini nella tua provincia.
              </p>
            </div>

            {params.error ? (
              <p className="rounded-2xl border border-destructive/40 bg-destructive/12 px-3 py-2 text-sm text-destructive">
                {params.error}
              </p>
            ) : null}

            {catalogErrorMessage ? (
              <StateCard
                variant="error"
                title="Catalogo passioni non disponibile"
                description={catalogErrorMessage}
              />
            ) : passions.length === 0 ? (
              <StateCard
                variant="empty"
                title="Nessuna passione disponibile"
                description="Aggiungi passioni nel database per completare l'onboarding."
              />
            ) : (
              <form className="flex flex-col gap-[1.125rem]" action={saveOnboardingPassionsAction}>
                <PassionSelectionFieldset
                  passions={passions}
                  selectedSlugs={Array.from(selectedSet)}
                />

                <div className="flex flex-col gap-3 pt-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <span>Potrai aggiornare passioni e tribu locali in seguito dalle impostazioni.</span>
                  <Button type="submit" className="h-11 w-full rounded-2xl sm:min-w-32 sm:w-auto">
                    Continua
                  </Button>
                </div>
              </form>
            )}
          </div>
        </MockPhone>
      </div>
    </section>
  );
}
