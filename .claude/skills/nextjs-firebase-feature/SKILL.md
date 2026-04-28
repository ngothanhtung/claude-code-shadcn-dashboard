---
name: nextjs-firebase-feature
description: Tạo tính năng Feature trong Next.js với Firebase Firestore
---

## Ngữ cảnh dự án

Dự án sử dụng:

- **TypeScript** với path alias `@/` map tới thư mục root (cấu hình trong `tsconfig.json`)
- **Next.js App Router** (app/ directory)
- **Firebase Firestore** làm backend serverless
- **Functional components + hooks** — không dùng React class components
- **shadcn/ui** component library + **lucide-react** icons
- **Tailwind CSS** cho styling

## Tham số đầu vào (Params)

Khi sử dụng skill này, người dùng cần cung cấp các tham số sau (nếu không cung cấp, Claude sẽ hỏi lại hoặc sử dụng mặc định):

1. Tên tính năng: cho phép tạo tính năng mới với tên tùy chọn (ví dụ: `customer`, `product`, `order`). Tên này sẽ được dùng để tạo cấu trúc thư mục (dùng số nhiều, lowercase, kebab-case) và các files, components tương ứng.

2. Liệt kế các trường (fields) cần thiết cho tính năng: tên, email, số điện thoại, địa chỉ, mô tả. Các field này sẽ được dùng để tạo form input trong component `CRUD` cũng như hiển thị trong `table`. Người dùng có thể thêm bớt fields tùy ý — Claude sẽ tự động điều chỉnh code template cho phù hợp.

3. Liệt kê các trường bắt buộc (required fields): ví dụ: tên là bắt buộc, email/số điện thoại/địa chỉ là tùy chọn. Claude sẽ thêm validation cho các field bắt buộc trong form và hiển thị thông báo lỗi nếu người dùng cố gắng submit mà không điền.

4. Liệt kê các trường có thể được search/sort: ví dụ: tên, email, số điện thoại, địa chỉ. Claude sẽ thêm logic search trên các field này trong component `list` và thêm sorting theo email (asc/desc) trong `table`.

## Quy ước chung:

1. Cấu trúc thư mục: được tổ chức theo tính năng (feature-based structure) để dễ dàng mở rộng và bảo trì. Mỗi tính năng sẽ có thư mục riêng trong `app/` cho trang chính và `modules/` cho logic nghiệp vụ, services, components liên quan.

2. Service layer: tất cả logic tương tác với Firebase Firestore sẽ được đóng gói trong service layer (`<feature>-service.ts`). Điều này giúp tách biệt rõ ràng giữa UI và data access, dễ dàng bảo trì và mở rộng (ví dụ: thêm pagination, search, sort).

3. Dùng các component chung của shadcn/ui cho UI consistency, và lucide-react cho icons. Các component này sẽ được sử dụng trong các component của tính năng (list, table, form) để đảm bảo giao diện đồng nhất.

4. Dùng Modals/Dialog để tạo mới và chỉnh sửa item, với form inputs tương ứng. Các form này sẽ có validation cho các field bắt buộc và hiển thị thông báo lỗi rõ ràng.

5. Dùng react-form-hooks và zod để quản lý state của form inputs trong các component AddNew và Edit. Khi submit, gọi service tương ứng để tạo mới hoặc cập nhật item, sau đó trigger refetch hoặc cập nhật local state để hiển thị thay đổi ngay lập tức.

6. Hạn chế dùng real-time listeners của Firestore (`onSnapshot`) để tránh phức tạp và performance issues. Thay vào đó, dùng polling hoặc trigger refetch sau khi tạo/cập nhật/xóa để cập nhật UI.

### Cấu trúc mỗi tính năng

