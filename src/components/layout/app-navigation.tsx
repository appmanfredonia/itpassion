"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bookmark,
  Compass,
  House,
  Map,
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
        ["/feed", "/explore", "/map", "/create", "/profile"].includes(item.href),
      )
    : appNavigation;

  return (
    <nav
      className={cn(
        "flex min-h-0",
        mobile
          ? "grid w-full grid-cols-5 gap-0.5"
          : "flex-col gap-1.5",
      )}
    >
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          pathname.startsWith(`${item.href}/`) ||
          (item.href === "/profile" && pathname.startsWith("/profile/"));

        const icon = (() => {
          if (item.href === "/feed") return House;
          if (item.href === "/explore") return Compass;
          if (item.href === "/map") return Map;
          if (item.href === "/create") return PlusSquare;
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
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group/nav-item inline-flex items-center gap-2 rounded-[0.95rem] border text-sm font-medium tracking-tight transition-[border-color,background-color,color,box-shadow,transform] duration-200",
              isActive
                ? "border-primary/18 bg-primary/8 text-foreground shadow-[0_8px_18px_-18px_oklch(0.73_0.16_294_/_0.45)]"
                : "border-transparent bg-transparent text-muted-foreground hover:border-border/80 hover:bg-surface-1 hover:text-foreground",
              mobile
                ? "min-w-0 flex-1 flex-col justify-center gap-0.5 rounded-[1.2rem] px-1 py-1.5 text-[10px]"
                : "h-10 w-full justify-start px-2.5 py-1.5 text-[12.5px] leading-none",
            )}
          >
            <span
              className={cn(
                "inline-flex items-center justify-center rounded-full border border-transparent transition-colors duration-200",
                isActive
                  ? "bg-primary/12 text-primary shadow-[0_6px_12px_-12px_oklch(0.73_0.16_294_/_0.65)]"
                  : "bg-surface-1/40 text-muted-foreground group-hover/nav-item:bg-surface-2 group-hover/nav-item:text-foreground",
                mobile ? "size-[1.7rem]" : "size-7",
              )}
            >
              <Icon className={cn("size-[0.9rem]", mobile && "size-[0.9rem]")} />
            </span>
            <span className={cn("truncate", mobile && "max-w-full")}>
              {mobile ? item.shortLabel : item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
