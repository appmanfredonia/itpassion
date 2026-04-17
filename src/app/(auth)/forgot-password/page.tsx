import Link from "next/link";
import { MockPhone } from "@/components/marketing/mock-phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordAction } from "@/app/(auth)/actions";

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;

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
            Recupero password
          </span>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Ti aiutiamo a rientrare</h1>
          <p className="text-sm text-muted-foreground">
            Inserisci l&apos;email del tuo account. Se esiste, ti invieremo un link per impostare
            una nuova password.
          </p>
        </div>

        <form className="flex flex-col gap-3.5" action={forgotPasswordAction}>
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
            <Label htmlFor="forgot-email">Email</Label>
            <Input
              id="forgot-email"
              name="email"
              type="email"
              placeholder="nome@esempio.it"
              autoComplete="email"
              required
              className="h-11 rounded-2xl"
            />
          </div>

          <Button type="submit" className="h-11 rounded-2xl">
            Invia link di recupero
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Hai ricordato la password?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Torna al login
          </Link>
        </p>
      </div>
    </MockPhone>
  );
}

