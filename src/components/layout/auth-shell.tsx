import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen px-4 py-7 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6">
        <BrandMark />

        <div className="grid gap-5 lg:grid-cols-[1.18fr_1fr] lg:items-start">
          <section className="surface-elevated p-6 md:p-8">
            <p className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
              Milestone 1 - Accesso
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              Benvenuto nella community delle passioni.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Accedi o crea il tuo account per entrare nel tuo spazio ItPassion e iniziare subito.
            </p>
          </section>
          <div className="surface-panel p-1.5">{children}</div>
        </div>
      </div>
    </div>
  );
}
