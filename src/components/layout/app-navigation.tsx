"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bookmark,
  Compass,
  House,
  MessageCircle,
  PlusSquare,
  Search,
  Settings,
  UserRound,
} from "lucide-react";
import { appNavigation } from "@/lib/site";
import { cn } from "@/lib/utils";

type AppNavigationProps = {
  mobile?: boolean;
};

export function AppNavigation({ mobile = false }: AppNavigationProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex",
        mobile
          ? "no-scrollbar -mx-1 overflow-x-auto px-1"
          : "flex-col gap-1.5",
      )}
    >
      {appNavigation.map((item) => {
        const isActive =
          pathname === item.href ||
          pathname.startsWith(`${item.href}/`) ||
          (item.href === "/profile" && pathname.startsWith("/profile/"));

        const icon = (() => {
          if (item.href === "/feed") return House;
          if (item.href === "/create") return PlusSquare;
          if (item.href === "/explore") return Compass;
          if (item.href === "/search") return Search;
          if (item.href === "/messages") return MessageCircle;
          if (item.href === "/notifications") return Bell;
          if (item.href === "/saved") return Bookmark;
          if (item.href === "/profile") return UserRound;
          return Settings;
        })();
        const Icon = icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group/nav-item inline-flex items-center gap-2 rounded-xl border text-sm font-medium tracking-tight transition-[border-color,background-color,color,transform] duration-150",
              isActive
                ? "border-primary/45 bg-primary/14 text-foreground shadow-[0_14px_28px_-24px_oklch(0.76_0.11_198)]"
                : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-surface-1 hover:text-foreground",
              mobile
                ? "mr-1.5 min-w-[4.75rem] flex-col justify-center gap-1 px-2.5 py-2 text-[11px]"
                : "w-full justify-start px-3 py-2.5",
            )}
          >
            <Icon className={cn("size-4", mobile && "size-3.5")} />
            {mobile ? item.shortLabel : item.label}
          </Link>
        );
      })}
    </nav>
  );
}
