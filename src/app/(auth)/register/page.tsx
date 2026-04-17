import Link from "next/link";
import { redirect } from "next/navigation";
import { registerAction, signInWithGoogleAction } from "@/app/(auth)/actions";
import { GoogleIcon } from "@/components/auth/google-icon";
import { PasswordInput } from "@/components/auth/password-input";
import { MockPhone } from "@/components/marketing/mock-phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthenticatedRedirectPath, getUserPassionStatus } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

type RegisterPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { hasPassions } = await getUserPassionStatus(supabase, user);
    redirect(getAuthenticatedRedirectPath(hasPassions));
  }

  return (
    <MockPhone
      className="max-w-[22.75rem]"
      bodyClassName="p-4 sm:p-[1.05rem]"
      chrome={
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-primary" />
          <span className="size-1.5 rounded-full bg-muted-foreground/45" />
          <span className="size-1.5 rounded-full bg-muted-foreground/25" />
        </div>
      }
    >
      <div className="flex flex-col gap-[1.125rem]">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold tracking-[0.16em] text-primary uppercase">
            Registrazione
          </span>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Crea il tuo account</h1>
          <p className="text-sm text-muted-foreground">
            Scegli come farti trovare, entra in app e completa subito il tuo profilo iniziale.
          </p>
        </div>

        <form className="flex flex-col gap-3.5" action={registerAction}>
          {params.error ? (
            <p className="rounded-2xl border border-destructive/40 bg-destructive/12 px-3 py-2 text-sm text-destructive">
              {params.error}
            </p>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="register-name">Nome utente</Label>
            <Input
              id="register-name"
              name="username"
              placeholder="itpassioner"
              autoComplete="username"
              required
              className="h-11 rounded-2xl"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="register-display-name">Nome visualizzato</Label>
            <Input
              id="register-display-name"
              name="displayName"
              placeholder="Mario Rossi"
              autoComplete="nickname"
              maxLength={60}
              className="h-11 rounded-2xl"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="register-email">Email</Label>
            <Input
              id="register-email"
              name="email"
              type="email"
              placeholder="nome@esempio.it"
              autoComplete="email"
              required
              className="h-11 rounded-2xl"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="register-city">Citta</Label>
            <Input
              id="register-city"
              name="city"
              placeholder="Bari"
              autoComplete="address-level2"
              required
              className="h-11 rounded-2xl"
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Inserisci il tuo comune. Provincia e area vengono ricavate in automatico.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="register-password">Password</Label>
            <PasswordInput
              id="register-password"
              name="password"
              placeholder="Minimo 6 caratteri"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          <Button type="submit" className="mt-0.5 h-11 rounded-2xl">
            Registrati
          </Button>
        </form>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex w-full items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
            <span className="h-px flex-1 bg-border/70" />
            Oppure
            <span className="h-px flex-1 bg-border/70" />
          </div>
          <form action={signInWithGoogleAction} className="w-full">
            <input type="hidden" name="mode" value="register" />
            <Button type="submit" variant="outline" className="h-11 w-full rounded-2xl">
              <GoogleIcon />
              Continua con Google
            </Button>
          </form>
          <p className="text-center">
            Hai gia un account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Accedi
            </Link>
          </p>
          <p className="text-center text-[11px] leading-relaxed">
            Se la conferma email e attiva, riceverai il link prima del primo accesso.
          </p>
          <p className="text-center text-[11px] leading-relaxed">
            Se la citta non viene riconosciuta, usa il nome ufficiale completo del comune.
          </p>
        </div>
      </div>
    </MockPhone>
  );
}
