import ora from "ora";
import chalk from "chalk";
import { basename } from "path";
import { existsSync } from "fs";
import { detectStack } from "./detectors/stack-detector.js";
import { analyzeNestjsApi } from "./analyzers/nestjs-api.js";
import { analyzeSecurity } from "./analyzers/security.js";
import { analyzeDependencies } from "./analyzers/dependencies.js";
import { analyzeTesting } from "./analyzers/testing.js";
import { analyzeStructure } from "./analyzers/structure.js";
import type { ScanResult, AnalyzerResult } from "./types.js";

const WEIGHTS: Record<string, number> = {
  "API Health": 25,
  "Security": 30,
  "Dependencies": 20,
  "Testing": 15,
  "Structure": 10,
};

function calculateGrade(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "B+";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export async function scan(projectPath: string): Promise<ScanResult> {
  if (!existsSync(projectPath)) {
    throw new Error(`Directory not found: ${projectPath}`);
  }

  const spinner = ora({ text: chalk.dim("Detecting project stack..."), color: "cyan" }).start();

  // Detect stack
  const stack = detectStack(projectPath);
  const stackLabel = [stack.framework, stack.language, stack.orm].filter(Boolean).join(" + ");
  spinner.succeed(chalk.dim(`Stack: ${stackLabel}`));

  const results: AnalyzerResult[] = [];

  // API Health (NestJS only)
  if (stack.framework === "nestjs") {
    spinner.start(chalk.dim("Analyzing API health..."));
    const r = await analyzeNestjsApi(projectPath);
    results.push(r);
    spinner.succeed(chalk.dim(`API Health: ${r.score}/100`));
  }

  // Security
  spinner.start(chalk.dim("Scanning security..."));
  const sec = await analyzeSecurity(projectPath);
  results.push(sec);
  spinner.succeed(chalk.dim(`Security: ${sec.score}/100`));

  // Dependencies
  spinner.start(chalk.dim("Auditing dependencies..."));
  const dep = await analyzeDependencies(projectPath);
  results.push(dep);
  spinner.succeed(chalk.dim(`Dependencies: ${dep.score}/100`));

  // Testing
  spinner.start(chalk.dim("Checking test coverage..."));
  const test = await analyzeTesting(projectPath);
  results.push(test);
  spinner.succeed(chalk.dim(`Testing: ${test.score}/100`));

  // Structure
  spinner.start(chalk.dim("Analyzing project structure..."));
  const str = await analyzeStructure(projectPath);
  results.push(str);
  spinner.succeed(chalk.dim(`Structure: ${str.score}/100`));

  // Calculate total
  let totalWeight = 0;
  let weightedSum = 0;
  for (const r of results) {
    const w = WEIGHTS[r.name] || 10;
    weightedSum += r.score * w;
    totalWeight += w;
  }

  const totalScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  const grade = calculateGrade(totalScore);

  return {
    project: basename(projectPath),
    stack,
    analyzers: results,
    totalScore,
    grade,
    timestamp: new Date().toISOString(),
  };
}
