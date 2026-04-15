import Link from "next/link";
import { redirect } from "next/navigation";
import { registerAction } from "@/app/(auth)/actions";
import { getAuthenticatedRedirectPath, getUserPassionStatus } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <Card className="border-border/70 bg-card/85">
      <CardHeader>
        <CardTitle>Registrazione</CardTitle>
        <CardDescription>
          Crea il tuo account e inizia subito il tuo percorso su ItPassion.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" action={registerAction}>
          {params.error && (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
              {params.error}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="register-name">Nome utente</Label>
            <Input
              id="register-name"
              name="username"
              placeholder="itpassioner"
              autoComplete="username"
              required
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
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="register-password">Password</Label>
            <Input
              id="register-password"
              name="password"
              type="password"
              placeholder="********"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <Button type="submit">Registrati</Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-3 text-sm text-muted-foreground">
        <p>Se la conferma email e attiva, riceverai un link prima del primo accesso.</p>
        <p>
          Hai gia un account?{" "}
          <Link href="/login" className="text-primary underline-offset-4 hover:underline">
            Accedi
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
