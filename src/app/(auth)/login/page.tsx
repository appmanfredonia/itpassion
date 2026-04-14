import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/(auth)/actions";
import { getAuthenticatedRedirectPath, getUserPassionStatus } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <Card className="border-border/70 bg-card/85">
      <CardHeader>
        <CardTitle>Accedi</CardTitle>
        <CardDescription>
          Inserisci email e password per entrare nel tuo spazio ItPassion.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" action={loginAction}>
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              name="email"
              type="email"
              placeholder="nome@esempio.it"
              autoComplete="email"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              name="password"
              type="password"
              placeholder="********"
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit">Accedi</Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-3 text-sm text-muted-foreground">
        <p>Sessione gestita da Supabase Auth con redirect automatici.</p>
        <p>
          Non hai un account?{" "}
          <Link href="/register" className="text-primary underline-offset-4 hover:underline">
            Registrati
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