```text
app/<feature>/page.tsx              ← Trang chính (Server hoặc Client Component)
modules/<feature>/                  ← Logic nghiệp vụ
  services/
    <feature>-service.ts            ← Firebase Firestore operations
  components/
    <feature>-list.tsx             ← Danh sách (Card wrapper + search + sort + polling)
    <feature>-list-table.tsx        ← Table hiển thị items với hành động
    <feature>-list-skeleton.tsx     ← Loading skeleton
    <feature>-list-empty.tsx        ← Empty state
    <feature>-add-new.tsx           ← Dialog tạo mới
    <feature>-edit.tsx              ← Dialog chỉnh sửa
    <feature>-delete-confirm.tsx    ← AlertDialog xác nhận xóa
  <feature>-types.ts               ← TypeScript interfaces (tùy chọn, có thể inline trong service)
```

## Firebase Firestore

### Cấu hình Firebase

```typescript
// lib/firebase/client.ts
import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app"
import { Auth, getAuth } from "firebase/auth"
import { Firestore, getFirestore } from "firebase/firestore"
import { FirebaseStorage, getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

function validateFirebaseEnv(): void {
  const requiredEntries: Array<[string, string | undefined]> = [
    ["NEXT_PUBLIC_FIREBASE_API_KEY", firebaseConfig.apiKey],
    ["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", firebaseConfig.authDomain],
    ["NEXT_PUBLIC_FIREBASE_PROJECT_ID", firebaseConfig.projectId],
    ["NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", firebaseConfig.storageBucket],
    [
      "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
      firebaseConfig.messagingSenderId,
    ],
    ["NEXT_PUBLIC_FIREBASE_APP_ID", firebaseConfig.appId],
  ]

  const missing = requiredEntries
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase environment variables: ${missing.join(", ")}`
    )
  }
}

validateFirebaseEnv()

export const app: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig)

export const auth: Auth = getAuth(app)
export const db: Firestore = getFirestore(app)
export const storage: FirebaseStorage = getStorage(app)
```

```typescript
// lib/firebase/admin.ts
import "server-only"

import {
  App,
  AppOptions,
  cert,
  getApp,
  getApps,
  initializeApp,
} from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"
import { getStorage } from "firebase-admin/storage"

let cachedApp: App | null = null

function getAdminAppOptions(): AppOptions {
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  )

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin environment variables. Required: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY"
    )
  }

  return {
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    projectId,
  }
}

export function getAdminApp(): App {
  if (cachedApp) {
    return cachedApp
  }

  cachedApp =
    getApps().length > 0 ? getApp() : initializeApp(getAdminAppOptions())

  return cachedApp
}

export const adminAuth = () => getAuth(getAdminApp())
export const adminDb = () => getFirestore(getAdminApp())
export const adminStorage = () => getStorage(getAdminApp())
```

### Quy ước Firestore

- **Collection naming**: số nhiều, snake_case (ví dụ: `tasks`, `users`, `customers`)
- **Document ID**: tự động tạo bằng `addDoc`
- **Timestamps**: dùng `serverTimestamp()` khi tạo mới (`createdAt`) và khi cập nhật (`updatedAt`)
- **Pagination**: dùng cursor-based approach với `startAfter()` + document snapshot hoặc field-based với `startAfter(value)`
- **Client-side search + sort**: search trên nhiều fields (`name`/`fullName`, `email`, `phone`/`phoneNumber`, `address`) + sort theo `email` (asc/desc) xử lý trong `*-list.tsx` bằng `useMemo`
- **Error handling**: service layer luôn wrap logic trong try/catch, throw typed error hoặc log rõ ràng
- **Storage**: export `storage` đã có sẵn trong client config — mở rộng thêm method upload khi feature cần file uploads
- **No real-time**: KHÔNG dùng `onSnapshot` — dùng polling: `useEffect` gọi `refetch()` trên mount, `cancelledRef` để tránh state update khi unmounted
- **Callback pattern**: thay vì parent re-fetch, dùng `onCreated`, `onDeleted`, `onMutate` callbacks để cập nhật local state

### Quy ước code

- Tên feature viết SNAKE_CASE trong code (ví dụ: `<feature>` → `customer`, `product`, `order`)
- Tên component viết PascalCase (ví dụ: `<Feature>Edit` → `CustomerEdit`)
- Tên service function viết camelCase với tiền tố feature (ví dụ: `getCustomers`, `createCustomer`)
- Labels trong UI dùng placeholder như `Tên`, `Email`, `Mô tả` — KHÔNG hardcode tên feature cụ thể
- Form fields sử dụng generic pattern — khi feature có fields khác, mở rộng thêm chứ không viết lại toàn bộ
- Luôn import Firebase từ `lib/firebase/client.ts` hoặc `lib/firebase/admin.ts` — KHÔNG hardcode config

## Service Layer Template

Template cho service layer. Mở rộng thêm methods (`get paginated`, `upload file`) khi feature cần.

```typescript
// modules/<feature>/services/<feature>-service.ts
'use client';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentReference,
  getDocs,
  limit,
  query,
  startAfter,
  updateDoc,
  WhereFilterOp,
  orderBy as firestoreOrderBy,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/client';

