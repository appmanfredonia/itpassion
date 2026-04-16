import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type StoryItem = {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

type FeedStoryStripProps = {
  items: StoryItem[];
};

function avatarFallback(username: string): string {
  const normalized = username.replace("@", "").trim();
  return normalized.length > 0 ? normalized.slice(0, 2).toUpperCase() : "IT";
}

export function FeedStoryStrip({ items }: FeedStoryStripProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
      {items.map((item) => (
        <Link
          key={item.userId}
          href={`/profile/${item.username}`}
          className="flex min-w-[4.25rem] flex-col items-center gap-1.5 text-center"
        >
          <span className="inline-flex rounded-full bg-[linear-gradient(135deg,oklch(0.73_0.16_294),oklch(0.7_0.15_243))] p-[2px] shadow-[0_12px_28px_-16px_oklch(0.73_0.16_294_/_0.8)]">
            <Avatar className="size-14 border border-black/30 bg-background">
              {item.avatarUrl ? <AvatarImage src={item.avatarUrl} alt={`Avatar di @${item.username}`} /> : null}
              <AvatarFallback>{avatarFallback(item.username)}</AvatarFallback>
            </Avatar>
          </span>
          <div className="flex flex-col">
            <span className="max-w-[4.5rem] truncate text-[11px] font-medium text-foreground">
              {item.displayName}
            </span>
            <span className="max-w-[4.5rem] truncate text-[10px] text-muted-foreground">
              @{item.username}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
