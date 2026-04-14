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
  return (
    <div className="min-h-screen px-3 py-3 md:px-6 md:py-6">
      <div className="mx-auto flex w-full max-w-7xl gap-4">
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 flex-col gap-6 rounded-2xl border border-border/70 bg-sidebar/90 p-4 backdrop-blur lg:flex">
          <BrandMark />
          <AppNavigation />
          <div className="mt-auto flex flex-col gap-3 rounded-xl border border-border/70 bg-background/70 p-3">
            <div className="flex flex-col">
              <p className="text-sm font-medium">{userName || "@itpassion"}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
            <form action={logoutAction}>
              <Button type="submit" variant="outline" className="w-full">
                Esci
              </Button>
            </form>
          </div>
        </aside>

        <div className="flex min-h-[calc(100vh-1.5rem)] flex-1 flex-col rounded-2xl border border-border/70 bg-card/85 backdrop-blur">
          <header className="flex items-center justify-between border-b border-border/70 px-4 py-4 lg:hidden">
            <BrandMark compact />
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="xs">
                Esci
              </Button>
            </form>
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
          <footer className="border-t border-border/70 p-3 lg:hidden">
            <AppNavigation mobile />
          </footer>
        </div>
      </div>
    </div>
  );
}
