"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type"> & {
  className?: string;
};

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={isVisible ? "text" : "password"}
        className={cn("h-11 rounded-2xl pr-11", className)}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={isVisible ? "Nascondi password" : "Mostra password"}
        aria-pressed={isVisible}
        className="absolute inset-y-0 right-1.5 my-auto size-8 rounded-full text-muted-foreground hover:text-foreground"
        onClick={() => setIsVisible((currentValue) => !currentValue)}
      >
        {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  );
}

