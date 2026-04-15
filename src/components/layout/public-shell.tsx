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
    <div className="mx-auto flex min-h-screen w-full max-w-[1240px] flex-col px-4 py-4 md:px-6 md:py-6">
      <header className="surface-soft sticky top-4 z-20 flex items-center justify-between px-3 py-2.5 md:px-4">
        <BrandMark className="shrink-0" />
        <div className="flex items-center gap-2">
          <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Accedi
          </Link>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ size: "sm" }),
              "shadow-[0_14px_30px_-22px_oklch(0.76_0.11_198)]",
            )}
          >
            Registrati
          </Link>
        </div>
      </header>

      <main className="flex-1 py-10 md:py-14">{children}</main>

      <footer className="surface-soft mt-6 px-4 py-3 text-sm text-muted-foreground">
        ItPassion MVP - costruzione progressiva per milestone
      </footer>
    </div>
  );
}
