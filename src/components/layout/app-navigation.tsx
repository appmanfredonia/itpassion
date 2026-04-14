"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { appNavigation } from "@/lib/site";
import { cn } from "@/lib/utils";

type AppNavigationProps = {
  mobile?: boolean;
};

export function AppNavigation({ mobile = false }: AppNavigationProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex", mobile ? "grid grid-cols-4 gap-2" : "flex-col gap-1")}>
      {appNavigation.map((item) => {
        const isActive =
          pathname === item.href ||
          pathname.startsWith(`${item.href}/`) ||
          (item.href === "/profile" && pathname.startsWith("/profile/"));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              buttonVariants({
                variant: isActive ? "secondary" : "ghost",
                size: mobile ? "xs" : "sm",
              }),
              mobile ? "h-auto flex-col py-2 text-[11px]" : "w-full justify-start",
            )}
          >
            {mobile ? item.shortLabel : item.label}
          </Link>
        );
      })}
    </nav>
  );
}

