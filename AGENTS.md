<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# SPEC — กฎการ Generate Code สำหรับ JIB Intranet (Next.js + SSO)

เอกสารนี้เป็นข้อกำหนดให้ AI (และผู้พัฒนา) ใช้ยึดเวลาเขียน/แก้โค้ดในโปรเจกต์นี้ เขียนขึ้นจากการอ่านโค้ดจริงในโปรเจกต์ โปรเจกต์นี้ย้ายจาก React + Vite มาเป็น **Next.js App Router** ถ้ากฎในไฟล์นี้ขัดกับ `.kiro/steering` ให้ยึด steering เป็นหลัก

> โปรเจกต์อยู่ระหว่างการ migrate — บางโมดูลที่โค้ดอ้างถึง (`@/lib/storage`, `@/utils/permissions`, `@/services/apiSSOService`) และแพ็กเกจ `zustand` ยังไม่ถูกสร้าง/ติดตั้ง ให้สร้างตามแพตเทิร์นในเอกสารนี้เมื่อจำเป็น

---

## 0. หลักการก่อนลงมือ (อ่านก่อนทุกครั้ง)

1. **อ่าน docs ของ Next.js เวอร์ชันนี้ก่อนเขียนโค้ด framework** — อยู่ที่ `node_modules/next/dist/docs/01-app/` (App Router) อย่าเดา API จากความจำ เพราะเวอร์ชันนี้มี breaking change
2. **อ่านโค้ดที่เกี่ยวข้องก่อนแก้เสมอ** ห้ามเดา API หรือ props ของ component ที่มีอยู่
3. **แยก Server / Client Component ให้ถูก** — ไฟล์ใน `app/` เป็น Server Component โดยดีฟอลต์ ใส่ `"use client"` เฉพาะเมื่อใช้ hook / state / event handler / browser API (ดูข้อ 7)
4. **ทำตามแพตเทิร์นที่โปรเจกต์ใช้อยู่** อย่าเอาไลบรารี/สไตล์ใหม่เข้ามาถ้ามีของเดิมทำงานได้แล้ว
5. **แก้เฉพาะสิ่งที่โจทย์ต้องการ** อย่าเพิ่ม feature/abstraction เกินความจำเป็น
6. **ตรวจงานก่อนบอกว่าเสร็จ** ต้องผ่าน type-check + lint + build (ดูข้อ 14)
7. ห้ามสร้างไฟล์ document (README/*.md) เว้นแต่ผู้ใช้สั่ง

---

## 1. Tech Stack (จาก package.json)

| หมวด | ใช้ |
|---|---|
| Framework | **Next.js 16.3.6 (App Router) + React 19.2.8 + TypeScript** |
| Dev server | `next dev` + **Turbopack** (`npm run dev` → port 4000) |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) + `tw-animate-css` |
| UI | shadcn/ui (style `base-nova`) บน **`@base-ui/react`** (ไม่ใช่ radix, ไม่มี antd) |
| Routing | Next.js App Router (file-based ใต้ `app/`) |
| Global State | Zustand v5 (`store/`) — *ยังต้องติดตั้งแพ็กเกจ* |
| `cn()` | แพ็กเกจ `cn` (re-export ผ่าน `@/lib/utils`) |
| Icons | lucide-react (ตัวเดียวเท่านั้น) |
| Theme | next-themes (dark/light) |
| JWT | jwt-decode |
| Fonts | `next/font/google` (Geist, Geist_Mono) |

- Entry คือ `app/layout.tsx` (Root Layout) — ไม่มี `main.tsx` / `BrowserRouter` อีกต่อไป
- ไม่มี `basename` แบบ react-router แล้ว ถ้าต้อง deploy ใต้ subpath ให้ตั้ง `basePath` ใน `next.config.ts`

---

## 2. โครงสร้างโฟลเดอร์ (root-based — ไม่มี `src/`)

```
app/                    # App Router (routes + layouts)
├── layout.tsx          # Root Layout (<html>/<body>, fonts, providers)
├── page.tsx            # หน้า "/"
├── globals.css         # Tailwind v4 + theme tokens (@import)
└── (auth)/             # route group เช่นหน้า login (ไม่ปรากฏใน URL)
components/
├── ui/                 # shadcn base (base-nova) — ห้ามแก้เพื่อ business logic
├── navbar/             # Navbar + NavbarClock/UserMenu/... + index.ts (barrel)
└── sidebar/            # ...
functions/functions.ts  # ฟังก์ชัน pure (formatDate, formatThaiDate, ...)
hooks/                  # use-mobile.ts (custom hooks ฝั่ง client)
lib/                    # utils.ts (re-export cn), storage.ts (planned)
store/                  # useAppStore.ts (Zustand)
public/                 # static assets (เสิร์ฟที่ "/")
services/               # apiService / apiSSOService (planned)
utils/                  # types, permissions, links, ... (planned)
```

หลักการวางไฟล์:
- ทุกโฟลเดอร์ component มี `index.ts` เป็น barrel export (ดู `components/navbar/index.ts`)
- routing ทั้งหมดอยู่ใน `app/` เท่านั้น — component ที่ reuse ได้อยู่ใน `components/` ไม่ปนกับ route
- sub-component ที่ใช้เฉพาะที่เดียว วางไฟล์เดียวกันได้ ถ้าถูก reuse หรือทำให้ไฟล์แม่ใหญ่เกินไป → แยกไฟล์

---

## 3. Path Alias

`@/*` map ไปที่ **root ของโปรเจกต์** (`./*` — ดู `tsconfig.json`) ไม่ใช่ `src/` ใช้ `@/` เสมอสำหรับ import ข้ามโฟลเดอร์ ใช้ relative (`../`) ได้เฉพาะไฟล์ที่อยู่ใกล้กันภายในฟีเจอร์เดียวกัน (เช่นใน component จะ `import { Button } from "../ui/button"`)

```ts
// ✅
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/useAppStore"
import { formatThaiDate } from "@/functions/functions"

// ❌
import { cn } from "../../../lib/utils"
```

---

## 4. Naming Conventions

| ชนิด | รูปแบบ | ตัวอย่าง |
|---|---|---|
| Component | PascalCase | `Navbar.tsx`, `NavbarUserMenu.tsx` |
| Route file | lowercase (Next convention) | `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `middleware.ts` |
| Hook | camelCase ขึ้นต้น `use` | `useAppStore.ts`, `use-mobile.ts` |
| Service / function / util | camelCase | `apiService.ts`, `formatDate` |
| Type / Interface | PascalCase | `AppState`, `SsoUserInfo` |
| Constant | UPPER_SNAKE_CASE | `THAI_MONTHS_FULL` |
| Event handler | ขึ้นต้น `handle` | `handleLogout` |
| Boolean | ขึ้นต้น `is/show/has` | `isLoading`, `showForm` |

---

## 5. Code Style (สำคัญ — โปรเจกต์นี้มีสไตล์เฉพาะ)

- **Indent 4 spaces** ห้ามใช้ tab
- **ไม่ใส่ semicolon** ท้ายบรรทัด — ยกเว้นภายใน `type`/`interface` declaration ที่ลงท้าย field ด้วย `;`
- **Double quotes** `"` สำหรับ string
- **Trailing comma** ใน array / object / params หลายบรรทัด
- **เว้น space ภายใน brackets** ของ destructuring, state, และ JSX expression

```tsx
const [ count, setCount ] = useState<number>(0)
<span> { displayName } </span>
```

- **เว้น space ภายใน parentheses** ของ condition และ callback ที่เป็น expression

```tsx
if ( !token ) return
setItems(( prev ) => prev.filter(( item ) => item.id !== id ))
```

- function call argument เดียวที่เป็น simple value ไม่ต้องเว้น: `useState(false)`, `router.push("/login")`
- **บรรทัดยาวไม่เกิน ~140 ตัวอักษร** (ยืดหยุ่นได้กับ className ยาว)

> หมายเหตุ: ไฟล์ที่ scaffold มาจาก `create-next-app` (`app/layout.tsx`, `app/page.tsx`) ยังเป็น 2-space + semicolon อยู่ เมื่อแก้ไฟล์เหล่านี้ให้ปรับเข้าสไตล์โปรเจกต์ทีละไฟล์

---

## 6. ลำดับ Import (คั่นแต่ละกลุ่มด้วยบรรทัดว่าง)

```tsx
"use client"                                  // ถ้าจำเป็น ต้องเป็นบรรทัดแรกสุดของไฟล์

// 1. React + hooks
import { useState, useEffect } from "react"

// 2. Next.js
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"

// 3. Third-party

// 4. shadcn ui (relative ../ui)
import { Button } from "../ui/button"

// 5. Custom components (relative)
import { NavbarUserMenu } from "../navbar"

// 6. lib / store / functions / services (@/)
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/useAppStore"

// 7. Types — ใช้ import type เสมอ
import type { AppState } from "@/store/useAppStore"
```

- `"use client"` ถ้ามี **ต้องอยู่บรรทัดแรกสุด** ก่อน import ทุกตัว
- type-only import ต้องใช้ `import type { ... }` เสมอ

---

## 7. Server vs Client Components

- ไฟล์ใน `app/` และ component ทั่วไปเป็น **Server Component** โดยดีฟอลต์ (ห้ามใช้ hook / event / browser API)
- ใส่ `"use client"` ที่บรรทัดแรกเมื่อ component ต้องใช้อย่างใดอย่างหนึ่ง:
  - React hooks (`useState`, `useEffect`, `useRouter`, Zustand store ฯลฯ)
  - event handler (`onClick`, `onChange`, ...)
  - browser API (`window`, `localStorage`, `document`)
- ดัน `"use client"` ให้อยู่ **ปลายกิ่ง (leaf) ที่เล็กที่สุด** ที่ต้องใช้ อย่าเปลี่ยน layout/page ทั้งหน้าเป็น client ถ้าไม่จำเป็น
- ห้ามใช้ `next/router` — ใช้ `useRouter`/`usePathname`/`useSearchParams` จาก **`next/navigation`** เท่านั้น
- navigation:
  - เปลี่ยนหน้าแบบเพิ่มประวัติ → `router.push("/path")`
  - แทนที่ history (เช่นหลัง logout) → `router.replace("/path")`
  - ลิงก์ที่คลิกได้ → ใช้ `<Link href="...">` จาก `next/link` (prefetch อัตโนมัติ) แทน `useRouter`

---

## 8. โครงสร้าง Component

- **functional component เท่านั้น** ห้าม class component
- Page / main component: `export default function`
- sub-component / utility: named export ผ่าน barrel
- ลำดับภายใน function: `"use client"` → imports → hooks → state → effects → handlers → derived values → return JSX
- props: inline `type Props = {}` (component-specific) หรือ shared ใน `@/utils/types`
- เมื่อ wrap shadcn/ui component ให้ใช้ `React.ComponentProps<typeof X>` และ spread `{...props}`
- คุม class ด้วย `cn()` เสมอเมื่อมีเงื่อนไข ห้ามใช้ template literal ต่อ class แบบมี ternary

```tsx
"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

type Props = {
    title: string;
    className?: string;
}

export default function ExampleCard({ title, className }: Props) {
    const [ isOpen, setIsOpen ] = useState<boolean>(false)

    return <div className={cn("gap-3 py-4", isOpen && "ring-1")}> { title } </div>
}
```

- ไฟล์ที่ใหญ่/มีหลายส่วน ให้แตกเป็น sub-component แล้ว compose ในตัวแม่ (ดู `components/navbar/` ที่แตกเป็น `NavbarClock`, `NavbarUserMenu`, ...)

---

## 9. State Management (Zustand)

- global state ใช้ Zustand เท่านั้น (ไม่ใช้ React Context สำหรับ app state) — store อยู่ที่ `store/use<Name>Store.ts`
- store หลักคือ `useAppStore` — จัดการ `userDetail`, `accessToken`, `permissions` + actions (`setAccessToken`, `setSsoSession`, `initUser`, `loadPermissions`, `logout`)
- **import ด้วย selector เสมอ** เพื่อลด re-render

```ts
// ✅
const userDetail = useAppStore(( state ) => state.userDetail)
// ❌ destructure ทั้ง store
const { userDetail } = useAppStore()
```

- อ่าน state นอก component ใช้ `useAppStore.getState()`
- **ข้อควรระวังเรื่อง SSR:** store อ่าน `storage`/`sessionStorage` ตอน init ซึ่งมีเฉพาะฝั่ง client — component ที่บริโภค state เหล่านี้ต้องเป็น `"use client"` และควรกัน hydration mismatch (เช่น render ค่าเริ่มต้นก่อน แล้วค่อย sync หลัง mount)

---

## 10. Auth & Token / Storage (SSO)

- **ห้ามเรียก `localStorage` / `sessionStorage` ตรงๆ** ให้ใช้ wrapper `storage` / `sessionStorageStore` จาก `@/lib/storage` (มี namespace กัน key ชนกับแอปอื่นบน domain เดียวกัน)
- โฟลว์ SSO: เก็บ session ผ่าน `useAppStore.setSsoSession(token, user, refreshToken)` — เก็บ `accessToken` / `userData` / `permissions` / `refreshToken` ลง sessionStorage
- decode token ด้วย `jwtDecode` จาก `jwt-decode`
- browser storage มีเฉพาะฝั่ง client — โค้ดที่แตะ storage ต้องอยู่ใน Client Component หรือหลัง mount เท่านั้น
- **กัน route**: ใช้ `middleware.ts` (root) ตรวจ token/redirect ไป login หรือกันใน layout ของ route group — **ไม่มี `<ProtectedRoute>` แบบ react-router แล้ว**

---

## 11. API & Services

- ทุก API call รวมไว้ที่ layer เดียว (`services/apiService.ts`, `services/apiSSOService.ts`) **ห้าม fetch ตรงกระจายใน component**
- Server Component สามารถ `fetch` ข้อมูลได้โดยตรง (แนะนำสำหรับ data ที่ render ฝั่ง server); Client Component เรียกผ่าน service layer
- base URL อ่านจาก `process.env.NEXT_PUBLIC_API_URL`
- catch แล้ว **`throw error` เสมอ** ให้ผู้เรียกจัดการต่อ
- error handling ฝั่ง UI ใช้ try/catch/finally + คุม loading state (toast: ยังไม่มีไลบรารีติดตั้ง ถ้าจะใช้ให้ตกลงตัวเลือกก่อน)

```tsx
const handleAction = async () => {
    try {
        setIsLoading(true)
        await apiCall()
    } catch ( error ) {
        console.error(error)
    } finally {
        setIsLoading(false)
    }
}
```

---

## 12. Routing / เพิ่มหน้าใหม่ (App Router)

Routing เป็น file-based ใต้ `app/` — ไม่มีไฟล์ routes รวมศูนย์แบบ `App.tsx`

ขั้นตอนเพิ่มหน้า `/example`:
1. สร้าง `app/example/page.tsx` (`export default function`)
2. ถ้าต้องมี layout/nav ครอบเฉพาะกลุ่ม → เพิ่ม `app/example/layout.tsx`
3. ต้องการ loading/error UI → เพิ่ม `loading.tsx` / `error.tsx` ในโฟลเดอร์เดียวกัน
4. dynamic route → `app/example/[id]/page.tsx` (อ่าน param จาก props `params`)
5. หน้าที่ไม่อยากให้ชื่อโฟลเดอร์โผล่ใน URL → ใช้ route group `(group)/` (เช่น `app/(auth)/login/page.tsx`)
6. ลิงก์เมนู/sidebar เพิ่มที่แหล่งรวม links ของโปรเจกต์ (ฝั่ง `@/utils` เมื่อมี)

- ใช้ `<Link href="/example">` สำหรับ navigation ปกติ, `useRouter()` เฉพาะเมื่อต้อง navigate แบบ programmatic

---

## 13. Styling / Icons / Assets

- ใช้ Tailwind v4 utility เท่านั้น (ตั้งค่าผ่าน `@tailwindcss/postcss`, import ใน `app/globals.css`) หลีกเลี่ยง custom CSS และ inline style
- ใช้ theme token ที่ผูก dark mode: `bg-background`, `text-foreground`, `bg-muted`, `text-muted-foreground`, `border`, `bg-primary`, `text-primary` ฯลฯ อย่า hardcode สีในจุดที่ต้องรองรับ dark mode
- dark mode ใช้ variant `dark:` (ผ่าน next-themes) — ตั้ง `<ThemeProvider>` และใส่ `suppressHydrationWarning` ที่ `<html>` เพื่อกัน hydration mismatch
- **icon ใช้ lucide-react เท่านั้น** ห้าม import icon จากไลบรารีอื่น (ตรวจชื่อ icon ว่ามีจริงใน version นี้ก่อนใช้)
- **รูปภาพในโปรเจกต์ใช้ `next/image`** (`<Image>`) เพื่อ optimize; ต้องระบุ `width`/`height` หรือใช้ `fill` โดเมนรูปจากภายนอกต้องประกาศใน `next.config.ts` (`images.remotePatterns`)
- static asset วางใน `public/` แล้วอ้างด้วย path ที่ขึ้นต้น `/` (เช่น `/next.svg`)

---

## 14. Environment Variables

- ตัวแปรที่ต้องใช้ **ฝั่ง client/browser** ต้องขึ้นต้น `NEXT_PUBLIC_` (เช่น `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_VERSION`) อ่านผ่าน `process.env.NEXT_PUBLIC_*`
- secret ฝั่ง server **ห้าม** ใส่ prefix `NEXT_PUBLIC_` (ไม่งั้นจะหลุดไปที่ bundle ฝั่ง client)
- ไฟล์ env: `.env.development` (dev), ใช้ `.env.local` สำหรับ override เฉพาะเครื่อง (อย่า commit)

---

## 15. TypeScript

- strict mode เปิดอยู่, `moduleResolution: "bundler"` — เลี่ยง `any` (โค้ดใหม่ห้ามเพิ่ม; ของเดิมใน store บางจุดใช้ `Record<string, any>`)
- ระบุ generic ให้ `useState` เสมอ: `useState<boolean>(false)`
- ใช้ประโยชน์จาก type ที่ Next generate ให้: `LayoutProps<"/">`, `PageProps<...>` (ดู `app/layout.tsx`)
- type ที่ใช้ร่วมไว้ใน `@/utils/types`, type เฉพาะ component ประกาศ inline
- ใช้ `type` สำหรับ object shape, `interface` สำหรับ contract ที่ต้อง extend
- utility function ระบุ return type ชัดเจน: `export const formatDate = ( date: Date = new Date() ): string => { ... }`

---

## 16. Verification (บังคับก่อนบอกว่าเสร็จ)

รันจาก workspace root **หมายเหตุ:** ถ้า `npx` ถูกบล็อกด้วย execution policy ให้เรียก binary ตรงผ่าน `node`

```bash
# type-check (ไม่มี tsconfig.app.json แยก — ใช้ tsconfig.json)
node ./node_modules/typescript/bin/tsc --noEmit

# lint (ทั้งโปรเจกต์)
npm run lint
# หรือเฉพาะไฟล์: node ./node_modules/eslint/bin/eslint.js <path>

# build เต็ม (next build)
npm run build
```

- อย่ารัน `next dev` / `next start` ค้างไว้ในขั้น verify (เป็น long-running) — ให้ผู้ใช้รันเองถ้าต้องดู runtime
- แก้ error ให้หมดก่อนส่งงาน และลบไฟล์ชั่วคราวที่สร้างตอน verify
- ESLint config ใช้ `eslint-config-next` (core-web-vitals + typescript) ผ่าน flat config (`eslint.config.mjs`)

---

## 17. Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| `@/` alias (root-based) สำหรับ import ข้ามโฟลเดอร์ | relative `../../../` ยาวๆ |
| Server Component เป็นค่าเริ่มต้น ใส่ `"use client"` เท่าที่จำเป็น | ใส่ `"use client"` ทั้ง page/layout โดยไม่จำเป็น |
| `useRouter`/`Link` จาก `next/navigation` / `next/link` | `react-router-dom`, `next/router` |
| `<Image>` จาก `next/image` สำหรับรูป | `<img>` ทั่วไปที่ไม่ optimize / hardcode |
| `cn()` merge class | template literal + ternary ต่อ class |
| อ่าน env ผ่าน `process.env.NEXT_PUBLIC_*` | ใส่ secret ใน `NEXT_PUBLIC_` |
| API รวมใน service layer | fetch กระจายใน component |
| icon จาก `lucide-react` | icon จากไลบรารีอื่น |
| `storage` / `sessionStorageStore` wrapper | `localStorage` / `sessionStorage` ตรงๆ |
| Zustand selector | destructure ทั้ง store |
| อ่าน `node_modules/next/dist/docs/` ก่อนเขียนโค้ด framework | เดา Next API จากความจำ |
| ตรวจ tsc/lint/build ก่อนส่ง | ส่งงานโดยไม่ verify |
