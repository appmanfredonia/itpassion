import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen px-4 py-7 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-8">
        <BrandMark metaMode="tagline" />

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section className="relative hidden overflow-hidden rounded-[2.2rem] border border-border/80 bg-[radial-gradient(circle_at_20%_18%,oklch(0.73_0.16_294_/_0.22),transparent_30%),radial-gradient(circle_at_75%_28%,oklch(0.7_0.15_243_/_0.18),transparent_32%),linear-gradient(180deg,rgba(11,16,31,0.96),rgba(7,11,22,0.96))] p-6 shadow-[0_34px_74px_-42px_oklch(0_0_0_/_0.96)] md:p-10 lg:block">
            <p className="text-[10px] tracking-[0.22em] text-primary uppercase">
              Login / Register
            </p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-[-0.04em] text-balance md:text-6xl">
              Bentornato nel posto giusto per cio che ami.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Accedi, completa il profilo e trasforma le tue passioni in una presenza visiva forte
              dentro ItPassion.
            </p>

            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
              {[
                "Feed piu visivo",
                "Onboarding rapido",
                "Profilo personale",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.4rem] border border-border/80 bg-black/14 px-4 py-3 text-sm text-foreground/92"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-10 flex items-end gap-3">
              {["Photo", "Code", "Fitness"].map((label, index) => (
                <div
                  key={label}
                  className="relative overflow-hidden rounded-[1.4rem] border border-border/80 bg-surface-1/90 px-3 py-4 shadow-[0_16px_34px_-24px_oklch(0_0_0_/_0.92)]"
                  style={{
                    transform: `translateY(${index * 8}px) rotate(${index === 1 ? -4 : index === 2 ? 6 : -8}deg)`,
                  }}
                >
                  <div className="h-24 w-[4.5rem] rounded-[1rem] bg-[radial-gradient(circle_at_top,oklch(0.73_0.16_294_/_0.32),transparent_40%),linear-gradient(180deg,rgba(24,29,48,1),rgba(10,13,24,1))]" />
                  <p className="mt-2 text-[11px] font-medium text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="flex items-center justify-center lg:justify-end">{children}</div>
        </div>
      </div>
    </div>
  );
}
