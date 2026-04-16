import { Plus, Sparkles, X } from "lucide-react";
import { redirect } from "next/navigation";
import { createPostAction } from "@/app/(app)/create/actions";
import { MockPhone } from "@/components/marketing/mock-phone";
import { SectionHeader } from "@/components/section-header";
import { StateCard } from "@/components/state-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getPassionCatalog } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

type CreatePageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function CreatePage({ searchParams }: CreatePageProps) {
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
    console.error("[create] load passions failed", error);
    catalogErrorMessage = "Impossibile leggere il catalogo passioni dal database.";
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <SectionHeader
        badge="Milestone 3"
        title="Crea contenuto"
        description="Una schermata di pubblicazione piu vicina al mockup: preview forte, form compatto e controlli secondari ordinati."
        className="hidden md:flex"
      />

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
          description="Aggiungi passioni nel database prima di pubblicare nuovi contenuti."
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <MockPhone
            className="max-w-[24rem]"
            header={
              <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 text-[11px] text-muted-foreground">
                <span className="inline-flex size-7 items-center justify-center rounded-full border border-border/80 bg-surface-1 text-muted-foreground">
                  <X className="size-3.5" />
                </span>
                <span className="text-sm font-semibold tracking-tight text-foreground">
                  Nuovo post
                </span>
                <span className="text-sm font-semibold tracking-tight text-primary">Pubblica</span>
              </div>
            }
          >
            <form className="flex flex-col gap-4" action={createPostAction}>
              <div className="grid grid-cols-[1fr_4.5rem] gap-3">
                <label
                  htmlFor="post-media-file"
                  className="group relative flex aspect-[0.92] cursor-pointer items-end overflow-hidden rounded-[1.6rem] border border-border/80 bg-[radial-gradient(circle_at_top,oklch(0.73_0.16_294_/_0.2),transparent_34%),linear-gradient(180deg,rgba(30,37,58,1),rgba(13,17,28,1))] p-4"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="relative flex flex-col gap-2">
                    <span className="inline-flex w-fit rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-white/80 uppercase">
                      Media
                    </span>
                    <p className="max-w-[18ch] text-sm leading-relaxed text-white/88">
                      Tocca per caricare foto o video e dare al post un visual hero.
                    </p>
                  </div>
                </label>

                <div className="flex flex-col gap-3">
                  {[0, 1].map((slot) => (
                    <div
                      key={slot}
                      className="flex flex-1 items-center justify-center rounded-[1.2rem] border border-border/80 bg-surface-1/95 text-muted-foreground"
                    >
                      <Plus className="size-4" />
                    </div>
                  ))}
                </div>
              </div>

              <Input
                id="post-media-file"
                name="mediaFile"
                type="file"
                accept="image/*,video/*"
                className="hidden"
              />

              <div className="flex flex-col gap-2">
                <Label htmlFor="post-text">Scrivi qualcosa sulla tua passione...</Label>
                <Textarea
                  id="post-text"
                  name="textContent"
                  placeholder="Racconta il contesto, aggiungi una caption o descrivi il momento."
                  className="min-h-28 resize-none rounded-[1.4rem]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="post-passion">Passione</Label>
                <select
                  id="post-passion"
                  name="passionSlug"
                  className="h-11 rounded-[1.2rem] border border-input bg-surface-1 px-3 text-sm"
                  required
                >
                  <option value="">Seleziona passione</option>
                  {passions.map((passion) => (
                    <option key={passion.slug} value={passion.slug}>
                      {passion.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="post-content-type">Tipo contenuto</Label>
                <select
                  id="post-content-type"
                  name="contentType"
                  defaultValue="text"
                  className="h-11 rounded-[1.2rem] border border-input bg-surface-1 px-3 text-sm"
                >
                  <option value="text">Testo</option>
                  <option value="image">Foto</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <Button type="submit" className="h-11 rounded-2xl">
                Pubblica e torna al feed
              </Button>
            </form>
          </MockPhone>

          <div className="hidden flex-col gap-4 lg:flex">
            <div className="app-page-shell flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-8 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                  <Sparkles className="size-4" />
                </span>
                <h2 className="text-lg font-semibold tracking-tight">Guida rapida</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  "Scegli un media forte o scrivi una caption pulita.",
                  "Collega il post a una passione reale del catalogo.",
                  "Pubblica e rientra subito nel feed.",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.4rem] border border-border/80 bg-surface-1/95 p-4 text-sm leading-relaxed text-muted-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="app-page-shell flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
                    Suggerimenti
                  </p>
                  <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                    Hashtag e atmosfera
                  </h3>
                </div>
                <span className="inline-flex size-8 items-center justify-center rounded-full border border-border/80 bg-surface-1 text-muted-foreground">
                  <X className="size-4" />
                </span>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {passions.slice(0, 6).map((passion) => (
                  <span
                    key={passion.slug}
                    className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                  >
                    #{passion.slug}
                  </span>
                ))}
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">
                Mantieni la caption breve, scegli un media principale e collega il contenuto alla
                passione che vuoi far emergere.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
