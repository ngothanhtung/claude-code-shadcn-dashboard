---
kind: error_handling
name: Next.js App Router Error Pages and API Error Conventions
category: error_handling
scope:
  - "**"
source_files:
  - src/app/(auth)/errors/not-found/page.tsx
  - src/app/(auth)/errors/unauthorized/page.tsx
  - src/app/(auth)/errors/forbidden/page.tsx
  - src/app/(auth)/errors/internal-server-error/page.tsx
  - src/app/(auth)/errors/under-maintenance/page.tsx
  - src/app/not-found.tsx
  - src/lib/auth/admin-api.ts
  - src/app/api/admin/users/route.ts
  - src/app/api/admin/users/[uid]/route.ts
  - src/lib/firebase/auth.ts
  - src/auth.ts
---

This Next.js monorepo uses a hybrid error-handling strategy that combines Next.js App Router conventions with per-route try/catch blocks and a small shared admin-auth guard. There is no centralized error class hierarchy or global middleware; errors are handled at three layers.

1. Route-level user-facing error pages

- Dedicated static routes under `src/app/(auth)/errors/<code>/` render polished client components for common HTTP states: 404 (`not-found-error.tsx`), 401 (`unauthorized-error.tsx`), 403 (`forbidden-error.tsx`), 500 (`internal-server-error.tsx`), and 503 (`under-maintenance-error.tsx`). Each route page is a thin wrapper around its component, which displays a large status heading, localized message, and navigation buttons.
- A top-level `src/app/not-found.tsx` provides the default app-wide 404 fallback used when no matching route exists outside the `(auth)` group.

2. Server API responses (Route Handlers)

- All admin endpoints live under `src/app/api/admin/users/...` and follow a consistent shape:
  - Every handler starts by calling `getAdminApiErrorResponse(CORS_HEADERS)` from `@/lib/auth/admin-api`. If the caller is unauthenticated it returns `{ success: false, message: "Bạn cần đăng nhập để tiếp tục" }` with status 401; if authenticated but not an admin it returns 403 with `{ success: false, message: "Bạn không có quyền quản trị" }`.
  - Business logic is wrapped in try/catch. Validation failures (via Zod `.safeParse`) return 400 with a `fieldErrors` map. Known Firebase Auth codes (e.g. `auth/email-already-exists`) are mapped to 409 with Vietnamese messages. Unhandled exceptions fall through to a catch block that logs via `console.error` and returns 500 with `{ success: false, message: ... }`.
  - Successful responses use `{ success: true, data: ..., message?: string }` with appropriate 2xx status codes.
- The same pattern repeats across other API routes (`customers/route.ts`, `tasks/route.ts`, etc.), so every endpoint returns a uniform JSON envelope rather than throwing raw errors to the framework.

3. Client-side Firebase auth errors

- `src/lib/firebase/auth.ts` exposes `getFirebaseAuthErrorMessage(error, mode)` which inspects `FirebaseError.code` and maps dozens of codes (`auth/invalid-credential`, `auth/user-not-found`, `auth/weak-password`, `auth/too-many-requests`, `auth/network-request-failed`, `auth/popup-closed-by-user`, …) into Vietnamese user-facing strings. Callers should pass this helper instead of displaying raw Firebase codes.
- Several functions defensively throw plain `new Error("auth/no-current-user")` when `auth.currentUser` is missing; callers are expected to catch these before invoking profile mutation methods.

4. Configuration / bootstrapping errors

- `src/auth.ts` throws `new Error(...)` during server startup if required environment variables (e.g. `NEXT_PUBLIC_FIREBASE_API_KEY`) are absent, failing fast before any request is served.
- Custom React hooks (`useTheme`, `useSidebarConfig`) throw descriptive errors when invoked outside their providers, surfacing developer misuse early.

Conventions developers should follow

- For new UI error pages, add a folder under `src/app/(auth)/errors/<status>/` with a `page.tsx` + `components/<name>-error.tsx` following the existing layout (image, big status number, localized text, "Go Back Home" button).
- In Route Handlers, always call `getAdminApiErrorResponse(headers)` first, wrap body logic in try/catch, validate inputs with Zod `.safeParse` returning 400 with `fieldErrors`, map known external SDK error codes to specific 4xx responses, and return a `{ success, message, data? }` envelope on both success and failure paths.
- On the client, surface Firebase errors through `getFirebaseAuthErrorMessage` rather than leaking raw codes; never assume `auth.currentUser` is present — check or catch `auth/no-current-user` before mutating profile data.
