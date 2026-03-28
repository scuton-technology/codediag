import { existsSync, readFileSync } from "fs";
import { join, relative } from "path";
import { glob } from "glob";
import type { AnalyzerResult, DiagnosticIssue } from "../types.js";

const SECRET_PATTERNS = [
  { pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"][a-zA-Z0-9_\-]{20,}['"]/gi, name: "API Key" },
  { pattern: /(?:secret|password|passwd|pwd)\s*[:=]\s*['"][^'"]{8,}['"]/gi, name: "Secret/Password" },
  { pattern: /sk[_-](?:live|test)[_-][a-zA-Z0-9]{20,}/g, name: "Stripe Key" },
  { pattern: /ghp_[a-zA-Z0-9]{36,}/g, name: "GitHub Token" },
  { pattern: /(?:aws[_-]?access[_-]?key[_-]?id)\s*[:=]\s*['"]?[A-Z0-9]{20}['"]?/gi, name: "AWS Key" },
];

export async function analyzeSecurity(projectPath: string): Promise<AnalyzerResult> {
  const issues: DiagnosticIssue[] = [];
  let checksRun = 0;
  let checksPassed = 0;

  // 1. .gitignore has .env
  checksRun++;
  const gitignorePath = join(projectPath, ".gitignore");
  if (existsSync(gitignorePath)) {
    const content = readFileSync(gitignorePath, "utf-8");
    if (content.includes(".env")) {
      checksPassed++;
    } else {
      issues.push({ severity: "critical", rule: "env-not-gitignored", message: ".env is not in .gitignore — secrets may be committed", file: ".gitignore", fix: "Add .env to your .gitignore" });
    }
  } else {
    issues.push({ severity: "critical", rule: "no-gitignore", message: "No .gitignore file found", fix: "Create .gitignore with .env, node_modules, dist" });
  }

  // 2. Hardcoded secrets
  checksRun++;
  const sourceFiles = await glob("**/*.{ts,js}", { cwd: projectPath, ignore: ["node_modules/**", "dist/**", "*.lock"], absolute: true });
  let secretsFound = false;

  for (const filePath of sourceFiles.slice(0, 100)) {
    try {
      const content = readFileSync(filePath, "utf-8");
      const relFile = relative(projectPath, filePath).replace(/\\/g, "/");
      for (const { pattern, name } of SECRET_PATTERNS) {
        pattern.lastIndex = 0;
        if (pattern.test(content)) {
          secretsFound = true;
          issues.push({ severity: "critical", rule: "hardcoded-secret", message: `Possible ${name} found in source code`, file: relFile, fix: "Move secrets to .env and use environment variables" });
        }
      }
    } catch { /* skip */ }
  }
  if (!secretsFound) checksPassed++;

  // 3. Helmet
  checksRun++;
  const mainFiles = await glob("**/main.{ts,js}", { cwd: projectPath, ignore: ["node_modules/**", "dist/**"], absolute: true });
  let hasHelmet = false;
  for (const f of mainFiles) {
    try { if (readFileSync(f, "utf-8").includes("helmet")) { hasHelmet = true; break; } } catch { /* skip */ }
  }
  if (hasHelmet) { checksPassed++; } else {
    issues.push({ severity: "warning", rule: "no-helmet", message: "Helmet middleware not detected", fix: "Install helmet and add app.use(helmet()) in main.ts" });
  }

  // 4. CORS
  checksRun++;
  let dangerousCors = false;
  for (const f of mainFiles) {
    try {
      const c = readFileSync(f, "utf-8");
      if (c.includes("enableCors") && (c.includes("origin: '*'") || c.includes("origin: \"*\"") || c.includes("origin: true"))) {
        dangerousCors = true;
      }
    } catch { /* skip */ }
  }
  if (!dangerousCors) { checksPassed++; } else {
    issues.push({ severity: "warning", rule: "open-cors", message: "CORS configured with wildcard origin (*)", fix: "Set specific allowed origins" });
  }

  // 5. Rate limiting
  checksRun++;
  const pkgPath = join(projectPath, "package.json");
  let hasRateLimit = false;
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      hasRateLimit = !!(deps["@nestjs/throttler"] || deps["express-rate-limit"] || deps["rate-limiter-flexible"]);
    } catch { /* skip */ }
  }
  if (hasRateLimit) { checksPassed++; } else {
    issues.push({ severity: "warning", rule: "no-rate-limiting", message: "No rate limiting package detected", fix: "Install @nestjs/throttler or express-rate-limit" });
  }

  // 6. Password hashing
  checksRun++;
  let hasHashing = false;
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      hasHashing = !!(deps["bcrypt"] || deps["bcryptjs"] || deps["argon2"]);
    } catch { /* skip */ }
  }
  if (hasHashing) { checksPassed++; } else {
    issues.push({ severity: "info", rule: "no-password-hashing", message: "No password hashing library detected", fix: "Install argon2 or bcryptjs if handling passwords" });
  }

  const score = checksRun > 0 ? Math.round((checksPassed / checksRun) * 100) : 0;

  return { name: "Security", score, issues, summary: `${checksPassed}/${checksRun} checks passed` };
}
