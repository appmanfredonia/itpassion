import type { PostgrestError, SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type PassionOption = {
  slug: string;
  name: string;
};

export const AUTH_ROUTES = ["/login", "/register"] as const;

const PROTECTED_ROUTE_PREFIXES = [
  "/onboarding",
  "/feed",
  "/create",
  "/profile",
  "/explore",
  "/search",
  "/messages",
  "/notifications",
  "/saved",
  "/settings",
] as const;

function isRelationMissingError(error: PostgrestError | null): boolean {
  return error?.code === "42P01";
}

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname === route);
}

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function getAuthenticatedRedirectPath(hasPassions: boolean): "/onboarding" | "/feed" {
  return hasPassions ? "/feed" : "/onboarding";
}

export async function getPassionCatalog(
  supabase: SupabaseClient<Database>,
): Promise<{ passions: PassionOption[] }> {
  const { data, error } = await supabase.from("passions").select("slug, name").order("name");

  if (error) {
    throw error;
  }

  return {
    passions: data ?? [],
  };
}

export async function getUserPassionStatus(
  supabase: SupabaseClient<Database>,
  user: User | null,
): Promise<{ hasPassions: boolean; source: "database" | "none" }> {
  if (!user) {
    return { hasPassions: false, source: "none" };
  }

  const { count, error } = await supabase
    .from("user_passions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (!error && (count ?? 0) > 0) {
    return { hasPassions: true, source: "database" };
  }

  if (error && !isRelationMissingError(error)) {
    throw error;
  }

  return { hasPassions: false, source: "none" };
}

export async function getUserSelectedPassionSlugs(
  supabase: SupabaseClient<Database>,
  user: User | null,
): Promise<string[]> {
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("user_passions")
    .select("passion_slug")
    .eq("user_id", user.id);

  if (!error && data && data.length > 0) {
    return data.map((item) => item.passion_slug);
  }

  if (error && !isRelationMissingError(error)) {
    throw error;
  }

  return [];
}

export async function saveUserPassions(
  supabase: SupabaseClient<Database>,
  user: User,
  selectedSlugs: string[],
): Promise<{ storage: "database" }> {
  const normalizedSlugs = Array.from(
    new Set(
      selectedSlugs
        .filter((slug): slug is string => typeof slug === "string")
        .map((slug) => slug.trim())
        .filter(Boolean),
    ),
  );

  if (normalizedSlugs.length === 0) {
    throw new Error("Nessuna passione valida selezionata.");
  }

  const { data: passionsRows, error: passionsError } = await supabase
    .from("passions")
    .select("slug")
    .in("slug", normalizedSlugs);

  if (passionsError) {
    throw passionsError;
  }

  const existingSlugs = new Set((passionsRows ?? []).map((row) => row.slug));
  const missingSlugs = normalizedSlugs.filter((slug) => !existingSlugs.has(slug));
  if (missingSlugs.length > 0) {
    throw new Error(`Passioni non trovate nel database: ${missingSlugs.join(", ")}`);
  }

  const { error: deleteError } = await supabase
    .from("user_passions")
    .delete()
    .eq("user_id", user.id);
  if (deleteError) {
    throw deleteError;
  }

  const { error: insertError } = await supabase.from("user_passions").insert(
    normalizedSlugs.map((passionSlug) => ({
      user_id: user.id,
      passion_slug: passionSlug,
    })),
  );

  if (insertError) {
    throw insertError;
  }

  return { storage: "database" };
}
