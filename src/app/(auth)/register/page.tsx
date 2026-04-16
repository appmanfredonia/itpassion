import Link from "next/link";
import { redirect } from "next/navigation";
import { registerAction } from "@/app/(auth)/actions";
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
      chrome={
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-primary" />
          <span className="size-1.5 rounded-full bg-muted-foreground/45" />
          <span className="size-1.5 rounded-full bg-muted-foreground/25" />
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Crea il tuo account</h1>
          <p className="text-sm text-muted-foreground">
            Scegli il tuo nome, entra in app e completa subito il tuo frame iniziale.
          </p>
        </div>

        <form className="flex flex-col gap-4" action={registerAction}>
          {params.error ? (
            <p className="rounded-2xl border border-destructive/40 bg-destructive/12 px-3 py-2 text-sm text-destructive">
              {params.error}
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
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

          <div className="flex flex-col gap-2">
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="register-password">Password</Label>
            <Input
              id="register-password"
              name="password"
              type="password"
              placeholder="Minimo 6 caratteri"
              autoComplete="new-password"
              minLength={6}
              required
              className="h-11 rounded-2xl"
            />
          </div>

          <Button type="submit" className="mt-1 h-11 rounded-2xl">
            Registrati
          </Button>
        </form>

        <div className="text-sm text-muted-foreground">
          <p>
            Hai gia un account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Accedi
            </Link>
          </p>
          <p className="mt-3 text-[11px]">
            Se la conferma email e attiva, riceverai il link prima del primo accesso.
          </p>
        </div>
      </div>
    </MockPhone>
  );
}