// ============================================================================
// Types (inline)
// ============================================================================

export type <Feature>Item = {
  id: string;
  // Các field cơ bản — thêm field tùy feature
  name: string;                        // hoặc fullName, title tùy feature
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
  createdAt?: ReturnType<typeof serverTimestamp>;
  updatedAt?: ReturnType<typeof serverTimestamp>;
};

export type Create<Feature>Input = {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
};

export type Update<Feature>Input = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
};

// ============================================================================
// CRUD Operations
// ============================================================================

const COLLECTION = '<features>'; // số nhiều, snake_case

export async function get<Features>(
  constraints?: { orderBy?: string; orderDirection?: 'asc' | 'desc'; limitCount?: number }
): Promise<<Feature>Item[]> {
  try {
    let q = query(collection(db, COLLECTION));

    if (constraints?.orderBy) {
      q = query(q, firestoreOrderBy(constraints.orderBy, constraints.orderDirection ?? 'asc'));
    }
    if (constraints?.limitCount) {
      q = query(q, limit(constraints.limitCount));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name?.trim() || 'Không có tên',
        email: data.email?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        address: data.address?.trim() || undefined,
        description: data.description?.trim() || undefined,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } satisfies <Feature>Item;
    });
  } catch (error) {
    console.error(`[${'<Feature>'}Service] get${'<Features>'} error:`, error);
    throw new Error('Không thể tải danh sách. Vui lòng thử lại.');
  }
}

export async function create<Feature>(input: Create<Feature>Input): Promise<<Feature>Item> {
  try {
    const ref = collection(db, COLLECTION);
    const docRef = await addDoc(ref, {
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      address: input.address ?? null,
      description: input.description ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      name: input.name,
      email: input.email,
      phone: input.phone,
      address: input.address,
      description: input.description,
    };
  } catch (error) {
    console.error(`[${'<Feature>'}Service] create${'<Feature>'} error:`, error);
    throw new Error('Không thể tạo. Vui lòng thử lại.');
  }
}

export async function update<Feature>(input: Update<Feature>Input): Promise<<Feature>Item> {
  try {
    const docRef = doc(db, COLLECTION, input.id);
    const data: Record<string, unknown> = { updatedAt: serverTimestamp() };

    if (input.name !== undefined) data.name = input.name;
    if (input.email !== undefined) data.email = input.email ?? null;
    if (input.phone !== undefined) data.phone = input.phone ?? null;
    if (input.address !== undefined) data.address = input.address ?? null;
    if (input.description !== undefined) data.description = input.description ?? null;

    await updateDoc(docRef, data);

    // Trả về item với các giá trị đã update
    return {
      id: input.id,
      name: input.name ?? '',
      email: input.email,
      phone: input.phone,
      address: input.address,
      description: input.description,
    };
  } catch (error) {
    console.error(`[${'<Feature>'}Service] update${'<Feature>'} error:`, error);
    throw new Error('Không thể cập nhật. Vui lòng thử lại.');
  }
}

export async function delete<Feature>(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`[${'<Feature>'}Service] delete${'<Feature>'} error:`, error);
    throw new Error('Không thể xóa. Vui lòng thử lại.');
  }
}

