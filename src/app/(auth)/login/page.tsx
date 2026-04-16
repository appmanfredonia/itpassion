import Link from "next/link";
import { redirect } from "next/navigation";
import { EyeOff } from "lucide-react";
import { loginAction } from "@/app/(auth)/actions";
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
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Bentornato!</h1>
          <p className="text-sm text-muted-foreground">
            Accedi al tuo account e rientra nel tuo spazio ItPassion.
          </p>
        </div>

        <form className="flex flex-col gap-4" action={loginAction}>
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

          <div className="flex flex-col gap-2">
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="login-password">Password</Label>
            <div className="relative">
              <Input
                id="login-password"
                name="password"
                type="password"
                placeholder="********"
                autoComplete="current-password"
                required
                className="h-11 rounded-2xl pr-10"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center text-muted-foreground">
                <EyeOff className="size-4" />
              </span>
            </div>
            <span className="text-[11px] text-primary">Password dimenticata?</span>
          </div>

          <Button type="submit" className="mt-1 h-11 rounded-2xl">
            Accedi
          </Button>
        </form>

        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <p>
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
          <div className="w-full rounded-2xl border border-border/80 bg-surface-1 px-4 py-3 text-center text-foreground/88">
            Continua con Google
          </div>
        </div>
      </div>
    </MockPhone>
  );
}
