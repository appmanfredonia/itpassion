import Link from "next/link";
import { MockPhone } from "@/components/marketing/mock-phone";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

const featureBadges = ["#fotografia", "#coding", "#fitness"];

export default function LandingPage() {
  return (
    <section className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-10">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold tracking-[0.24em] text-primary uppercase">
          ItPassion
        </p>
        <h1 className="mt-4 max-w-[11ch] text-4xl font-semibold tracking-[-0.05em] text-balance sm:text-5xl md:mt-5 md:max-w-xl md:text-7xl">
          La tua <span className="text-gradient-brand">passione</span> merita il suo posto.
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base md:mt-5 md:text-lg">
          Condividi cio che ami con persone che parlano la tua stessa lingua visiva. Entra in
          {` ${siteConfig.name} `}e inizia a raccontare quello che ti accende davvero.
        </p>

        <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
            Inizia ora
          </Link>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "w-full text-foreground sm:w-auto",
            )}
          >
            Accedi
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 md:mt-7 md:gap-2.5">
          {featureBadges.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-border/80 bg-surface-1 px-3 py-1.5 text-xs text-muted-foreground sm:text-sm"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      <div className="relative flex items-center justify-center pt-2 lg:pt-0">
        <div className="absolute inset-x-8 top-10 h-40 rounded-full bg-primary/16 blur-[96px] md:inset-x-6 md:top-12 md:h-48 md:bg-primary/20 md:blur-[110px]" />
        <MockPhone
          className="max-w-[21.75rem] sm:max-w-[22rem]"
          bodyClassName="p-3.5"
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
                  className="overflow-hidden rounded-[0.95rem] border border-border/80 bg-surface-1/95"
                >
                  <div
                    className="h-[4.5rem] bg-[radial-gradient(circle_at_top,oklch(0.73_0.16_294_/_0.22),transparent_38%),linear-gradient(180deg,rgba(31,37,58,1),rgba(12,15,25,1))] sm:h-20"
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
          <div className="flex flex-col gap-3.5 pb-1">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-border/80 bg-surface-1 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                ItPassion
              </span>
            </div>
            <div>
              <h2 className="max-w-[10ch] text-[2rem] font-semibold tracking-[-0.04em] text-balance">
                La tua <span className="text-gradient-brand">passione</span> merita il suo posto.
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                Condividi scatti, progetti e momenti con chi ama davvero le stesse cose.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-1.5">
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
