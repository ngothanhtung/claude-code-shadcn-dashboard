---
name: nextjs-firebase-feature
description: Build or update a Next.js App Router dashboard feature module backed by Firebase Firestore. Use for feature folders like src/modules/<feature> that need typed services, mock seed data, TanStack tables, CRUD dialogs/actions, and shadcn/ui components. Supports both client-side Firestore (for simple CRUD) and Admin SDK via API routes (for privileged operations like managing Firebase Auth).
---

# Next.js Firebase Feature

Use this skill when creating or updating a dashboard module that follows the current `src/modules/tasks` structure.

## Project Pattern

- Use Next.js App Router **client pages** under `src/app/(private)/<feature>/page.tsx`. The route group is **`(private)`**, not `(dashboard)` — see `proxy.ts` which protects everything except `/sign-in`, `/sign-up`, `/forgot-password`, and `/landing`.
- Use module code under `src/modules/<feature>/`.
- Use Firebase Web SDK from `@/lib/firebase/client` (exports `app`, `auth`, `db`, `storage`; validates env at module load) as the **default** for Firestore reads/writes.
- Use Firebase Admin SDK from `@/lib/firebase/admin` (exports `getAdminApp`, `getAdminAuth`, `getAdminDb`) **only inside API routes** for privileged operations — never in client components or services. See [Firebase Admin SDK via API Routes](#firebase-admin-sdk-via-api-routes) below.
- Do not use server actions (`"use server"`). The project does not use them.
- Do not auto-seed on page load. Seed mock data only when the user triggers a seed function/button exposed in the toolbar.
- Keep mock seed data **inline** in `<feature>-mock-data.ts`; do not create JSON seed files for Firestore-backed features (`tasks` does this — `users` uses JSON because it has a richer data shape and is also a reference for the API-route pattern).
- Use `zod` schemas for feature item types. Mock data must be parsed through the schema.
- Use `@tanstack/react-table` for tables.
- Use shadcn/ui and lucide-react for UI.

## Choosing the right SDK

| Requirement | SDK | Where |
|---|---|---|
| Simple Firestore CRUD (no Auth manipulation) | Client SDK (`@/lib/firebase/client`) | `<feature>-services.ts` |
| Create/delete Firebase Auth accounts | Admin SDK (`@/lib/firebase/admin`) | `src/app/api/admin/<feature>/route.ts` |
| List users joined from Auth + Firestore | Admin SDK | `src/app/api/admin/<feature>/route.ts` |
| Sensitive operations (disable users, reset passwords, custom claims) | Admin SDK | `src/app/api/admin/<feature>/route.ts` |
| Dev-only seeding (Firestore profile only, no Auth) | Client SDK | `<feature>-services.ts` (seed function) |

**Rule of thumb:** if the operation touches Firebase Auth or requires bypassing Firestore Security Rules, route it through an API route backed by the Admin SDK. Everything else goes through the client SDK.

## Module Shape

The `tasks` module is the **canonical reference** for Firestore-backed features. Its actual tree:

```text
src/app/(private)/<feature>/page.tsx
src/app/api/admin/<feature>/route.ts           # optional — only if you need Admin SDK
src/app/api/admin/<feature>/[uid]/route.ts     # optional — dynamic route for single-item ops
src/modules/<feature>/
  components/
    add-<feature>-modal.tsx
    columns.tsx
    data-table.tsx
    data-table-column-header.tsx
    data-table-faceted-filter.tsx   # exists, but the tasks toolbar uses plain <Select>; keep this file only if you actually wire it up
    data-table-pagination.tsx
    data-table-row-actions.tsx
    data-table-toolbar.tsx
    data-table-view-options.tsx
  services/
    <feature>-mock-data.ts
    <feature>-services.ts
    <feature>-chart-services.ts     # optional placeholder
    <feature>-statistics-services.ts # optional placeholder
    types/
      <feature>-types.ts
```

Notes on the canonical shape:

- **No `hooks/` directory** — keep client logic in the page (`useCallback`, `useEffect`, `useMemo`). Add a `hooks/` folder only when logic is shared across multiple components.
- **No separate `stat-cards.tsx`** — render stat cards **inline in `page.tsx`** using shadcn `Card`. Extract a component only when the same stats block is reused across pages.
- **No `data/*.json`** under `services/` for the canonical Firestore-backed shape. Use inline arrays parsed through the zod schema.
- `<feature>-chart-services.ts` and `<feature>-statistics-services.ts` are optional placeholders; if unused, leave a one-line Vietnamese comment and move on.
- API routes under `src/app/api/admin/` are **optional** — create them only when the feature needs Admin SDK operations (Auth management, bypass Firestore rules). Simple features (like `tasks`) skip this entirely.

## Types

Define the item schema in `services/types/<feature>-types.ts`.

```ts
import { z } from "zod"

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  category: z.string(),
  priority: z.string(),
})

export type Task = z.infer<typeof taskSchema>
```

Keep Firestore document fields aligned with this schema unless the feature explicitly needs more fields and rules allow them.

When the feature has Admin SDK operations, also define **payload schemas** for the API routes:

```ts
export const createUserPayloadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  gender: z.enum(["male", "female", "other"]),
  phone: z.string().optional(),
  status: z.enum(["active", "disabled"]),
})

export type CreateUserPayload = z.infer<typeof createUserPayloadSchema>

export const updateUserPayloadSchema = createUserPayloadSchema.partial()
export type UpdateUserPayload = z.infer<typeof updateUserPayloadSchema>
```

## Mock Data

Put option lists and seed rows in `services/<feature>-mock-data.ts`. **Inline the rows** — no JSON imports for the canonical shape.

```ts
import { CheckCircle2, Circle } from "lucide-react"
import { taskSchema } from "./types/task-types"

export const statuses = [
  { value: "todo", label: "Todo", icon: Circle },
  { value: "completed", label: "Completed", icon: CheckCircle2 },
]

const tasksData = [
  {
    id: "TASK-1001",
    title: "Implement user authentication",
    status: "completed",
    category: "feature",
    priority: "critical",
  },
]

export const taskMockData = taskSchema.array().parse(tasksData)
```

Rules:

- `statuses`, `priorities`, `categories`, etc. live **inline in this file**, not in a separate constants module — they are tightly coupled to the mock rows.
- Always parse with `<schema>.array().parse(...)` so a typo in mock rows fails at module load.
- Do not import seed rows from `services/data/*.json`. If you need a JSON-shaped dataset (like `users`), copy the rows inline instead — Firestore rules + zod schema expect the inline shape.

## Firestore Services (Client SDK)

Use direct client SDK CRUD in `services/<feature>-services.ts`. This is the **default pattern** for simple features.

```ts
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore"

import { db } from "@/lib/firebase/client"
import { taskMockData } from "./task-mock-data"
import type { Task } from "./types/task-types"

const TASKS_COLLECTION = "tasks"

export async function getTasks(): Promise<Task[]> {
  const snapshot = await getDocs(collection(db, TASKS_COLLECTION))

  return snapshot.docs.map((document) => {
    const data = document.data() as Task
    return { ...data, id: data.id ?? document.id }
  })
}

export async function seedTasksWithClient(): Promise<Task[]> {
  const batch = writeBatch(db)

  taskMockData.forEach((task) => {
    batch.set(doc(db, TASKS_COLLECTION, task.id), task, { merge: true })
  })

  await batch.commit()
  return getTasks()
}

export async function createTask(task: Task): Promise<Task> {
  await setDoc(doc(db, TASKS_COLLECTION, task.id), task)
  return task
}

export async function updateTask(task: Task): Promise<Task> {
  await updateDoc(doc(db, TASKS_COLLECTION, task.id), task)
  return task
}

export async function deleteTask(taskId: string): Promise<void> {
  await deleteDoc(doc(db, TASKS_COLLECTION, taskId))
}
```

Rules:

- `get<Features>()` reads Firestore only. It must not fall back to mock data and must not auto-seed. Do **not** use `getFirestoreCollection(name, fallback)` here — that helper exists for one-off reads elsewhere and conflicts with the manual-seed pattern of this skill.
- `seed<Features>WithClient()` writes inline mock data with `writeBatch` (`{ merge: true }` so re-seeding is idempotent) and returns a fresh Firestore read.
- `create`, `update`, and `delete` write to Firestore before updating UI state.
- Pure compute helpers (e.g. `getTaskStats(tasks)`) live in the same services file alongside Firestore CRUD.
- Avoid `serverTimestamp()` unless the schema and Firestore rules explicitly allow timestamp fields.
- Do not use `onSnapshot` unless the user explicitly asks for realtime behavior.

## Firebase Admin SDK via API Routes

When a feature needs **privileged operations** (Firebase Auth management, bypassing Firestore Security Rules), create API routes under `src/app/api/admin/<feature>/`. The Admin SDK is used **only here** — never imported in client components or module services.

### API Route Structure

```text
src/app/api/admin/<feature>/
  route.ts          # GET (list), POST (create) + OPTIONS
  [uid]/route.ts    # PATCH (update), DELETE (remove) + OPTIONS
```

### API Route Pattern

Every API route must follow these conventions:

```ts
// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin"
import { createUserPayloadSchema } from "@/modules/users/services/types/user-types"

// --- CORS: declare once, reuse in every response ---
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

// --- Preflight handler (required for CORS) ---
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

// --- GET: list items ---
export async function GET() {
  try {
    const auth = getAdminAuth()
    const db = getAdminDb()
    // ... privileged logic here ...
    return NextResponse.json(
      { success: true, data: { items } },
      { status: 200, headers: CORS_HEADERS }
    )
  } catch (error) {
    console.error("[Admin <Feature> GET API Error]", error)
    return NextResponse.json(
      { success: false, message: "Lỗi khi tải dữ liệu" },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}

// --- POST: create item ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createUserPayloadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    const auth = getAdminAuth()
    const db = getAdminDb()
    // ... create logic ...

    return NextResponse.json(
      { success: true, message: "Tạo thành công", data: { id: newId } },
      { status: 201, headers: CORS_HEADERS }
    )
  } catch (error) {
    console.error("[Admin <Feature> POST API Error]", error)
    return NextResponse.json(
      { success: false, message: "Đã xảy ra lỗi" },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
```

### Response contract

All API routes must follow this shape:

```ts
{
  success: boolean        // true | false
  message?: string        // Vietnamese error/status message
  data?: T                // optional payload
  errors?: Record<string, string[]>  // field-level errors from zod
}
```

Status codes: `200` read/update, `201` create, `204` OPTIONS preflight, `400` invalid input, `409` conflict (e.g. duplicate email), `500` server error.

### CORS headers

Declare `CORS_HEADERS` once per file and pass it as the `headers` option on every `NextResponse.json()` call. The `OPTIONS` handler returns `204` with no body.

### Admin SDK usage inside routes

```ts
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin"

// Inside your handler:
const auth = getAdminAuth()   // firebase-admin/auth — for Auth operations
const db = getAdminDb()       // firebase-admin/firestore — for privileged DB ops
```

The Admin SDK singleton (`@/lib/firebase/admin`) supports three auth modes, tried in order:

1. Split env vars: `FIREBASE_ADMIN_PROJECT_ID` + `FIREBASE_ADMIN_CLIENT_EMAIL` + `FIREBASE_ADMIN_PRIVATE_KEY`
2. JSON blob: `FIREBASE_SERVICE_ACCOUNT_KEY`
3. Application Default Credentials (GCP/Cloud Run)

### Auth bypass note

API routes bypass `proxy.ts` auth protection (all `/api/*` routes get `NextResponse.next()`). Your API route is responsible for its own auth verification if needed — e.g. check NextAuth session via `auth()` from `@/auth`, or rely on Firestore Security Rules for the underlying operations.

### Client service → API route pattern

When a feature uses Admin SDK via API routes, the client service wraps calls in `fetch()`:

```ts
// src/modules/users/services/user-services.ts
import type { User, CreateUserPayload, UpdateUserPayload } from "./types/user-types"
import { userMockData } from "./user-mock-data"

interface ApiResult<T = unknown> {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string[]>
}

// Reads go through the API (Auth is source of truth)
export async function getUsers(): Promise<User[]> {
  try {
    const res = await fetch("/api/admin/users", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    })

    if (!res.ok) {
      return userMockData
    }

    const json = (await res.json()) as {
      success: boolean
      data?: { users: User[] }
    }

    if (!json.success || !json.data) return userMockData
    return json.data.users
  } catch {
    return userMockData
  }
}

// Mutations go through the API (Admin SDK creates/deletes Auth accounts)
export async function createUserViaApi(
  payload: CreateUserPayload
): Promise<ApiResult<{ uid: string }>> {
  try {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    return (await res.json()) as ApiResult<{ uid: string }>
  } catch {
    return { success: false, message: "Không thể kết nối đến máy chủ" }
  }
}
```

The client service **never imports** `@/lib/firebase/admin`. It communicates with the Admin SDK exclusively through `fetch()` to `/api/admin/...`.

## Page Composition

Use the page as the orchestration layer. The actual `src/app/(private)/tasks/page.tsx` is a `"use client"` component:

- load items with `get<Features>()` in `useEffect`;
- pass CRUD callbacks into columns/table via a column factory;
- refresh from Firestore after create when correctness matters;
- update local state after update/delete for responsive UI;
- optionally duplicate rows by generating `ID-${Date.now()}`;
- expose a manual seed callback for the toolbar button;
- render stat cards **inline** using shadcn `Card`;
- show a loading state (`loading === true`) and a mobile placeholder, then the desktop layout.

```ts
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { getTaskColumns } from "@/modules/tasks/components/columns"
import { DataTable } from "@/modules/tasks/components/data-table"
import {
  createTask,
  deleteTask,
  getTasks,
  seedTasksWithClient,
  updateTask,
} from "@/modules/tasks/services/task-services"
import type { Task } from "@/modules/tasks/services/types/task-types"

export default function TaskPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [isSeedingTasks, setIsSeedingTasks] = useState(false)

  const refreshTasks = useCallback(async () => {
    setTasks(await getTasks())
  }, [])

  useEffect(() => {
    const loadTasks = async () => {
      try {
        await refreshTasks()
      } catch (error) {
        console.error("Failed to load tasks:", error)
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [refreshTasks])

  const handleAddTask = useCallback(
    async (task: Task) => {
      await createTask(task)
      await refreshTasks()
    },
    [refreshTasks]
  )

  const handleUpdateTask = useCallback(async (task: Task) => {
    await updateTask(task)
    setTasks((prev) => prev.map((item) => (item.id === task.id ? task : item)))
  }, [])

  const handleDeleteTask = useCallback(async (taskId: string) => {
    await deleteTask(taskId)
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
  }, [])

  const handleDuplicateTask = useCallback(async (task: Task) => {
    const duplicate: Task = {
      ...task,
      id: `TASK-${Date.now()}`,
      title: `${task.title} (Copy)`,
    }
    await createTask(duplicate)
    setTasks((prev) => [duplicate, ...prev])
  }, [])

  const handleSeedTasks = useCallback(async () => {
    setIsSeedingTasks(true)
    try {
      setTasks(await seedTasksWithClient())
    } catch (error) {
      console.error("Failed to seed tasks:", error)
    } finally {
      setIsSeedingTasks(false)
    }
  }, [])

  const columns = useMemo(
    () =>
      getTaskColumns({
        onUpdateTask: handleUpdateTask,
        onDeleteTask: handleDeleteTask,
        onDuplicateTask: handleDuplicateTask,
      }),
    [handleDeleteTask, handleDuplicateTask, handleUpdateTask]
  )

  if (loading) return <div>Loading tasks...</div>

  return <DataTable data={tasks} columns={columns} onAddTask={handleAddTask} onSeedTasks={handleSeedTasks} isSeedingTasks={isSeedingTasks} />
}
```

## Columns and Row Actions

Use a column factory so callbacks are injected at the page level. Both shapes must be exported (`getTaskColumns(...)` and a default `columns = getTaskColumns()` for backwards compat):

```ts
export function getTaskColumns({
  onUpdateTask,
  onDeleteTask,
  onDuplicateTask,
}: TaskColumnActions = {}): ColumnDef<Task>[] {
  return [
    // field columns...
    {
      id: "actions",
      cell: ({ row }) => (
        <DataTableRowActions
          row={row}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onDuplicateTask={onDuplicateTask}
        />
      ),
    },
  ]
}

export const columns = getTaskColumns()
```

Row-action responsibilities:

- Parse `row.original` with the feature schema before using it.
- Edit dialogs: open a shadcn `Dialog` inline in the dropdown with form fields and Save/Cancel. Call `onUpdate...` on save.
- Delete actions: confirm, then call `onDelete...`.
- Duplicate actions: generate a new ID (`<PREFIX>-${Date.now()}`), append `(Copy)` to the title, call `onAdd...` through the page callback.

## Add Modal

Add modal responsibilities:

- maintain controlled form state (no `react-hook-form` needed unless the form is complex — `tasks` uses `useState` only; `users` uses `react-hook-form` + zod);
- validate with `zod`;
- generate a stable unique string ID, for example `TASK-${Date.now()}`;
- await `onAdd...`;
- show root errors returned by Firestore;
- reset state and close only after success;
- set trigger buttons to `type="button"`.

The modal should not import Firestore services directly. Keep writes in the page callback so state refresh stays centralized.

## Toolbar

Toolbar should include:

- search input bound to a table column filter;
- select filters for enum fields (the canonical `tasks` toolbar uses plain shadcn `Select` for status / category / priority — only swap in `data-table-faceted-filter.tsx` if you actually need multi-select);
- reset filters button;
- column visibility button;
- add modal trigger;
- optional seed button wired to `onSeed...`.

```tsx
<Button
  variant="outline"
  size="sm"
  onClick={onSeedTasks}
  disabled={!onSeedTasks || isSeedingTasks}
>
  <Database className="h-4 w-4" />
  <span className="hidden lg:block">
    {isSeedingTasks ? "Seeding..." : "Seed Data"}
  </span>
</Button>
```

## Validation

After changes, run from the project root:

```bash
npx tsc --noEmit
npm run build
```

There is no test framework configured — these two commands are the project's verification gate. ESLint is available via `npm run lint`.

If a Firestore write fails in the UI:

- inspect the modal or row action root error;
- verify Firestore Security Rules allow the authenticated user to create/update/delete the collection;
- verify document fields match the zod schema and rules;
- avoid adding timestamp or metadata fields unless rules allow them.

If an Admin SDK API route fails:

- inspect the server console for the `[Admin <Feature> ... API Error]` log;
- verify `FIREBASE_ADMIN_*` env vars are set (split form or JSON blob);
- verify the calling service hits the correct endpoint and method;
- check if zod validation rejected the payload (look for `errors` in the response).

## Do Not

- Do not import `@/lib/firebase/admin` in client components, page files, or module services — Admin SDK lives **only** in `src/app/api/admin/` route files.
- Do not use `"use server"` (server actions) — the project does not use them.
- Do not create `mock-data-seeder.ts`.
- Do not create a global `/mock-data` route for seeding modules.
- Do not auto-seed in `get<Features>()`.
- Do not place seed rows in JSON files for Firestore-backed features.
- Do not make CRUD local-only if the feature is Firestore-backed.
- Do not hardcode Firebase config; always use `@/lib/firebase/client` or `@/lib/firebase/admin`.
- Do not write a feature page under `src/app/(dashboard)/...` — the route group is `(private)`.
- Do not call `onSnapshot` unless the user explicitly asked for realtime.
- Do not skip `CORS_HEADERS` or the `OPTIONS` handler in API routes — every API route file must include both.
