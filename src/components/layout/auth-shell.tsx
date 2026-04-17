import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen px-4 py-5 md:px-6 md:py-6">
      <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-6 md:gap-7">
        <BrandMark metaMode="tagline" />

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-8">
          <section className="relative hidden overflow-hidden rounded-[2rem] border border-border/80 bg-[radial-gradient(circle_at_20%_18%,oklch(0.73_0.16_294_/_0.18),transparent_28%),radial-gradient(circle_at_75%_28%,oklch(0.7_0.15_243_/_0.14),transparent_30%),linear-gradient(180deg,rgba(11,16,31,0.96),rgba(7,11,22,0.96))] p-7 shadow-[0_28px_64px_-40px_oklch(0_0_0_/_0.95)] md:p-9 lg:block">
            <p className="text-[10px] tracking-[0.22em] text-primary uppercase">
              Accesso account
            </p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-[-0.04em] text-balance md:text-5xl lg:text-6xl">
              Bentornato nel posto giusto per cio che ami.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Accedi, completa il profilo e trasforma le tue passioni in una presenza visiva forte
              dentro ItPassion.
            </p>

            <div className="mt-7 grid max-w-xl gap-3 sm:grid-cols-3">
              {[ 
                "Feed piu visivo",
                "Onboarding rapido",
                "Profilo personale",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.3rem] border border-border/80 bg-black/14 px-4 py-3 text-sm text-foreground/92"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-end gap-3">
              {["Photo", "Code", "Fitness"].map((label, index) => (
                <div
                  key={label}
                  className="relative overflow-hidden rounded-[1.35rem] border border-border/80 bg-surface-1/90 px-3 py-3.5 shadow-[0_14px_30px_-22px_oklch(0_0_0_/_0.92)]"
                  style={{
                    transform: `translateY(${index * 8}px) rotate(${index === 1 ? -4 : index === 2 ? 6 : -8}deg)`,
                  }}
                >
                  <div className="h-24 w-[4.4rem] rounded-[0.95rem] bg-[radial-gradient(circle_at_top,oklch(0.73_0.16_294_/_0.32),transparent_40%),linear-gradient(180deg,rgba(24,29,48,1),rgba(10,13,24,1))]" />
                  <p className="mt-2 text-[11px] font-medium text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="flex items-center justify-center lg:justify-end lg:pr-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
