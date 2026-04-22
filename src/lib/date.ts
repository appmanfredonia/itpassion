const ITALIAN_LOCALE = "it-IT";
const ITALIAN_TIME_ZONE = "Europe/Rome";

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatItalianDateTime(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {},
): string {
  return new Intl.DateTimeFormat(ITALIAN_LOCALE, {
    timeZone: ITALIAN_TIME_ZONE,
    ...options,
  }).format(toDate(value));
}

export function formatItalianDayMonth(value: string | Date): string {
  return formatItalianDateTime(value, {
    day: "2-digit",
    month: "short",
  });
}

export function formatItalianShortDateTime(value: string | Date): string {
  return formatItalianDateTime(value, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function formatItalianMediumDateTime(value: string | Date): string {
  return formatItalianDateTime(value, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
