<p align="center">
  <img src="https://raw.githubusercontent.com/scuton-technology/codediag/main/assets/logo.svg" alt="codediag" width="120" />
</p>

<h1 align="center">codediag</h1>

<p align="center">
  <strong>Diagnose your code before you ship.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/codediag"><img src="https://img.shields.io/npm/v/codediag?color=%23cb3837&label=npm" alt="npm version" /></a>
  <a href="https://github.com/scuton-technology/codediag/blob/main/LICENSE"><img src="https://img.shields.io/github/license/scuton-technology/codediag?color=%232ea44f" alt="license" /></a>
  <a href="https://github.com/scuton-technology/codediag/actions"><img src="https://img.shields.io/github/actions/workflow/status/scuton-technology/codediag/ci.yml?branch=main&label=CI" alt="CI status" /></a>
  <a href="https://www.npmjs.com/package/codediag"><img src="https://img.shields.io/npm/dm/codediag?color=%23007ec6" alt="npm downloads" /></a>
</p>

<p align="center">
  One command. Five analyzers. One score.<br/>
  Know exactly what's wrong with your project — before your users do.
</p>

---

<br/>

```bash
npx codediag scan .
```

```
  codediag — Diagnostic Report

  Project:  my-nestjs-app
  Stack:    nestjs + typescript + prisma
  Score:    B+ (87/100)

  API Health        ███████████████░░░░░  78
  Security          ██████████████████░░  92
  Dependencies      ██████████████████░░  91
  Testing           ████████████████░░░░  82
  Structure         █████████████████░░░  88

  2 critical · 5 warnings · 3 info

  ✖ POST /users has no auth guard
    src/users/users.controller.ts
    → Add @UseGuards(AuthGuard) to protect this endpoint

  ⚠ No rate limiting package detected
    → Install @nestjs/throttler for NestJS

  ⚠ Helmet middleware not detected
    → Install helmet and add app.use(helmet()) in main.ts
```

<br/>

## Why codediag?

You're about to ship. You *think* the code is ready. But is it?

- Are all your POST endpoints protected with auth guards?
- Did someone hardcode an API key in the source?
- Is your `.env` even in `.gitignore`?
- Do you have *any* tests?
- Is your `tsconfig` running in strict mode?

**codediag** answers all of this in under 10 seconds. No config needed. One command.

<br/>

## Quick start

```bash
# Run instantly (no install needed)
npx codediag scan .

# Or install globally
npm install -g codediag
codediag scan .

# Or add to your project
npm install -D codediag
```

<br/>

## What it checks

### 🔌 API Health `(NestJS)`

Discovers every endpoint in your controllers and checks what's missing.

| Check | What it looks for |
|-------|-------------------|
| **Endpoint discovery** | Scans `@Get`, `@Post`, `@Put`, `@Delete`, `@Patch` decorators |
| **Auth guards** | `@UseGuards()` on mutating endpoints (POST/PUT/DELETE/PATCH) |
| **DTO validation** | Typed `@Body()` parameters with DTO classes |
| **Swagger docs** | `@ApiOperation()`, `@ApiResponse()` decorators |
| **Return types** | Explicit return type annotations on handlers |

### 🔒 Security

Catches the mistakes that end up on HackerNews — for all the wrong reasons.

| Check | What it looks for |
|-------|-------------------|
| **Hardcoded secrets** | API keys, tokens, passwords in source files |
| **Gitignore** | `.env` listed in `.gitignore` |
| **Helmet** | HTTP security headers middleware |
| **CORS** | Wildcard `origin: '*'` misconfiguration |
| **Rate limiting** | `@nestjs/throttler` or `express-rate-limit` |
| **Password hashing** | `bcrypt`, `bcryptjs`, or `argon2` installed |

### 📦 Dependencies

Your `node_modules` is a supply chain. Treat it like one.

| Check | What it looks for |
|-------|-------------------|
| **Vulnerabilities** | `npm audit` results (critical, high, moderate) |
| **Lock file** | `package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock` |
| **Deprecated packages** | Known deprecated dependencies |
| **Engine spec** | `engines.node` field in package.json |
| **Essential scripts** | `build` and `start`/`dev` scripts exist |

### 🧪 Testing

No tests = no confidence. codediag tells you how far you are from covered.

| Check | What it looks for |
|-------|-------------------|
| **Test files** | `*.spec.ts`, `*.test.ts`, `*.spec.js`, `*.test.js` |
| **Framework** | Jest, Vitest, Mocha, or Ava detection |
| **Test ratio** | Test files vs source files |
| **E2E tests** | `test/`, `tests/`, `e2e/`, `__tests__/` directories |
| **Config** | `jest.config.*` or `vitest.config.*` present |
| **Coverage** | Coverage threshold configured |

### 🏗️ Structure

Good structure = maintainable code. Bad structure = technical debt bomb.

