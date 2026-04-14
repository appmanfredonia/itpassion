export function safePathFromForm(value: FormDataEntryValue | null, fallback: string): string {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return fallback;
  }

  return value;
}

export function withQueryParam(path: string, key: string, value: string): string {
  const url = new URL(path, "http://localhost");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}`;
}

export function actionErrorDetail(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const maybeMessage = "message" in error ? String(error.message) : null;
    const maybeCode = "code" in error ? String(error.code) : null;
    return [maybeMessage, maybeCode]
      .filter((value): value is string => Boolean(value))
      .join(" | ");
  }

  return "Errore sconosciuto";
}
