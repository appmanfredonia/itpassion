import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, Bookmark } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { AppNavigation } from "@/components/layout/app-navigation";
import { Button } from "@/components/ui/button";

type AppShellProps = {
  children: ReactNode;
  userEmail: string;
  userName?: string;
  logoutAction: () => Promise<never>;
};

export function AppShell({ children, userEmail, userName, logoutAction }: AppShellProps) {
  const resolvedUserName = userName ? `@${userName.replace(/^@+/, "")}` : "@itpassion";

  return (
    <div className="min-h-screen px-2 py-3 md:px-5 md:py-5">
      <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-3 lg:grid-cols-[296px_minmax(0,1fr)]">
        <aside className="surface-elevated relative sticky top-5 hidden h-[calc(100vh-2.5rem)] flex-col gap-6 overflow-hidden p-4 lg:flex">
          <div className="absolute inset-x-6 top-0 h-28 rounded-full bg-primary/16 blur-3xl" />

          <div className="relative flex items-center justify-between gap-2">
            <BrandMark />
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-primary uppercase">
              App
            </span>
          </div>

          <div className="relative rounded-[1.6rem] border border-border/80 bg-black/14 p-2">
            <AppNavigation />
          </div>

          <div className="relative mt-auto flex flex-col gap-3 rounded-[1.5rem] border border-border/80 bg-surface-1/95 p-4 shadow-[0_22px_44px_-30px_oklch(0_0_0_/_0.92)]">
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">Profilo attivo</p>
              <p className="text-sm font-semibold tracking-tight">{resolvedUserName}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm" className="w-full">
                Esci
              </Button>
            </form>
          </div>
        </aside>

        <div className="surface-elevated flex min-h-[calc(100vh-2.5rem)] flex-1 flex-col overflow-hidden">
          <header className="relative flex items-center justify-between gap-3 border-b border-border/80 bg-surface-1/95 px-4 py-3.5 md:px-6">
            <div className="absolute left-10 top-0 h-16 w-40 rounded-full bg-accent/12 blur-3xl" />
            <div className="flex min-w-0 items-center gap-3">
              <BrandMark compact />
              <div className="hidden min-w-0 flex-col md:flex">
                <p className="truncate text-sm font-semibold tracking-[0.01em]">Spazio ItPassion</p>
                <p className="truncate text-xs text-muted-foreground">
                  Una social app piu densa, visiva e immersiva
                </p>
              </div>
            </div>

            <div className="relative flex items-center gap-2">
              <div className="flex items-center gap-1 md:hidden">
                <Link
                  href="/notifications"
                  className="inline-flex size-8 items-center justify-center rounded-full border border-border/80 bg-black/16 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Bell className="size-3.5" />
                </Link>
                <Link
                  href="/saved"
                  className="inline-flex size-8 items-center justify-center rounded-full border border-border/80 bg-black/16 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Bookmark className="size-3.5" />
                </Link>
              </div>
              <div className="hidden rounded-full border border-border/80 bg-black/16 px-3 py-1.5 text-right md:flex md:flex-col">
                <p className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">Online</p>
                <p className="text-sm font-semibold tracking-tight">{resolvedUserName}</p>
              </div>
              <form action={logoutAction}>
                <Button type="submit" variant="outline" size="xs">
                  Esci
                </Button>
              </form>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-3 py-4 pb-8 md:px-5 md:py-5">{children}</main>

          <footer className="border-t border-border/80 bg-surface-1/95 px-2 py-2.5 lg:hidden">
            <div className="rounded-[1.7rem] border border-border/80 bg-black/16 p-1.5 shadow-[0_18px_40px_-24px_oklch(0_0_0_/_0.92)]">
              <AppNavigation mobile />
            </div>
          </footer>
        </div>

      </div>
    </div>
  );
}
