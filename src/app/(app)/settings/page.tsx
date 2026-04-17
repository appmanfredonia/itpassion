import { redirect } from "next/navigation";
import {
  updateProfileDetailsAction,
  updateProfilePassionsAction,
  blockUserAction,
  unblockUserAction,
  updatePrivacySettingsAction,
} from "@/app/(app)/settings/actions";
import { SectionHeader } from "@/components/section-header";
import { StateCard } from "@/components/state-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  buildFallbackProfileFromAuthUser,
  ensureUserProfile,
  getPassionCatalog,
  getUserSelectedPassionSlugs,
} from "@/lib/auth";
import {
  ensurePrivacySettings,
  getBlockedUsersList,
  type UserPrivacySettings,
} from "@/lib/privacy";
import { italianProvinceOptions } from "@/lib/location";
import { createServerSupabaseClient } from "@/lib/supabase";

type SettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
    profileError?: string;
    profileSuccess?: string;
    passionsError?: string;
    passionsSuccess?: string;
    blockError?: string;
    blockSuccess?: string;
  }>;
};

function avatarFallback(username: string): string {
  const normalized = username.trim();
  if (normalized.length === 0) {
    return "IT";
  }
  return normalized.slice(0, 2).toUpperCase();
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let hasError = false;
  let privacySettings: UserPrivacySettings | null = null;
  let blockedUsers: Awaited<ReturnType<typeof getBlockedUsersList>> = [];
  let profile = buildFallbackProfileFromAuthUser(user);
  let passions: Awaited<ReturnType<typeof getPassionCatalog>>["passions"] = [];
  let selectedPassionSlugs: string[] = [];
  let passionsLoadError: string | null = null;

  try {
    const ensuredProfile = await ensureUserProfile(supabase, user);
    profile = ensuredProfile ?? buildFallbackProfileFromAuthUser(user);
    privacySettings = await ensurePrivacySettings(supabase, user.id);
    blockedUsers = await getBlockedUsersList(supabase, user.id);

    try {
      ({ passions } = await getPassionCatalog(supabase));
      selectedPassionSlugs = await getUserSelectedPassionSlugs(supabase, user);
    } catch {
      passionsLoadError = "Impossibile caricare le passioni dal database.";
    }
  } catch {
    hasError = true;
  }

  if (hasError || !privacySettings) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <h1 className="text-2xl font-semibold md:text-3xl">Impostazioni account</h1>
        <StateCard
          variant="error"
          title="Errore caricamento impostazioni"
          description="Controlla users, privacy_settings e blocked_users prima di riprovare."
        />
      </section>
    );
  }

  const selectedPassionSet = new Set(selectedPassionSlugs);
  const statusBanners: Array<{ id: string; text: string; variant: "error" | "info" }> = [];

  if (params.error) {
    statusBanners.push({ id: "error", text: params.error, variant: "error" });
  }
  if (params.success) {
    statusBanners.push({ id: "success", text: params.success, variant: "info" });
  }
  if (params.profileError) {
    statusBanners.push({
      id: "profile-error",
      text: params.profileError,
      variant: "error",
    });
  }
  if (params.profileSuccess) {
    statusBanners.push({
      id: "profile-success",
      text: params.profileSuccess,
      variant: "info",
    });
  }
  if (params.passionsError) {
    statusBanners.push({
      id: "passions-error",
      text: params.passionsError,
      variant: "error",
    });
  }
  if (params.passionsSuccess) {
    statusBanners.push({
      id: "passions-success",
      text: params.passionsSuccess,
      variant: "info",
    });
  }
  if (params.blockError) {
    statusBanners.push({
      id: "block-error",
      text: params.blockError,
      variant: "error",
    });
  }
  if (params.blockSuccess) {
    statusBanners.push({
      id: "block-success",
      text: params.blockSuccess,
      variant: "info",
    });
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-7">
      <SectionHeader
        badge="Impostazioni"
        title="Impostazioni account"
        description="Aggiorna profilo, passioni, privacy e gestione blocchi."
      />

      <div className="stats-grid">
        <div className="surface-soft p-4">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Username attivo
          </p>
          <p className="mt-1 truncate text-sm font-semibold tracking-tight">@{profile.username}</p>
        </div>
        <div className="surface-soft p-4">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Profilo
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight">
            {privacySettings.isProfilePrivate ? "Privato" : "Pubblico"}
          </p>
        </div>
        <div className="surface-soft p-4">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Utenti bloccati
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight">{blockedUsers.length}</p>
        </div>
      </div>

      {statusBanners.length > 0 && (
        <div className="flex flex-col gap-2">
          {statusBanners.map((banner) => (
            <p
              key={banner.id}
              className={
                banner.variant === "error"
                  ? "rounded-xl border border-destructive/50 bg-destructive/10 p-2.5 text-sm text-destructive"
                  : "rounded-xl border border-border/70 bg-secondary/30 p-2.5 text-sm text-muted-foreground"
              }
            >
              {banner.text}
            </p>
          ))}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
        <div className="flex flex-col gap-4">
          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>Profilo</CardTitle>
              <CardDescription>
                Aggiorna nome utente, bio e area in cui vuoi farti trovare.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateProfileDetailsAction} className="flex flex-col gap-3.5">
                <div className="surface-soft flex flex-col gap-2 p-3">
                  <Label htmlFor="settings-username">Nome utente</Label>
                  <Input
                    id="settings-username"
                    name="username"
                    defaultValue={profile.username}
                    autoComplete="username"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    3-24 caratteri: lettere minuscole, numeri, underscore o punto.
                  </p>
                </div>

                <div className="surface-soft flex flex-col gap-2 p-3">
                  <Label htmlFor="settings-display-name">Nome visualizzato</Label>
                  <Input
                    id="settings-display-name"
                    name="displayName"
                    defaultValue={profile.displayName}
                    maxLength={60}
                    required
                  />
                </div>

                <div className="surface-soft flex flex-col gap-2 p-3">
                  <Label htmlFor="settings-bio">Bio</Label>
                  <Textarea
                    id="settings-bio"
                    name="bio"
                    defaultValue={profile.bio ?? ""}
                    maxLength={280}
                    placeholder="Racconta qualcosa delle tue passioni..."
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
                  <div className="surface-soft flex flex-col gap-2 p-3">
                    <Label htmlFor="settings-city">Citta</Label>
                    <Input
                      id="settings-city"
                      name="city"
                      defaultValue={profile.city ?? ""}
                      autoComplete="address-level2"
                      placeholder="Bari"
                    />
                  </div>

                  <div className="surface-soft flex flex-col gap-2 p-3">
                    <Label htmlFor="settings-province">Provincia</Label>
                    <Input
                      id="settings-province"
                      name="province"
                      defaultValue={profile.province ?? ""}
                      autoComplete="address-level1"
                      list="settings-province-options"
                      placeholder="BA"
                    />
                  </div>
                </div>

                <datalist id="settings-province-options">
                  {italianProvinceOptions.map((provinceOption) => (
                    <option
                      key={provinceOption.provinceCode}
                      value={provinceOption.provinceCode}
                    >
                      {provinceOption.province}
                    </option>
                  ))}
                </datalist>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  La mappa mostra solo un&apos;area approssimata. Se la tua citta non viene
                  riconosciuta subito, aggiungi anche la provincia.
                </p>

                <Button type="submit" size="sm" className="w-fit">
                  Salva profilo
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>Passioni principali</CardTitle>
              <CardDescription>
                Scegli le passioni che vuoi mostrare nel tuo profilo.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {passionsLoadError ? (
                <StateCard
                  variant="error"
                  title="Catalogo passioni non disponibile"
                  description={passionsLoadError}
                />
              ) : passions.length === 0 ? (
                <StateCard
                  variant="empty"
                  title="Nessuna passione disponibile"
                  description="Aggiungi passioni nel database per aggiornare il profilo."
                />
              ) : (
                <form action={updateProfilePassionsAction} className="flex flex-col gap-4">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {passions.map((passion) => (
                      <label
                        key={passion.slug}
                        className="surface-soft flex items-center gap-3 p-3 text-sm transition-colors hover:border-primary/40"
                      >
                        <input
                          type="checkbox"
                          name="passionSlugs"
                          value={passion.slug}
                          defaultChecked={selectedPassionSet.has(passion.slug)}
                          className="size-4 rounded border-border bg-background accent-primary"
                        />
                        <span className="font-medium">{passion.name}</span>
                      </label>
                    ))}
                  </div>
                  <Button type="submit" size="sm" variant="secondary" className="w-fit">
                    Aggiorna passioni
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>Privacy base</CardTitle>
              <CardDescription>
                Gestisci visibilita profilo e preferenze messaggi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updatePrivacySettingsAction} className="flex flex-col gap-3">
                <label className="surface-soft flex items-center gap-3 p-3">
                  <input
                    type="checkbox"
                    name="isProfilePrivate"
                    defaultChecked={privacySettings.isProfilePrivate}
                    className="size-4 accent-primary"
                  />
                  <span className="text-sm font-medium">Profilo privato</span>
                </label>

                <div className="surface-soft flex flex-col gap-2 p-3">
                  <Label htmlFor="who-can-message">Chi puo scrivermi</Label>
                  <select
                    id="who-can-message"
                    name="whoCanMessage"
                    defaultValue={privacySettings.whoCanMessage}
                  >
                    <option value="everyone">Tutti</option>
                    <option value="followers">Solo follower</option>
                    <option value="nobody">Nessuno</option>
                  </select>
                </div>

                <label className="surface-soft flex items-center gap-3 p-3">
                  <input
                    type="checkbox"
                    name="showOnlineStatus"
                    defaultChecked={privacySettings.showOnlineStatus}
                    className="size-4 accent-primary"
                  />
                  <span className="text-sm font-medium">Mostra stato online</span>
                </label>

                <Button type="submit" size="sm" className="w-fit">
                  Salva impostazioni
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>Blocca utente</CardTitle>
              <CardDescription>
                Inserisci uno username per interrompere nuove interazioni.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={blockUserAction} className="flex flex-col gap-2 sm:flex-row">
                <Input
                  name="targetUsername"
                  placeholder="username utente da bloccare"
                  autoComplete="off"
                />
                <input type="hidden" name="returnPath" value="/settings" />
                <Button type="submit" size="sm" variant="destructive">
                  Blocca
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle>Utenti bloccati</CardTitle>
              <CardDescription>
                Gestisci gli account che hai bloccato.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {blockedUsers.length === 0 ? (
                <StateCard
                  variant="empty"
                  title="Nessun utente bloccato"
                  description="Gli utenti bloccati appariranno qui."
                />
              ) : (
                blockedUsers.map((blockedUser) => (
                  <div
                    key={blockedUser.userId}
                    className="surface-soft flex flex-wrap items-start justify-between gap-3 p-3 sm:items-center"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        {blockedUser.avatarUrl && (
                          <AvatarImage
                            src={blockedUser.avatarUrl}
                            alt={`Avatar di @${blockedUser.username}`}
                          />
                        )}
                        <AvatarFallback>{avatarFallback(blockedUser.username)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-sm font-semibold tracking-tight">@{blockedUser.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {blockedUser.displayName}
                        </p>
                      </div>
                    </div>
                    <form action={unblockUserAction}>
                      <input type="hidden" name="targetUserId" value={blockedUser.userId} />
                      <input type="hidden" name="returnPath" value="/settings" />
                      <Button type="submit" size="xs" variant="outline">
                        Sblocca
                      </Button>
                    </form>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
