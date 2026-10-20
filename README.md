# jib-template-sso

Template โปรเจกต์ Intranet ของ JIB บน **Next.js 16 (App Router)** พร้อมระบบ Login ผ่าน **SSO (nexus-intralogin)**, จัดการสิทธิ์ผู้ใช้ (permissions), และชุด component กลาง (sidebar, navbar, table, dialog ฯลฯ) ที่ใช้ร่วมกันได้ทั้งระบบ

> โปรเจกต์นี้ย้ายมาจาก React + Vite เดิม ดูรายละเอียดกฎการเขียนโค้ด/สถาปัตยกรรมแบบเต็มได้ที่ [`AGENTS.md`](./AGENTS.md)

## Tech Stack

- **Next.js 16.3.6** (App Router) + **React 19** + TypeScript
- Dev server รันด้วย **Turbopack**
- **Tailwind CSS v4** + shadcn/ui (style `base-nova` บน `@base-ui/react`)
- ตารางรายการใช้ **antd** ผ่าน `TableTemplate`
- **Zustand** สำหรับ global state (`store/useAppStore.ts`)
- **lucide-react** สำหรับ icon
- **next-themes** สำหรับ dark/light mode
- Auth แบบ **OIDC Authorization Code + PKCE** เชื่อมกับ nexus-intralogin (`lib/sso.ts`)

## โครงสร้างโฟลเดอร์หลัก

```
app/                    # Routes (App Router)
├── (auth)/             # หน้า login และ auth callback
├── (protected)/        # หน้าที่ต้อง login แล้วเท่านั้น (ครอบด้วย SessionGuard + AppShell)
└── layout.tsx           # Root layout

components/             # Custom components แยกตามฟีเจอร์ (แต่ละโฟลเดอร์มี index.ts เป็น barrel)
config/env.ts           # อ่านค่า environment variable ทั้งหมดของแอป
functions/functions.ts  # ฟังก์ชัน pure (format วันที่ ฯลฯ)
hooks/                  # custom hooks ฝั่ง client
lib/                    # sso.ts (PKCE flow), storage.ts (wrapper storage), utils.ts (cn)
services/               # apiServices.ts / apiSSOService.ts — รวม API call ทุกตัว
store/useAppStore.ts    # Zustand store หลัก (session, permissions)
utils/                  # links, messages, permissions, navigationPermissions
tests/                  # unit tests (node --test)
proxy.ts                # แทน middleware เดิม ใช้ redirect path ตาม basePath
```

## เริ่มต้นใช้งาน

ติดตั้ง dependency:

```bash
npm install
```

รัน dev server (พอร์ต 4000, ใช้ Turbopack):

```bash
npm run dev
```

เปิด [http://localhost:4000/template](http://localhost:4000/template) (แอปตั้ง `basePath` เป็น `/template` ผ่าน `NEXT_PUBLIC_BASE_PATH`)

### Environment variables

ค่า config หลักอยู่ใน `.env.development`, `.env.uat`, `.env.production` และถูกรวมศูนย์อ่านผ่าน `config/env.ts`

| ตัวแปร | ความหมาย |
|---|---|
| `NEXT_PUBLIC_API_URL` | base URL ของ backend API |
| `NEXT_PUBLIC_BASE_PATH` | path ที่แอป deploy อยู่ (ดีฟอลต์ `/template`) |
| `NEXT_PUBLIC_SSO_BASE_URL` | base URL ของ nexus-intralogin |
| `NEXT_PUBLIC_SSO_LOGOUT_URL` | endpoint logout ของ SSO |
| `NEXT_PUBLIC_SSO_API_BASE_URL` | endpoint `jib-sso` สำหรับดึง user info / permissions |
| `NEXT_PUBLIC_SSO_CLIENT_ID` / `NEXT_PUBLIC_SSO_APP_NAME` | ระบุตัวแอปต่อ SSO |
| `NEXT_PUBLIC_SSO_REDIRECT_URI` | callback URL หลัง login สำเร็จ |
| `NEXT_PUBLIC_DEV_AUTH_BYPASS` | **เฉพาะ dev** — ข้าม SSO แล้ว seed session ปลอมเพื่อดู layout ตอน backend ยังต่อไม่ได้ (ปิดเองใน production build) |

สร้าง `.env.local` เพื่อ override ค่าเฉพาะเครื่องตนเอง (ไฟล์นี้ไม่ถูก commit)

## คำสั่งที่ใช้บ่อย

```bash
npm run dev      # dev server (port 5000, Turbopack)
npm run build    # production build (next build)
npm run start    # รัน production build
npm run lint     # ESLint (eslint-config-next, flat config)
npm run test:sso # unit test ของ SSO flow (node --test)
```

ก่อน commit/ส่งงาน ควรรันผ่านทั้ง type-check, lint, build:

```bash
node ./node_modules/typescript/bin/tsc --noEmit
npm run lint
npm run build
```

## Auth / SSO Flow (สรุปสั้น)

1. ผู้ใช้กด login → `lib/sso.ts#beginSsoAuthorization` สร้างค่า PKCE (`state`, `nonce`, `codeVerifier`) เก็บไว้ใน sessionStorage แล้ว redirect ไปหน้า authorize ของ nexus-intralogin
2. SSO redirect กลับมาที่ `app/(auth)/auth/callback/page.tsx` พร้อม `code` — ตรวจสอบ `state` แล้วแลก token
3. `store/useAppStore.ts#setSsoSession` เก็บ `accessToken` / `userData` / `permissions` ไว้ใน sessionStorage (ผ่าน wrapper ใน `lib/storage.ts`) และ sync เข้า Zustand state
4. หน้าใน `app/(protected)/` ถูกครอบด้วย `SessionGuard` (เช็ก token/expiry) และ `RequirePermission` (เช็กสิทธิ์ตาม route)

ดูรายละเอียดกฎการพัฒนาแบบเต็ม (code style, การแยก server/client component, การจัดการ state, การเพิ่มหน้าใหม่ ฯลฯ) ใน [`AGENTS.md`](./AGENTS.md)

## เรียนรู้เพิ่มเติม

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js GitHub repository](https://github.com/vercel/next.js)

> หมายเหตุ: โปรเจกต์นี้ใช้ Next.js เวอร์ชันที่อาจมี breaking change จากที่คุ้นเคย ให้ตรวจเอกสารใน `node_modules/next/dist/docs/` ก่อนเขียนโค้ดที่เกี่ยวกับ framework API
