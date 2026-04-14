import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

const highlights = [
  "Login e registrazione pronti per Supabase Auth",
  "Routing MVP completo con route groups pubblici/auth/app",
  "UI dark, pulita e responsive su mobile e desktop",
];

export default function LandingPage() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <div className="rounded-3xl border border-border/70 bg-card/75 p-6 backdrop-blur md:p-10">
        <Badge variant="secondary" className="text-[10px] tracking-[0.2em] uppercase">
          Milestone 1 · Accesso
        </Badge>
        <h1 className="mt-4 text-4xl font-semibold text-balance md:text-6xl">
          Benvenuto su {siteConfig.name}
        </h1>
        <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
          {siteConfig.description} Questa base prepara il nucleo del MVP: accesso, layout e aree
          principali pronte da collegare ai dati reali.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/register" className={buttonVariants({ size: "lg" })}>
            Inizia ora
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-border/80")}
          >
            Ho gia un account
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {highlights.map((item) => (
          <Card key={item} className="border-border/70 bg-background/60">
            <CardContent className="p-4 text-sm text-muted-foreground">{item}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

