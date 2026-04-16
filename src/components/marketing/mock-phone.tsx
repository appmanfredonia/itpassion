import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MockPhoneProps = {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  chrome?: ReactNode;
  footer?: ReactNode;
};

export function MockPhone({ children, className, header, chrome, footer }: MockPhoneProps) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[23rem] rounded-[2rem] border border-border/90 bg-[linear-gradient(180deg,rgba(15,20,34,0.98),rgba(8,11,21,0.98))] p-2 shadow-[0_36px_90px_-42px_oklch(0_0_0_/_0.96)]",
        className,
      )}
    >
      <div className="absolute inset-x-8 top-0 h-16 rounded-full bg-primary/18 blur-3xl" />
      <div className="relative overflow-hidden rounded-[1.65rem] border border-border/85 bg-[linear-gradient(180deg,rgba(11,16,31,1),rgba(7,11,22,1))]">
        {header ?? (
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 text-[11px] text-muted-foreground">
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
        <div className="relative p-4">{children}</div>
        {footer ? (
          <div className="border-t border-border/70 bg-black/12 px-4 py-3">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
