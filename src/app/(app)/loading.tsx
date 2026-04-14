import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-40 w-full" />
      <div className="grid gap-3 md:grid-cols-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  );
}