| Check | What it looks for |
|-------|-------------------|
| **README** | Exists and is meaningful (>100 chars) |
| **Editor config** | `.editorconfig` present |
| **Linter** | ESLint or Biome configured |
| **Formatter** | Prettier configured |
| **Strict mode** | `tsconfig.json` → `strict: true` |
| **Module org** | NestJS: feature folders have module + controller + service |
| **Env example** | `.env.example` exists when `.env` is used |

<br/>

## Scoring

Each analyzer outputs a score from 0 to 100. The total score is a weighted average:

| Analyzer | Weight |
|----------|--------|
| API Health | 25% |
| Security | 30% |
| Dependencies | 20% |
| Testing | 15% |
| Structure | 10% |

Final grade:

| Grade | Score |
|-------|-------|
| **A+** | 95 – 100 |
| **A** | 90 – 94 |
| **B+** | 85 – 89 |
| **B** | 80 – 84 |
| **C** | 70 – 79 |
| **D** | 60 – 69 |
| **F** | < 60 |

<br/>

## CLI Options

```bash
codediag scan .                    # Full terminal report
codediag scan ./backend            # Scan specific directory
codediag scan . --format json      # JSON output (for CI/CD)
codediag scan . --format md        # Markdown output (for README/PR)
codediag scan . --ci               # CI mode: JSON + exit code
codediag scan . --threshold 80     # Fail if score < 80
codediag scan . --quiet            # Score only, no details
codediag scan . --verbose          # Show all checks including passed
codediag init                      # Generate .codediag.yml config
```

<br/>

## CI/CD Integration

### GitHub Actions

```yaml
name: Code Diagnostics
on: [push, pull_request]

jobs:
  codediag:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx codediag scan . --ci --threshold 80
```

### GitLab CI

```yaml
codediag:
  image: node:20
  script:
    - npm ci
    - npx codediag scan . --ci --threshold 80
```

### Pre-commit Hook

```bash
# .husky/pre-push
npx codediag scan . --quiet --threshold 70
```

<br/>

## Configuration

Create a `.codediag.yml` in your project root (or run `codediag init`):

```yaml
# Minimum score to pass (used with --ci flag)
threshold: 70

# Directories to ignore
ignore:
  - node_modules
  - dist
  - .git
  - coverage

# Enable/disable specific analyzers
analyzers:
  api: true
  security: true
  dependencies: true
  testing: true
  structure: true
```

<br/>

## Supported Stacks

| Framework | API Health | Security | Deps | Testing | Structure |
|-----------|:---------:|:--------:|:----:|:-------:|:---------:|
| **NestJS** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Next.js** | 🔜 | ✅ | ✅ | ✅ | ✅ |
| **Express** | 🔜 | ✅ | ✅ | ✅ | ✅ |
| **Generic Node.js** | — | ✅ | ✅ | ✅ | ✅ |

<br/>

## Roadmap

- [x] NestJS API health analyzer
- [x] Security scanner (secrets, headers, auth)
- [x] Dependency auditor
- [x] Test coverage analyzer
- [x] Project structure analyzer
- [ ] Next.js analyzer (pages vs app router, API routes)
- [ ] Express route analyzer
- [ ] SVG badge generator
- [ ] GitHub Action (`codediag/action@v1`)
- [ ] PR comment bot (score diff on PRs)
- [ ] Web dashboard with trend tracking
- [ ] AI-powered fix suggestions
- [ ] Custom rule builder
- [ ] VS Code extension

<br/>

## Comparison

| Feature | codediag | SonarQube | Snyk | ESLint |
|---------|:--------:|:---------:|:----:|:------:|
| One command, zero config | ✅ | ❌ | ❌ | ❌ |
| NestJS-aware (guards, DTOs, Swagger) | ✅ | ❌ | ❌ | ❌ |
| Security scanning | ✅ | ✅ | ✅ | ❌ |
| Dependency audit | ✅ | ❌ | ✅ | ❌ |
| Test coverage check | ✅ | ✅ | ❌ | ❌ |
| Project structure analysis | ✅ | ❌ | ❌ | ❌ |
| Unified health score | ✅ | ✅ | ❌ | ❌ |
| Free & open source | ✅ | Partial | Partial | ✅ |
| No server/account needed | ✅ | ❌ | ❌ | ✅ |
| Works offline | ✅ | ❌ | ❌ | ✅ |

<br/>

## Contributing

Contributions are welcome! Whether it's a bug report, feature request, or pull request — every bit helps.

```bash
# Clone the repo
git clone https://github.com/scuton-technology/codediag.git
cd codediag

# Install dependencies
npm install

# Build
npm run build

# Run locally
node dist/index.js scan /path/to/project

# Watch mode during development
npm run dev
```

Please use [conventional commits](https://www.conventionalcommits.org/) for your commit messages:

```
feat: add next.js analyzer
fix: handle missing tsconfig gracefully
docs: update comparison table
```

<br/>

## License

MIT — Built by [Scuton Technology](https://scuton.com)

<br/>

<p align="center">
  <sub>If codediag saved you from shipping a bug, give it a ⭐</sub>
</p>
