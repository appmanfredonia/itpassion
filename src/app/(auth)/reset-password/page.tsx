import Link from "next/link";
import { redirect } from "next/navigation";
import { resetPasswordAction } from "@/app/(auth)/actions";
import { PasswordInput } from "@/components/auth/password-input";
import { MockPhone } from "@/components/marketing/mock-phone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createServerSupabaseClient } from "@/lib/supabase";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/forgot-password?error=Apri il link ricevuto via email per impostare una nuova password.");
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
            Nuova password
          </span>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Scegli una password sicura</h1>
          <p className="text-sm text-muted-foreground">
            Aggiorna l&apos;accesso al tuo account e torna subito alle tue passioni.
          </p>
        </div>

        <form className="flex flex-col gap-3.5" action={resetPasswordAction}>
          {params.error ? (
            <p className="rounded-2xl border border-destructive/40 bg-destructive/12 px-3 py-2 text-sm text-destructive">
              {params.error}
            </p>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reset-password">Nuova password</Label>
            <PasswordInput
              id="reset-password"
              name="password"
              placeholder="Minimo 6 caratteri"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reset-password-confirm">Conferma password</Label>
            <PasswordInput
              id="reset-password-confirm"
              name="confirmPassword"
              placeholder="Ripeti la password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          <Button type="submit" className="h-11 rounded-2xl">
            Aggiorna password
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Hai bisogno di un nuovo link?{" "}
          <Link href="/forgot-password" className="text-primary hover:underline">
            Richiedilo di nuovo
          </Link>
        </p>
      </div>
    </MockPhone>
  );
}

