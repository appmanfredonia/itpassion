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
  const items = mobile
    ? appNavigation.filter((item) =>
        ["/feed", "/explore", "/create", "/messages", "/profile"].includes(item.href),
      )
    : appNavigation;

  return (
    <nav
      className={cn(
        "flex",
        mobile
          ? "no-scrollbar -mx-1 overflow-x-auto px-1"
          : "flex-col gap-2",
      )}
    >
      {items.map((item) => {
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
              "group/nav-item inline-flex items-center gap-2 rounded-2xl border text-sm font-medium tracking-tight transition-[border-color,background-color,color,box-shadow,transform] duration-200",
              isActive
                ? "border-primary/40 bg-gradient-to-r from-primary/22 to-accent/12 text-foreground shadow-[0_18px_38px_-24px_oklch(0.73_0.16_294_/_0.82)]"
                : "border-transparent bg-transparent text-muted-foreground hover:border-border/80 hover:bg-surface-1 hover:text-foreground",
              mobile
                ? "mr-2 min-w-[4.8rem] flex-col justify-center gap-1 rounded-[1.4rem] px-2.5 py-2.5 text-[11px]"
                : "w-full justify-start px-3.5 py-3",
            )}
          >
            <span
              className={cn(
                "inline-flex items-center justify-center rounded-full border border-transparent transition-colors duration-200",
                isActive
                  ? "bg-primary/18 text-primary shadow-[0_10px_22px_-16px_oklch(0.73_0.16_294_/_0.9)]"
                  : "bg-surface-1/40 text-muted-foreground group-hover/nav-item:bg-surface-2 group-hover/nav-item:text-foreground",
                mobile ? "size-8" : "size-9",
              )}
            >
              <Icon className={cn("size-4", mobile && "size-3.5")} />
            </span>
            {mobile ? item.shortLabel : item.label}
          </Link>
        );
      })}
    </nav>
  );
}
