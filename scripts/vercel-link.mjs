import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function normalizeEnv(name) {
  const raw = process.env[name];
  if (typeof raw !== "string") {
    return null;
  }

  const value = raw.trim();
  return value.length > 0 ? value : null;
}

function main() {
  const cwd = process.cwd();
  const projectConfigPath = path.join(cwd, ".vercel", "project.json");

  if (fs.existsSync(projectConfigPath)) {
    console.log("[vercel-link] Progetto gia collegato (.vercel/project.json trovato).");
    return;
  }

  const projectName = normalizeEnv("VERCEL_PROJECT_NAME") ?? normalizeEnv("VERCEL_PROJECT");
  const scope = normalizeEnv("VERCEL_SCOPE") ?? normalizeEnv("VERCEL_TEAM");

  const args = ["vercel", "link", "--yes"];
  if (projectName) {
    args.push("--project", projectName);
  }
  if (scope) {
    args.push("--scope", scope);
  }

  console.log(`[vercel-link] Eseguo: npx ${args.join(" ")}`);
  const result = spawnSync("npx", args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    console.error("[vercel-link] Errore durante il collegamento Vercel:", result.error.message);
    process.exit(1);
  }

  if ((result.status ?? 1) !== 0) {
    console.error("");
    console.error("[vercel-link] Link Vercel non completato.");
    console.error(
      "Se vuoi forzare account/progetto senza prompt, imposta VERCEL_SCOPE e VERCEL_PROJECT_NAME.",
    );
    process.exit(result.status ?? 1);
  }
}

main();
