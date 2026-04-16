import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PublicShellProps = {
  children: ReactNode;
};

export function PublicShell({ children }: PublicShellProps) {
  return (
    <div className="min-h-screen px-4 py-4 md:px-7 md:py-6">
      <div className="mx-auto flex w-full max-w-[1360px] flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border/70 pb-5">
          <BrandMark className="shrink-0" metaMode="tagline" />
          <div className="hidden items-center gap-2 md:flex">
            {["Facebook", "Instagram", "TikTok"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-border/80 bg-surface-1 px-4 py-2 text-sm font-medium text-muted-foreground"
              >
                {item}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Accedi
            </Link>
          </div>
        </header>

        <main className="flex-1 py-8 md:py-12">{children}</main>

        <footer className="mt-8 hidden flex-wrap items-center justify-between gap-3 border-t border-border/70 py-4 text-sm text-muted-foreground md:flex">
          <span>ItPassion MVP</span>
          <div className="flex items-center gap-2">
            <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Accedi
            </Link>
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "sm" }),
                "shadow-[0_16px_34px_-22px_oklch(0.73_0.16_294_/_0.75)]",
              )}
            >
              Registrati
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
