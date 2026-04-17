import Link from "next/link";
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
import { getEditablePostById } from "@/lib/feed";
import { createServerSupabaseClient } from "@/lib/supabase";

type CreatePageProps = {
  searchParams: Promise<{
    error?: string;
    edit?: string;
  }>;
};

export default async function CreatePage({ searchParams }: CreatePageProps) {
  const params = await searchParams;
  const editingPostId = typeof params.edit === "string" ? params.edit : null;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let passions: Awaited<ReturnType<typeof getPassionCatalog>>["passions"] = [];
  let catalogErrorMessage: string | null = null;
  const editablePost = editingPostId
    ? await getEditablePostById(supabase, user.id, editingPostId)
    : null;

  if (editingPostId && !editablePost) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <StateCard
          variant="error"
          title="Post non disponibile"
          description="Questo contenuto non esiste piu oppure non appartiene al tuo profilo."
        />
      </section>
    );
  }

  try {
    ({ passions } = await getPassionCatalog(supabase));
  } catch (error) {
    console.error("[create] load passions failed", error);
    catalogErrorMessage = "Impossibile leggere il catalogo passioni dal database.";
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <SectionHeader
        badge={editingPostId ? "Modifica post" : "Nuovo post"}
        title={editingPostId ? "Modifica contenuto" : "Crea contenuto"}
        description={
          editingPostId
            ? "Aggiorna caption, media e passione mantenendo lo stesso stile del feed."
            : "Prepara un contenuto con preview chiara, form compatto e controlli ordinati."
        }
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
            bodyClassName="p-4 sm:p-[1.05rem]"
            header={
              <div className="flex items-center justify-between border-b border-border/70 px-4 py-2.5 text-[11px] text-muted-foreground">
                <span className="inline-flex size-7 items-center justify-center rounded-full border border-border/80 bg-surface-1 text-muted-foreground">
                  <X className="size-3.5" />
                </span>
                <span className="text-sm font-semibold tracking-tight text-foreground">
                  {editingPostId ? "Modifica post" : "Nuovo post"}
                </span>
                <span className="text-sm font-semibold tracking-tight text-primary">
                  {editingPostId ? "Salva" : "Pubblica"}
                </span>
              </div>
            }
          >
            <form className="flex flex-col gap-3.5" action={createPostAction}>
              {editingPostId ? (
                <input type="hidden" name="editingPostId" value={editingPostId} />
              ) : null}

              <div className="grid grid-cols-[minmax(0,1fr)_4.25rem] gap-2.5">
                <label
                  htmlFor="post-media-file"
                  className="group relative flex aspect-[0.94] cursor-pointer items-end overflow-hidden rounded-[1.45rem] border border-border/80 bg-[radial-gradient(circle_at_top,oklch(0.73_0.16_294_/_0.2),transparent_34%),linear-gradient(180deg,rgba(30,37,58,1),rgba(13,17,28,1))] p-4"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="relative flex flex-col gap-2">
                    <span className="inline-flex w-fit rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-white/80 uppercase">
                      {editablePost?.media.length ? "Sostituisci media" : "Media"}
                    </span>
                    <p className="max-w-[18ch] text-sm leading-relaxed text-white/88">
                      {editingPostId
                        ? "Carica un nuovo file solo se vuoi sostituire la foto o il video esistenti."
                        : "Tocca per caricare foto o video e dare al post un visual hero."}
                    </p>
                  </div>
                </label>

                <div className="flex flex-col gap-3">
                  {[0, 1].map((slot) => (
                    <div
                      key={slot}
                      className="flex min-h-[5.75rem] flex-1 items-center justify-center rounded-[1.1rem] border border-border/80 bg-surface-1/95 text-muted-foreground"
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

              {editablePost?.media.length ? (
                <div className="rounded-[1.35rem] border border-border/80 bg-surface-1/95 p-3">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    Media attuale
                  </p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {editablePost.media.map((mediaItem) => (
                      <div
                        key={mediaItem.id}
                        className="overflow-hidden rounded-[1.15rem] border border-border/80 bg-black/18"
                      >
                        <div className="aspect-[4/4.2] bg-muted/20">
                          {mediaItem.kind === "image" ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={mediaItem.url}
                              alt="Media attuale del post"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <video controls preload="metadata" className="h-full w-full object-cover">
                              <source src={mediaItem.url} />
                            </video>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Lascia il file vuoto per mantenere il media attuale. Passando a un post testuale
                    il media verra rimosso.
                  </p>
                </div>
              ) : null}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="post-text">Scrivi qualcosa sulla tua passione...</Label>
                <Textarea
                  id="post-text"
                  name="textContent"
                  defaultValue={editablePost?.textContent ?? ""}
                  placeholder="Racconta il contesto, aggiungi una caption o descrivi il momento."
                  className="min-h-28 resize-none rounded-[1.35rem]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="post-passion">Passione</Label>
                <select
                  id="post-passion"
                  name="passionSlug"
                  defaultValue={editablePost?.passionSlug ?? ""}
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

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="post-content-type">Tipo contenuto</Label>
                <select
                  id="post-content-type"
                  name="contentType"
                  defaultValue={editablePost?.contentType ?? "text"}
                  className="h-11 rounded-[1.2rem] border border-input bg-surface-1 px-3 text-sm"
                >
                  <option value="text">Testo</option>
                  <option value="image">Foto</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" className="mt-0.5 h-11 rounded-2xl">
                  {editingPostId ? "Salva modifiche" : "Pubblica e torna al feed"}
                </Button>
                {editingPostId ? (
                  <Link
                    href={`/feed?post=${editingPostId}`}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-border/90 bg-surface-1 px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-surface-2"
                  >
                    Annulla
                  </Link>
                ) : null}
              </div>
            </form>
          </MockPhone>

          <div className="hidden flex-col gap-3.5 lg:flex">
            <div className="app-page-shell flex flex-col gap-3.5">
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

            <div className="app-page-shell flex flex-col gap-3.5">
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
