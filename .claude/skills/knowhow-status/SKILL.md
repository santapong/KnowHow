---
name: knowhow-status
description: Run KnowHow's pre-UAT checks (lint, typecheck, build, dev-server route smoke test) and report current state in a single status table. Use when the user asks if the project is ready, ready to merge, ready to deploy, ready to test; or after a chunk of changes to verify nothing regressed.
allowed-tools: Bash, Read
---

# KnowHow status check

You are about to verify whether KnowHow is in a shippable state. Don't ask the user — just run the checks and report.

## Checks to run

Run all four in parallel where possible, then summarise.

### 1. Static analysis (parallel)

```bash
npm run lint
npm run typecheck
```

Both must exit 0 with no warnings.

### 2. Production build

```bash
npm run build
```

Must succeed. Capture the routes table from the output — it should list 10 routes (`/`, `/community`, `/login`, `/settings`, `/shelf`, `/shelf/[id]`, `/upload`, `/_not-found`, `/auth/callback`, `/auth/sign-out`).

### 3. Dev server smoke test

Start the dev server in the background, wait 6 seconds, hit the protected and public routes, then kill it.

```bash
npm run dev > /tmp/knowhow-dev.log 2>&1 &
DEV_PID=$!
sleep 6
for path in "/" "/login" "/community" "/shelf" "/upload" "/settings" "/auth/callback?next=https://evil.com"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-redirs 0 "http://localhost:3000$path")
  loc=$(curl -sI --max-redirs 0 "http://localhost:3000$path" 2>/dev/null | grep -i ^location | tr -d '\r' | head -1)
  echo "$path -> $code ${loc}"
done
kill $DEV_PID 2>/dev/null; wait 2>/dev/null; true
```

Expected:
- `/`, `/login`, `/community` → 200
- `/shelf`, `/upload`, `/settings` → 307 redirect to `/login`
- `/auth/callback?next=https://evil.com` → 302/307 to `/login` or `/shelf` (must NOT include `evil.com` in the location header — that's the open-redirect defense)

### 4. Repository state

```bash
git status --short
git log --oneline -5
```

Working tree should be clean (or only contain expected unstaged work). Most recent commit should be on `claude/pdf-book-upload-animation-a4T5r`.

## Output format

Print a compact status table, then a one-line verdict.

```
| Check                         | Status | Note                          |
|-------------------------------|--------|-------------------------------|
| npm run lint                  | ✅     |                               |
| npm run typecheck             | ✅     |                               |
| npm run build                 | ✅     | 10 routes                     |
| Public routes                 | ✅     | 200 as expected               |
| Protected routes              | ✅     | 307 → /login                  |
| Open-redirect defense         | ✅     | next=https://evil.com scrubbed |
| Working tree                  | ✅     | clean                         |
```

**Verdict:** `Ready for UAT` / `Needs fixes: [list]`

## If a check fails

Stop, print the failing output, and propose a fix on the current branch. Do **not** push to `main` — the project rule (see CLAUDE.md) is to keep all work on `claude/pdf-book-upload-animation-a4T5r`.
