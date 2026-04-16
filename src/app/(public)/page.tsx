import Link from "next/link";
import { MockPhone } from "@/components/marketing/mock-phone";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

const featureBadges = ["#fotografia", "#coding", "#fitness"];

export default function LandingPage() {
  return (
    <section className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold tracking-[0.24em] text-primary uppercase">
          Beta
        </p>
        <h1 className="mt-5 max-w-xl text-5xl font-semibold tracking-[-0.05em] text-balance md:text-7xl">
          La tua <span className="text-gradient-brand">passione</span> merita il suo posto.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
          Condividi cio che ami con persone che parlano la tua stessa lingua visiva. Entra in
          {` ${siteConfig.name} `}e inizia dal tuo primo frame.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/register" className={buttonVariants({ size: "lg" })}>
            Inizia ora
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "text-foreground")}
          >
            Accedi
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-2.5">
          {featureBadges.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-border/80 bg-surface-1 px-3 py-1.5 text-sm text-muted-foreground"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      <div className="relative flex items-center justify-center">
        <div className="absolute inset-x-6 top-12 h-48 rounded-full bg-primary/20 blur-[110px]" />
        <MockPhone
          className="max-w-[22rem]"
          chrome={
            <span className="rounded-full border border-border/80 bg-black/16 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Menu
            </span>
          }
          footer={
            <div className="grid grid-cols-3 gap-2">
              {["Fotografia", "Coding", "Fitness"].map((item, index) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-[1rem] border border-border/80 bg-surface-1/95"
                >
                  <div
                    className="h-20 bg-[radial-gradient(circle_at_top,oklch(0.73_0.16_294_/_0.22),transparent_38%),linear-gradient(180deg,rgba(31,37,58,1),rgba(12,15,25,1))]"
                    style={{
                      filter: index === 1 ? "saturate(1.15)" : "none",
                    }}
                  />
                  <p className="px-2 py-1.5 text-[10px] text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          }
        >
          <div className="flex flex-col gap-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-border/80 bg-surface-1 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Beta
              </span>
            </div>
            <div>
              <h2 className="max-w-[10ch] text-3xl font-semibold tracking-[-0.04em] text-balance">
                La tua <span className="text-gradient-brand">passione</span> merita il suo posto.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Condividi scatti, progetti e momenti con chi ama davvero le stesse cose.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/register" className={buttonVariants({ size: "lg" })}>
                Inizia ora
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "justify-center text-foreground",
                )}
              >
                Accedi
              </Link>
            </div>
          </div>
        </MockPhone>
      </div>
    </section>
  );
}
