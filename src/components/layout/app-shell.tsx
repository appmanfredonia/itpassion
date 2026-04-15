import type { ReactNode } from "react";
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
      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-3 lg:grid-cols-[272px_minmax(0,1fr)]">
        <aside className="surface-elevated sticky top-5 hidden h-[calc(100vh-2.5rem)] flex-col gap-6 p-4 lg:flex">
          <div className="flex items-center justify-between gap-2">
            <BrandMark />
            <span className="rounded-full border border-border/70 bg-surface-1 px-2 py-1 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              App
            </span>
          </div>

          <AppNavigation />

          <div className="mt-auto flex flex-col gap-3 rounded-xl border border-border/70 bg-surface-1 p-3">
            <div className="flex flex-col">
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
          <header className="flex items-center justify-between gap-3 border-b border-border/70 bg-surface-1 px-4 py-3 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <BrandMark compact />
              <div className="hidden min-w-0 flex-col md:flex">
                <p className="truncate text-sm font-semibold tracking-tight">Spazio ItPassion</p>
                <p className="truncate text-xs text-muted-foreground">
                  Feed, profilo, messaggi e impostazioni in un&apos;unica esperienza
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden flex-col text-right md:flex">
                <p className="text-xs text-muted-foreground">Connesso come</p>
                <p className="text-sm font-semibold tracking-tight">{resolvedUserName}</p>
              </div>
              <form action={logoutAction}>
                <Button type="submit" variant="outline" size="xs">
                  Esci
                </Button>
              </form>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-4 py-5 pb-8 md:px-6 md:py-6">{children}</main>

          <footer className="border-t border-border/70 bg-surface-1 p-2 lg:hidden">
            <AppNavigation mobile />
          </footer>
        </div>

      </div>
    </div>
  );
}
