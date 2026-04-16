import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  description?: string;
  badge?: string;
  action?: ReactNode;
  className?: string;
};

export function SectionHeader({
  title,
  description,
  badge,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 md:gap-4", className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        {badge && (
          <Badge
            variant="secondary"
            className="w-fit border-primary/20 bg-primary/10 px-3 py-1 text-[10px] tracking-[0.18em] text-primary uppercase"
          >
            {badge}
          </Badge>
        )}
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="max-w-[22rem] text-2xl font-semibold tracking-[-0.03em] text-balance md:max-w-none md:text-[2rem]">
            {title}
          </h1>
          <span className="h-px w-16 bg-gradient-to-r from-primary via-accent to-transparent" />
        </div>
        {description && (
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground/95">{description}</p>
        )}
      </div>
      {action ? <div className="flex w-full flex-wrap justify-start gap-2 sm:w-auto sm:justify-end">{action}</div> : null}
    </div>
  );
}
