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
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 md:px-6">
      <header className="flex items-center justify-between py-6">
        <BrandMark />
        <div className="flex items-center gap-2">
          <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Accedi
          </Link>
          <Link
            href="/register"
            className={cn(buttonVariants({ size: "sm" }), "shadow-md shadow-primary/30")}
          >
            Registrati
          </Link>
        </div>
      </header>
      <main className="flex-1 py-10">{children}</main>
      <footer className="border-t border-border/70 py-6 text-sm text-muted-foreground">
        ItPassion MVP · costruzione progressiva per milestone
      </footer>
    </div>
  );
}

