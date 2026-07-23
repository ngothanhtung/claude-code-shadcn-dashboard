---
kind: logging_system
name: No centralized logging system — ad-hoc console statements
category: logging_system
scope:
  - "**"
source_files:
  - src/app/api/admin/users/route.ts
  - src/app/api/admin/users/[uid]/route.ts
  - src/app/(private)/tasks/page.tsx
  - src/app/(private)/customers/page.tsx
  - src/app/(private)/documents/page.tsx
---

This repository does not implement a structured logging system. There is no dedicated logger library (e.g., pino, winston, bunyan), no shared logger module, and no log-level configuration. All diagnostics are produced via bare `console.log`, `console.warn`, and `console.error` calls scattered directly inside feature pages and API route handlers under `src/app/`. The only reference to logging in dependencies is `.gitignore` entries for npm/yarn/pnpm debug logs; no logging package appears in `package.json`. Error messages are unstructured strings with optional bracketed prefixes like `[Admin Users GET API Error]`, but there is no consistent field schema, sink, or transport. Developers should follow the existing pattern of wrapping Firestore/API calls in try/catch blocks and emitting `console.error` with a descriptive prefix, though this is informal and not enforced by lint rules.