// ============================================================================
// Pagination (tuỳ chọn — bổ sung khi feature cần)
// ============================================================================

export async function get<Features>Paginated(
  pageSize: number,
  cursor?: DocumentReference
): Promise<{ items: <Feature>Item[]; nextCursor?: DocumentReference }> {
  try {
    let q = query(collection(db, COLLECTION), limit(pageSize));
    if (cursor) {
      q = query(q, startAfter(cursor));
    }

    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name?.trim() || 'Không có tên',
        email: data.email?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        address: data.address?.trim() || undefined,
        description: data.description?.trim() || undefined,
      } satisfies <Feature>Item;
    });

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    return {
      items,
      nextCursor: snapshot.docs.length === pageSize ? lastDoc : undefined,
    };
  } catch (error) {
    console.error(`[${'<Feature>'}Service] get${'<Features>Paginated'} error:`, error);
    throw new Error('Không thể tải trang. Vui lòng thử lại.');
  }
}
```

## Component Templates

### List Component (`<feature>-list.tsx`)

Search trên các fields: `name`, `email`, `phone`, `address`. Sort theo `email` (asc/desc).

```typescript
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { <Feature>AddNew } from '@/modules/<feature>/components/<feature>-add-new';
import { <Feature>ListEmpty } from '@/modules/<feature>/components/<feature>-list-empty';
import { <Feature>ListSkeleton } from '@/modules/<feature>/components/<feature>-list-skeleton';
import { <Feature>ListTable } from '@/modules/<feature>/components/<feature>-list-table';
import { get<Features>, type <Feature>Item } from '@/modules/<feature>/services/<feature>-service';
import { SearchIcon, XIcon } from 'lucide-react';

type LoadingState = 'idle' | 'loading' | 'success' | 'error';
type SortOrder = 'asc' | 'desc';

