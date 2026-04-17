function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getAppSiteUrl(): string {
  const explicitSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  if (explicitSiteUrl && explicitSiteUrl.trim().length > 0) {
    return trimTrailingSlash(explicitSiteUrl.trim());
  }

  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProductionUrl && vercelProductionUrl.trim().length > 0) {
    return `https://${trimTrailingSlash(vercelProductionUrl.trim())}`;
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl.trim().length > 0) {
    return `https://${trimTrailingSlash(vercelUrl.trim())}`;
  }

  return "http://localhost:3000";
}

export function toAbsoluteAppUrl(path: string): string {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return `${getAppSiteUrl()}${safePath}`;
}

