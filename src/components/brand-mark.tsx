import Link from "next/link";
import { Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  compact?: boolean;
  className?: string;
  metaMode?: "badge" | "tagline" | "none";
};

export function BrandMark({
  compact = false,
  className,
  metaMode = "badge",
}: BrandMarkProps) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative inline-flex size-11 items-center justify-center rounded-2xl border border-primary/35 bg-[radial-gradient(circle_at_30%_28%,rgba(214,162,255,0.95),transparent_34%),linear-gradient(135deg,rgba(84,48,181,0.96),rgba(45,127,255,0.92))] text-primary-foreground shadow-[0_18px_40px_-24px_oklch(0.73_0.16_294_/_0.92)]">
        <span className="absolute inset-[1px] rounded-[0.95rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0))]" />
        <Heart className="relative size-5 fill-current" />
      </span>
      {!compact && (
        <span className="flex flex-col gap-1">
          <span className="text-sm font-semibold leading-none tracking-tight">{siteConfig.name}</span>
          {metaMode === "badge" ? (
            <Badge
              variant="secondary"
              className="w-fit text-[10px] tracking-[0.18em] uppercase"
            >
              Social network
            </Badge>
          ) : null}
          {metaMode === "tagline" ? (
            <span className="text-sm leading-none text-muted-foreground">Condividi cio che ami.</span>
          ) : null}
        </span>
      )}
    </Link>
  );
}
