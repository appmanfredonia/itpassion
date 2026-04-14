type SupabaseEnv = {
  url: string;
  anonKey: string;
};

export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const missingKeys: string[] = [];

  if (!url) {
    missingKeys.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!anonKey) {
    missingKeys.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (missingKeys.length > 0) {
    throw new Error(
      `Variabili Supabase mancanti: ${missingKeys.join(", ")}. Esegui 'npm run env:pull' in locale e configura le stesse variabili su Vercel (Development/Preview/Production).`,
    );
  }

  return { url: url as string, anonKey: anonKey as string };
}