export function <Feature>List() {
  const [items, setItems] = useState<<Feature>Item[]>([]);
  const [state, setState] = useState<LoadingState>('idle');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [search, setSearch] = useState('');
  const cancelledRef = useRef(false);

  function refetch() {
    cancelledRef.current = false;

    async function load() {
      setState('loading');
      try {
        const data = await get<Features>();
        if (cancelledRef.current) return;
        setItems(data);
        setState('success');
      } catch {
        if (cancelledRef.current) return;
        setState('error');
      }
    }

    load();
  }

  useEffect(() => {
    refetch();
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim();

    return items
      .filter((item) => {
        if (!q) return true;
        return (
          item.name.toLowerCase().includes(q) ||
          (item.email?.toLowerCase().includes(q) ?? false) ||
          (item.phone?.toLowerCase().includes(q) ?? false) ||
          (item.address?.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => {
        const emailA = (a.email ?? '').toLowerCase();
        const emailB = (b.email ?? '').toLowerCase();
        if (emailA < emailB) return sortOrder === 'asc' ? -1 : 1;
        if (emailA > emailB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [items, sortOrder, search]);

  const isLoading = state === 'loading' || state === 'idle';
  const hasItems = filteredItems.length > 0;

  return (
    <Card>
      <CardHeader className='gap-4 pb-4'>
        <div className='flex flex-row items-center justify-between gap-2'>
          <div>
            <CardTitle>Danh sách</CardTitle>
            <CardDescription>Mô tả danh sách.</CardDescription>
          </div>
          <<Feature>AddNew onCreated={(item) => setItems((prev) => [item, ...prev])} />
        </div>

        <div className='relative w-full max-w-sm'>
          <SearchIcon className='absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Tìm kiếm: tên, email, số điện thoại, địa chỉ...'
            value={search}
            onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
            className='pl-8 pr-8'
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className='absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
            >
              <XIcon className='h-3.5 w-3.5' />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <<Feature>ListSkeleton />}

        {state === 'error' && (
          <Alert variant='destructive'>
            <AlertTitle>Không thể tải dữ liệu</AlertTitle>
            <AlertDescription>Vui lòng kiểm tra Firebase config và quyền đọc collection.</AlertDescription>
          </Alert>
        )}

        {state === 'success' && !hasItems && <<Feature>ListEmpty />}
        {state === 'success' && hasItems && (
          <<Feature>ListTable
            items={filteredItems}
            onDeleted={(id) => setItems((prev) => prev.filter((item) => item.id !== id))}
            onMutate={refetch}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
          />
        )}
      </CardContent>
    </Card>
  );
}
```

### Table Component (`<feature>-list-table.tsx`)

Dùng generic labels: `Tên`, `Email`, `Số điện thoại`, `Địa chỉ`. Hiển thị icon cho các field tùy chọn. Khi feature có field khác (như `status`, `category`), thêm column với icon phù hợp.

```typescript
'use client';

import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, MapPinIcon, PhoneIcon } from 'lucide-react';

import { <Feature>DeleteConfirm } from '@/modules/<feature>/components/<feature>-delete-confirm';
import { <Feature>Edit } from '@/modules/<feature>/components/<feature>-edit';
import type { <Feature>Item } from '@/modules/<feature>/services/<feature>-service';

type SortOrder = 'asc' | 'desc';

type <Feature>ListTableProps = {
  items: <Feature>Item[];
  onDeleted: (id: string) => void;
  onMutate: () => void;
  sortOrder: SortOrder;
  onSortChange: (order: SortOrder) => void;
};

export function <Feature>ListTable({ items, onDeleted, onMutate, sortOrder, onSortChange }: <Feature>ListTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tên</TableHead>
          <TableHead>
            <button
              onClick={() => onSortChange(sortOrder === 'asc' ? 'desc' : 'asc')}
              className='flex items-center gap-1 hover:text-foreground'
            >
              Email
              {sortOrder === 'asc' ? (
                <ArrowUpIcon className='h-3.5 w-3.5' />
              ) : sortOrder === 'desc' ? (
                <ArrowDownIcon className='h-3.5 w-3.5' />
              ) : (
                <ArrowUpDownIcon className='h-3.5 w-3.5' />
              )}
            </button>
          </TableHead>
          <TableHead>Số điện thoại</TableHead>
          <TableHead>Địa chỉ</TableHead>
          <TableHead>Hành động</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className='font-medium'>{item.name}</TableCell>
            <TableCell>{item.email ?? '-'}</TableCell>
            <TableCell>
              {item.phone ? (
                <span className='flex items-center gap-1'>
                  <PhoneIcon className='h-3.5 w-3.5 text-muted-foreground' />
                  {item.phone}
                </span>
              ) : (
                '-'
              )}
            </TableCell>
            <TableCell>
              {item.address ? (
                <span className='flex items-center gap-1'>
                  <MapPinIcon className='h-3.5 w-3.5 text-muted-foreground' />
                  {item.address}
                </span>
              ) : (
                '-'
              )}
            </TableCell>
            <TableCell>
              <div className='flex items-center gap-1'>
                <<Feature>Edit item={item} onMutate={onMutate} />
                <<Feature>DeleteConfirm
                  id={item.id}
                  name={item.name}
                  onDeleted={onDeleted}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Skeleton Component (`<feature>-list-skeleton.tsx`)

```typescript
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function <Feature>ListSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tên</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Số điện thoại</TableHead>
          <TableHead>Địa chỉ</TableHead>
          <TableHead>Hành động</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className='h-4 w-32' /></TableCell>
            <TableCell><Skeleton className='h-4 w-40' /></TableCell>
            <TableCell><Skeleton className='h-4 w-28' /></TableCell>
            <TableCell><Skeleton className='h-4 w-40' /></TableCell>
            <TableCell><Skeleton className='h-8 w-16' /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Empty Component (`<feature>-list-empty.tsx`)

```typescript
import { ListIcon } from 'lucide-react';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function <Feature>ListEmpty() {
  return (
    <Card className='border-dashed'>
      <CardHeader className='pb-3'>
        <div className='flex flex-col items-center gap-2 text-center'>
          <ListIcon className='h-10 w-10 text-muted-foreground' />
          <CardTitle className='text-lg'>Chưa có item</CardTitle>
          <CardDescription>Hãy thêm item đầu tiên để bắt đầu quản lý.</CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}
```

### AddNew Component (`<feature>-add-new.tsx`)

Form sử dụng `form.elements.namedItem()` — thêm field bằng cách thêm `name` attribute và đọc value trong `handleSubmit`. KHÔNG dùng state cho từng field.

```typescript
'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { create<Feature>, type <Feature>Item } from '@/modules/<feature>/services/<feature>-service';
import { PlusIcon } from 'lucide-react';

export function <Feature>AddNew({ onCreated }: { onCreated?: (item: <Feature>Item) => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleOpenChange(open: boolean) {
    setOpen(open);
    if (open) {
      // reset state cua cac Select fields nếu có
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value.trim();
    const address = (form.elements.namedItem('address') as HTMLTextAreaElement).value.trim();

    if (!name) {
      toast.error('Vui lòng nhập tên.');
      setLoading(false);
      return;
    }

    try {
      const item = await create<Feature>({
        name,
        email: email || undefined,
        phone: phone || undefined,
        address: address || undefined,
      });
      onCreated?.(item);
      setOpen(false);
      form.reset();
      toast.success('Đã thêm mới thành công.');
    } catch {
      toast.error('Không thể tạo. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button>
            <PlusIcon />
            Thêm mới
          </Button>
        }
      />
      <DialogContent>
        <form ref={formRef} id='<feature>-form' onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Thêm mới</DialogTitle>
            <DialogDescription>Nhập thông tin để tạo một bản ghi mới.</DialogDescription>
          </DialogHeader>

          <div className='flex flex-col gap-4 py-3'>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='name'>Tên *</Label>
              <Input id='name' name='name' placeholder='VD: Nguyễn Văn A' autoFocus required />
            </div>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='email'>Email</Label>
              <Input id='email' name='email' type='email' placeholder='VD: nguyenvana@example.com' />
            </div>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='phone'>Số điện thoại</Label>
              <Input id='phone' name='phone' type='tel' placeholder='VD: 0901234567' />
            </div>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='address'>Địa chỉ</Label>
              <Textarea id='address' name='address' placeholder='VD: 123 Nguyễn Trãi, Quận 1, TP.HCM' rows={2} />
            </div>
          </div>

          <DialogFooter showCloseButton>
            <Button type='submit' form='<feature>-form' disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Edit Component (`<feature>-edit.tsx`)

Dùng React state cho controlled inputs. Mỗi field có dedicated state — thêm field bằng cách thêm state + input tương ứng. Khi mở dialog, reset tất cả fields về giá trị ban đầu của item.

```typescript
'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { <Feature>Item } from '@/modules/<feature>/services/<feature>-service';
import { update<Feature> } from '@/modules/<feature>/services/<feature>-service';
import { PencilIcon } from 'lucide-react';

type <Feature>EditProps = {
  item: <Feature>Item;
  onMutate?: () => void;
};

export function <Feature>Edit({ item, onMutate }: <Feature>EditProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(item.name);
  const [email, setEmail] = useState(item.email ?? '');
  const [phone, setPhone] = useState(item.phone ?? '');
  const [address, setAddress] = useState(item.address ?? '');

  function handleOpenChange(open: boolean) {
    setOpen(open);
    if (open) {
      setName(item.name);
      setEmail(item.email ?? '');
      setPhone(item.phone ?? '');
      setAddress(item.address ?? '');
    }
  }

  async function handleSubmit() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error('Vui lòng nhập tên.');
      return;
    }

    setLoading(true);
    try {
      await update<Feature>({
        id: item.id,
        name: trimmedName,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });
      onMutate?.();
      setOpen(false);
      toast.success('Đã cập nhật thành công.');
    } catch {
      toast.error('Không thể cập nhật. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant='ghost' size='icon-xs'>
            <PencilIcon className='h-3.5 w-3.5' />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa</DialogTitle>
          <DialogDescription>Cập nhật thông tin bản ghi.</DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-4 py-3'>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='edit-name'>Tên *</Label>
            <Input id='edit-name' value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='edit-email'>Email</Label>
            <Input id='edit-email' type='email' value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='edit-phone'>Số điện thoại</Label>
            <Input id='edit-phone' type='tel' value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='edit-address'>Địa chỉ</Label>
            <Textarea id='edit-address' value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter showCloseButton>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### DeleteConfirm Component (`<feature>-delete-confirm.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { delete<Feature> } from '@/modules/<feature>/services/<feature>-service';
import { Trash2Icon } from 'lucide-react';

type <Feature>DeleteConfirmProps = {
  id: string;
  name: string;
  onDeleted?: (id: string) => void;
};

export function <Feature>DeleteConfirm({ id, name, onDeleted }: <Feature>DeleteConfirmProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await delete<Feature>(id);
      onDeleted?.(id);
      setOpen(false);
      toast.success('Đã xóa thành công.');
    } catch {
      toast.error('Không thể xóa. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant='ghost' size='icon-xs'>
            <Trash2Icon className='h-3.5 w-3.5 text-destructive' />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn xóa <strong>{name}</strong>? Hành động này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction variant='destructive' onClick={handleConfirm} disabled={loading}>
            {loading ? 'Đang xóa...' : 'Xóa'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

## Các bước thực hiện

1. **Tạo service** trong `modules/<feature>/services/<feature>-service.ts` — types inline, CRUD operations với `serverTimestamp()`, optional pagination
2. **Tạo `<feature>-list.tsx`** — Card wrapper với search input, sort button, `cancelledRef` + `refetch` pattern, `useMemo` cho filtered/sorted data
3. **Tạo `<feature>-list-table.tsx`** — `<Table>` với sortable column headers và action buttons
4. **Tạo `<feature>-list-skeleton.tsx`** — `<Table>` skeleton với 5 rows
5. **Tạo `<feature>-list-empty.tsx`** — `Card border-dashed` với centered icon layout
6. **Tạo `<feature>-add-new.tsx`** — `<Dialog>` với `form.elements.namedItem()` cho fields, `onCreated` callback
7. **Tạo `<feature>-edit.tsx`** — `<Dialog>` với React state cho tất cả fields, `onMutate` callback
8. **Tạo `<feature>-delete-confirm.tsx`** — `<AlertDialog>` với `onDeleted` callback
9. **Kiểm tra TypeScript**: `npx tsc --noEmit`
10. **Khởi chạy dev server**: `npm run dev` và xác nhận trang load đúng, Firebase connection hoạt động, UI render không lỗi

## Loại trừ

- Không tạo file README hay tài liệu trừ khi được yêu cầu
- Không sử dụng React class component — chỉ dùng functional component + hooks
- Không hardcode Firebase config — luôn import từ `lib/firebase/client.ts` hoặc `lib/firebase/admin.ts`
- Không dùng `onSnapshot` (real-time) — dùng polling với `cancelledRef`
- Không dùng `serverTimestamp()` trong get operations (chỉ dùng trong create/update)
- Form fields dùng generic labels (`Tên`, `Email`) — không hardcode tên feature cụ thể
