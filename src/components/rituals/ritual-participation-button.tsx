"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleMinus, CirclePlus, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type RitualParticipationButtonProps = {
  ritualId: string;
  joinedByMe: boolean;
  participantCount: number;
  maxParticipants: number | null;
  isCreator?: boolean;
  size?: "xs" | "sm" | "default";
  variant?: "default" | "secondary" | "outline";
  className?: string;
  onParticipationChange?: (nextState: {
    joinedByMe: boolean;
    participantCount: number;
  }) => void;
};

export function RitualParticipationButton({
  ritualId,
  joinedByMe,
  participantCount,
  maxParticipants,
  isCreator = false,
  size = "sm",
  variant = "secondary",
  className,
  onParticipationChange,
}: RitualParticipationButtonProps) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [joined, setJoined] = useState(joinedByMe);
  const [count, setCount] = useState(participantCount);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setJoined(joinedByMe);
  }, [joinedByMe]);

  useEffect(() => {
    setCount(participantCount);
  }, [participantCount]);

  const isFull = maxParticipants !== null && count >= maxParticipants && !joined;
  const buttonLabel = isCreator
    ? "Creato da te"
    : joined
      ? "Annulla partecipazione"
      : "Partecipa";

  async function handleToggleParticipation() {
    if (isPending || isCreator || isFull) {
      return;
    }

    setIsPending(true);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setIsPending(false);
      return;
    }

    const nextJoined = !joined;
    const nextCount = Math.max(0, count + (nextJoined ? 1 : -1));

    setJoined(nextJoined);
    setCount(nextCount);
    onParticipationChange?.({
      joinedByMe: nextJoined,
      participantCount: nextCount,
    });

    const mutation = nextJoined
      ? supabase.from("tribe_ritual_participants").insert({
          ritual_id: ritualId,
          user_id: user.id,
        })
      : supabase
          .from("tribe_ritual_participants")
          .delete()
          .eq("ritual_id", ritualId)
          .eq("user_id", user.id);

    const { error } = await mutation;
    if (error) {
      const rollbackJoined = !nextJoined;
      const rollbackCount = Math.max(0, nextCount + (nextJoined ? -1 : 1));
      setJoined(rollbackJoined);
      setCount(rollbackCount);
      onParticipationChange?.({
        joinedByMe: rollbackJoined,
        participantCount: rollbackCount,
      });
    }

    setIsPending(false);
  }

  return (
    <Button
      type="button"
      size={size}
      variant={joined || isCreator ? "secondary" : variant}
      disabled={isPending || isCreator || isFull}
      onClick={handleToggleParticipation}
      className={cn(
        "justify-center",
        (joined || isCreator) && "border-primary/22 bg-primary/12 text-primary hover:bg-primary/16",
        className,
      )}
    >
      {isPending ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : joined || isCreator ? (
        <CircleMinus className="size-4" />
      ) : (
        <CirclePlus className="size-4" />
      )}
      {isFull ? "Posti finiti" : buttonLabel}
    </Button>
  );
}
