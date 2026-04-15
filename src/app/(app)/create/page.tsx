import { redirect } from "next/navigation";
import { createPostAction } from "@/app/(app)/create/actions";
import { SectionHeader } from "@/components/section-header";
import { StateCard } from "@/components/state-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <SectionHeader
        badge="Milestone 3"
        title="Crea contenuto"
        description="Pubblica testo, immagini o video collegati a una passione reale."
      />

      <Card className="border-border/70 bg-card/85">
        <CardHeader>
          <CardTitle>Nuovo post</CardTitle>
          <CardDescription>
            Pubblica un contenuto testuale, una foto o un video legato a una passione.
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
            <StateCard
              variant="empty"
              title="Nessuna passione disponibile"
              description="Aggiungi passioni nel database prima di pubblicare nuovi contenuti."
            />
          ) : (
            <form className="flex flex-col gap-4" action={createPostAction}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="post-content-type">Tipo contenuto</Label>
                <select
                  id="post-content-type"
                  name="contentType"
                  defaultValue="text"
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="text">Testo</option>
                  <option value="image">Foto</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="post-passion">Passione</Label>
                <select
                  id="post-passion"
                  name="passionSlug"
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
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
                <Label htmlFor="post-text">Testo</Label>
                <Textarea
                  id="post-text"
                  name="textContent"
                  placeholder="Scrivi il contenuto del post o una caption per foto/video..."
                  className="min-h-28 resize-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="post-media-file">File media (foto/video)</Label>
                <Input id="post-media-file" name="mediaFile" type="file" accept="image/*,video/*" />
                <p className="text-xs text-muted-foreground">
                  Carica un file immagine o video (max 40MB).
                </p>
              </div>

              <Button type="submit">Pubblica e torna al feed</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
