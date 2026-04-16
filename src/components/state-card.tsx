import { Inbox, LoaderCircle, OctagonAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type StateCardProps = {
  variant: "loading" | "empty" | "error";
  title: string;
  description: string;
};

const stateIcon = {
  loading: LoaderCircle,
  empty: Inbox,
  error: OctagonAlert,
} as const;

export function StateCard({ variant, title, description }: StateCardProps) {
  const Icon = stateIcon[variant];

  return (
    <Card className="border-border/80 bg-surface-1/95">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-3 text-sm tracking-tight">
          <span
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-2xl border",
              variant === "error"
                ? "border-destructive/30 bg-destructive/12 text-destructive"
                : "border-primary/20 bg-primary/10 text-primary",
            )}
          >
            <Icon
              className={cn("size-4", variant === "loading" && "animate-spin", variant === "error" && "text-destructive")}
            />
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
        {variant === "loading" ? (
          <>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </>
        ) : (
          <p>{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
