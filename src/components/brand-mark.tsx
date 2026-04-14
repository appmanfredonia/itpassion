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
    <Link href="/" className={cn("inline-flex items-center gap-2", className)}>
      <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/20">
        IP
      </span>
      {!compact && (
        <span className="flex flex-col gap-1">
          <span className="text-sm font-semibold leading-none">{siteConfig.name}</span>
          <Badge
            variant="secondary"
            className="w-fit text-[10px] tracking-[0.2em] uppercase"
          >
            MVP
          </Badge>
        </span>
      )}
    </Link>
  );
}

