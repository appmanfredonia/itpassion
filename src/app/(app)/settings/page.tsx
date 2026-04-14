import { redirect } from "next/navigation";
import {
  blockUserAction,
  unblockUserAction,
  updatePrivacySettingsAction,
} from "@/app/(app)/settings/actions";
import { StateCard } from "@/components/state-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ensureUserProfile } from "@/lib/auth";
import {
  ensurePrivacySettings,
  getBlockedUsersList,
  type UserPrivacySettings,
} from "@/lib/privacy";
import { createServerSupabaseClient } from "@/lib/supabase";

type SettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
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

  try {
    await ensureUserProfile(supabase, user);
    privacySettings = await ensurePrivacySettings(supabase, user.id);
    blockedUsers = await getBlockedUsersList(supabase, user.id);
  } catch {
    hasError = true;
  }

  if (hasError || !privacySettings) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <h1 className="text-2xl font-semibold md:text-3xl">Impostazioni privacy</h1>
        <StateCard
          variant="error"
          title="Errore caricamento impostazioni"
          description="Controlla privacy_settings e blocked_users prima di riprovare."
        />
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary" className="text-[10px] tracking-[0.2em] uppercase">
          Milestone 6
        </Badge>
        <h1 className="text-2xl font-semibold md:text-3xl">Impostazioni privacy</h1>
      </div>

      {params.error && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
          {params.error}
        </p>
      )}
      {params.success && (
        <p className="rounded-md border border-border/70 bg-secondary/30 p-2 text-sm text-muted-foreground">
          {params.success}
        </p>
      )}
      {params.blockError && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
          {params.blockError}
        </p>
      )}
      {params.blockSuccess && (
        <p className="rounded-md border border-border/70 bg-secondary/30 p-2 text-sm text-muted-foreground">
          {params.blockSuccess}
        </p>
      )}

      <Card className="border-border/70 bg-card/85">
        <CardHeader>
          <CardTitle>Privacy base</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updatePrivacySettingsAction} className="flex flex-col gap-4">
            <label className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/60 p-3">
              <input
                type="checkbox"
                name="isProfilePrivate"
                defaultChecked={privacySettings.isProfilePrivate}
                className="size-4 accent-primary"
              />
              <span className="text-sm">Profilo privato</span>
            </label>

            <div className="flex flex-col gap-2">
              <Label htmlFor="who-can-message">Chi puo scrivermi</Label>
              <select
                id="who-can-message"
                name="whoCanMessage"
                defaultValue={privacySettings.whoCanMessage}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="everyone">Tutti</option>
                <option value="followers">Solo follower</option>
                <option value="nobody">Nessuno</option>
              </select>
            </div>

            <label className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/60 p-3">
              <input
                type="checkbox"
                name="showOnlineStatus"
                defaultChecked={privacySettings.showOnlineStatus}
                className="size-4 accent-primary"
              />
              <span className="text-sm">Mostra stato online</span>
            </label>

            <Button type="submit" size="sm">
              Salva impostazioni
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/85">
        <CardHeader>
          <CardTitle>Blocca utente</CardTitle>
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

      <Card className="border-border/70 bg-card/85">
        <CardHeader>
          <CardTitle>Utenti bloccati</CardTitle>
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
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/60 p-3"
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
                    <p className="text-sm font-medium">@{blockedUser.username}</p>
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
    </section>
  );
}
