import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction, signInWithGoogleAction } from "@/app/(auth)/actions";
import { GoogleIcon } from "@/components/auth/google-icon";
import { PasswordInput } from "@/components/auth/password-input";
import { MockPhone } from "@/components/marketing/mock-phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthenticatedRedirectPath, getUserPassionStatus } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
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
            Login
          </span>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Bentornato!</h1>
          <p className="text-sm text-muted-foreground">
            Accedi al tuo account e rientra nel tuo spazio ItPassion.
          </p>
        </div>

        <form className="flex flex-col gap-3.5" action={loginAction}>
          {params.error ? (
            <p className="rounded-2xl border border-destructive/40 bg-destructive/12 px-3 py-2 text-sm text-destructive">
              {params.error}
            </p>
          ) : null}
          {params.success ? (
            <p className="rounded-2xl border border-border/80 bg-surface-1 px-3 py-2 text-sm text-muted-foreground">
              {params.success}
            </p>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              name="email"
              type="email"
              placeholder="mario@esempio.com"
              autoComplete="email"
              required
              className="h-11 rounded-2xl"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="login-password">Password</Label>
              <Link href="/forgot-password" className="text-[11px] font-medium text-primary hover:underline">
                Password dimenticata?
              </Link>
            </div>
            <PasswordInput
              id="login-password"
              name="password"
              placeholder="********"
              autoComplete="current-password"
              required
            />
          </div>

          <Button type="submit" className="mt-0.5 h-11 rounded-2xl">
            Accedi
          </Button>
        </form>

        <div className="flex flex-col items-center gap-2.5 pt-1 text-sm text-muted-foreground">
          <p className="text-center">
            Non hai un account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Registrati
            </Link>
          </p>
          <div className="flex w-full items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
            <span className="h-px flex-1 bg-border/70" />
            Oppure
            <span className="h-px flex-1 bg-border/70" />
          </div>
          <form action={signInWithGoogleAction} className="w-full">
            <input type="hidden" name="mode" value="login" />
            <Button type="submit" variant="outline" className="h-11 w-full rounded-2xl">
              <GoogleIcon />
              Continua con Google
            </Button>
          </form>
        </div>
      </div>
    </MockPhone>
  );
}
