import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MockPhoneProps = {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  chrome?: ReactNode;
  footer?: ReactNode;
  bodyClassName?: string;
  footerClassName?: string;
};

export function MockPhone({
  children,
  className,
  header,
  chrome,
  footer,
  bodyClassName,
  footerClassName,
}: MockPhoneProps) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[23rem] rounded-[1.9rem] border border-border/90 bg-[linear-gradient(180deg,rgba(14,18,32,0.99),rgba(8,11,20,0.99))] p-[7px] shadow-[0_28px_72px_-40px_oklch(0_0_0_/_0.94)]",
        className,
      )}
    >
      <div className="absolute inset-x-10 top-1 h-14 rounded-full bg-primary/14 blur-3xl" />
      <div className="relative overflow-hidden rounded-[1.52rem] border border-border/85 bg-[linear-gradient(180deg,rgba(11,16,31,1),rgba(7,11,22,1))]">
        {header ?? (
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-2.5 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-2 rounded-full bg-primary shadow-[0_0_14px_oklch(0.73_0.16_294_/_0.95)]" />
              <span className="font-semibold tracking-tight text-foreground">ItPassion</span>
            </div>
            {chrome ?? (
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-muted-foreground/60" />
                <span className="size-1.5 rounded-full bg-muted-foreground/35" />
                <span className="size-1.5 rounded-full bg-muted-foreground/20" />
              </div>
            )}
          </div>
        )}
        <div className={cn("relative p-3.5 sm:p-4", bodyClassName)}>{children}</div>
        {footer ? (
          <div
            className={cn(
              "border-t border-border/70 bg-black/12 px-3.5 py-2.5 sm:px-4 sm:py-3",
              footerClassName,
            )}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
