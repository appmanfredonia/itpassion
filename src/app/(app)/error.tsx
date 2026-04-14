"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-xl">
      <Card className="border-destructive/40 bg-card/85">
        <CardHeader>
          <CardTitle>Qualcosa e andato storto</CardTitle>
          <CardDescription>Puoi riprovare senza perdere il contesto della pagina.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Dettaglio: {error.message || "errore non specificato"}
          </p>
          <Button onClick={reset}>Riprova</Button>
        </CardContent>
      </Card>
    </div>
  );
}

