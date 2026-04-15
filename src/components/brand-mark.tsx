import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  compact?: boolean;
  className?: string;
};

export function BrandMark({ compact = false, className }: BrandMarkProps) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="inline-flex size-9 items-center justify-center rounded-xl border border-primary/35 bg-gradient-to-br from-primary/90 to-accent/90 font-semibold text-primary-foreground shadow-[0_12px_34px_-20px_oklch(0.76_0.11_198)]">
        IP
      </span>
      {!compact && (
        <span className="flex flex-col gap-1">
          <span className="text-sm font-semibold leading-none tracking-tight">{siteConfig.name}</span>
          <Badge
            variant="secondary"
            className="w-fit text-[10px] tracking-[0.18em] uppercase"
          >
            MVP
          </Badge>
        </span>
      )}
    </Link>
  );
}
