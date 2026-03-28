import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import type { AnalyzerResult } from "../types.js";

export async function analyzeDependencies(projectPath: string): Promise<AnalyzerResult> {
  const issues: import("../types.js").DiagnosticIssue[] = [];
  let checksRun = 0;
  let checksPassed = 0;

  const pkgPath = join(projectPath, "package.json");
  if (!existsSync(pkgPath)) {
    return { name: "Dependencies", score: 0, issues: [{ severity: "critical", rule: "no-package-json", message: "No package.json found" }], summary: "No package.json" };
  }

  let pkg: Record<string, any>;
  try {
    pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  } catch {
    return { name: "Dependencies", score: 0, issues: [{ severity: "critical", rule: "invalid-package-json", message: "Cannot parse package.json" }], summary: "Invalid package.json" };
  }

  // 1. Lock file
  checksRun++;
  const hasLock = existsSync(join(projectPath, "package-lock.json")) || existsSync(join(projectPath, "pnpm-lock.yaml")) || existsSync(join(projectPath, "yarn.lock"));
  if (hasLock) { checksPassed++; } else {
    issues.push({ severity: "critical", rule: "no-lock-file", message: "No lock file — builds not reproducible", fix: "Run npm install to generate package-lock.json" });
  }

  // 2. npm audit
  checksRun++;
  try {
    const out = execSync("npm audit --json 2>/dev/null", { cwd: projectPath, timeout: 30000, encoding: "utf-8" });
    const audit = JSON.parse(out);
    const vulns = audit.metadata?.vulnerabilities || {};
    const critical = vulns.critical || 0;
    const high = vulns.high || 0;
    const moderate = vulns.moderate || 0;

    if (critical + high + moderate === 0) {
      checksPassed++;
    } else {
      if (critical > 0) issues.push({ severity: "critical", rule: "vuln-critical", message: `${critical} critical vulnerabilit${critical > 1 ? "ies" : "y"}`, fix: "Run npm audit fix" });
      if (high > 0) issues.push({ severity: "warning", rule: "vuln-high", message: `${high} high severity vulnerabilit${high > 1 ? "ies" : "y"}`, fix: "Run npm audit fix" });
      if (moderate > 0) issues.push({ severity: "info", rule: "vuln-moderate", message: `${moderate} moderate vulnerabilit${moderate > 1 ? "ies" : "y"}` });
    }
  } catch {
    checksPassed += 0.5;
  }

  // 3. Engines field
  checksRun++;
  if (pkg.engines?.node) { checksPassed++; } else {
    issues.push({ severity: "info", rule: "no-engines", message: "No engines.node in package.json", fix: 'Add "engines": { "node": ">=18.0.0" }' });
  }

  // 4. Essential scripts
  checksRun++;
  if (pkg.scripts?.build && (pkg.scripts?.start || pkg.scripts?.dev)) { checksPassed++; } else {
    issues.push({ severity: "warning", rule: "missing-scripts", message: "Missing essential scripts (build, start/dev)", fix: "Add build and start scripts" });
  }

  // 5. Deprecated deps
  checksRun++;
  const risky = ["request", "node-uuid", "nomnom", "coffee-script"];
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const found = risky.filter((d) => d in allDeps);
  if (found.length === 0) { checksPassed++; } else {
    found.forEach((d) => issues.push({ severity: "warning", rule: "deprecated-dep", message: `"${d}" is deprecated` }));
  }

  const score = checksRun > 0 ? Math.round((checksPassed / checksRun) * 100) : 0;
  return { name: "Dependencies", score, issues, summary: `${Math.round(checksPassed)}/${checksRun} checks passed` };
}
