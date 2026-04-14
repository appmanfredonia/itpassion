import fs from "node:fs";
import path from "node:path";

const FALLBACK_REQUIRED_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

function parseMode() {
  const fromArgs = process.argv[2];

  if (fromArgs === "production" || fromArgs === "development" || fromArgs === "test") {
    return fromArgs;
  }

  if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test") {
    return process.env.NODE_ENV;
  }

  return "development";
}

function stripQuotes(value) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const parsed = {};
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const normalized = line.startsWith("export ") ? line.slice(7) : line;
    const separatorIndex = normalized.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = normalized.slice(0, separatorIndex).trim();
    const rawValue = normalized.slice(separatorIndex + 1);
    parsed[key] = stripQuotes(rawValue);
  }

  return parsed;
}

function readRequiredKeys(examplePath) {
  if (!fs.existsSync(examplePath)) {
    return FALLBACK_REQUIRED_KEYS;
  }

  const content = fs.readFileSync(examplePath, "utf8");
  const keys = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.replace(/^export\s+/, ""))
    .map((line) => line.split("=", 1)[0]?.trim())
    .filter(Boolean);

  return keys.length > 0 ? keys : FALLBACK_REQUIRED_KEYS;
}

function loadMergedEnv(cwd, mode) {
  const filesByMode = {
    development: [".env", ".env.development", ".env.local", ".env.development.local"],
    production: [".env", ".env.production", ".env.local", ".env.production.local"],
    test: [".env", ".env.test", ".env.test.local"],
  };

  const selectedFiles = filesByMode[mode] ?? filesByMode.development;
  const merged = {};

  for (const relativePath of selectedFiles) {
    const filePath = path.join(cwd, relativePath);
    Object.assign(merged, parseEnvFile(filePath));
  }

  return merged;
}

function main() {
  const cwd = process.cwd();
  const mode = parseMode();
  const envFromFiles = loadMergedEnv(cwd, mode);
  const requiredKeys = readRequiredKeys(path.join(cwd, ".env.example"));

  const missing = requiredKeys.filter((key) => {
    const fromProcess = process.env[key]?.trim();
    const fromFile = envFromFiles[key]?.trim();
    return !fromProcess && !fromFile;
  });

  if (missing.length === 0) {
    console.log(`[env-check] OK: ${requiredKeys.length} variabili obbligatorie presenti (${mode}).`);
    return;
  }

  const isLinkedToVercel = fs.existsSync(path.join(cwd, ".vercel", "project.json"));
  const linkStep = isLinkedToVercel
    ? "1) Progetto Vercel gia collegato."
    : "1) Collega il progetto: npm run vercel:link";

  console.error("[env-check] Variabili obbligatorie mancanti:");
  for (const key of missing) {
    console.error(`- ${key}`);
  }

  console.error("");
  console.error("Passi consigliati per un setup stabile:");
  console.error(linkStep);
  console.error(
    "   Opzionale: imposta VERCEL_SCOPE e VERCEL_PROJECT_NAME per un link non interattivo.",
  );
  console.error("2) Sincronizza le env locali: npm run env:pull");
  console.error("3) Imposta le stesse env su Vercel per Development/Preview/Production.");
  console.error("");
  console.error("Se l'errore avviene in Preview su Vercel, aggiungi le env nel Project Settings > Environment Variables.");

  process.exit(1);
}

main();
