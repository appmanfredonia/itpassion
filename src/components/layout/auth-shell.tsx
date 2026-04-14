import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen px-4 py-8 md:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <BrandMark />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <section className="rounded-2xl border border-border/70 bg-card/70 p-6 backdrop-blur md:p-8">
            <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
              Milestone 1 · Accesso
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-balance md:text-4xl">
              Accedi alla community delle passioni.
            </h1>
            <p className="mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
              In questa milestone prepariamo accesso e struttura base: login, registrazione e
              routing auth sono pronti per il collegamento Supabase.
            </p>
          </section>
          {children}
        </div>
      </div>
    </div>
  );
}

