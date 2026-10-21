# jib-template-sso

Template โปรเจกต์ Intranet ของ JIB บน **Next.js 16 (App Router)** พร้อมระบบเข้าสู่ระบบผ่าน **SSO (nexus-intralogin)** แบบ OIDC Authorization Code + PKCE, ระบบสิทธิ์ตาม resource/action และชุด component กลาง (sidebar, navbar, table, select, datepicker, dialog) ที่ใช้ซ้ำได้ทุกหน้า

> กฎการเขียนโค้ดและสถาปัตยกรรมฉบับเต็มอยู่ใน [`AGENTS.md`](./AGENTS.md) — อ่านก่อนเริ่มแก้โค้ด

## Tech Stack

| หมวด | ใช้ |
|---|---|
| Framework | Next.js 16.3.6 (App Router) + React 19.2.8 + TypeScript |
| Dev server | `next dev --turbopack` |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) + `tw-animate-css` |
| UI | shadcn/ui style `base-nova` บน `@base-ui/react` |
| ตาราง | antd v6 ผ่าน `TableTemplate` (+ `@dnd-kit` สำหรับลากสลับคอลัมน์) |
| State | Zustand v5 |
| HTTP | axios (`services/`) สำหรับ API หลัก, `fetch` สำหรับ SSO |
| Icon | lucide-react |
| Theme | next-themes (dark/light) |
| JWT | jwt-decode |

## เริ่มต้นใช้งาน

```bash
npm install
npm run dev
```

แอปตั้ง `basePath` ไว้ (ค่าใน `.env.*` คือ `/template`) เพราะฉะนั้นเปิดที่ **http://localhost:4000/template**
ถ้าเปิด `http://localhost:4000/` เฉย ๆ `proxy.ts` จะ redirect ไปที่ basePath ให้เอง

## คำสั่ง

```bash
npm run dev       # dev server port 4000 + Turbopack
npm run build     # production build
npm run start     # รัน production build
npm run lint      # ESLint (eslint-config-next, flat config)
npm run test:sso  # เทสต์ SSO flow

node --test "tests/*.test.mjs"   # รันเทสต์ทั้งหมด (ต้องใส่ quote ให้ node ขยาย glob เอง)
```

ก่อนส่งงานต้องผ่านครบสามอย่าง (ดู §16 ของ `AGENTS.md`):

```bash
node ./node_modules/typescript/bin/tsc --noEmit
npm run lint
npm run build
```

## โครงสร้างโปรเจกต์

ไม่มีโฟลเดอร์ `src/` — alias `@/*` ชี้ไปที่ root ของโปรเจกต์

```
app/
├── (auth)/login/              # หน้า login (เด้งเข้า SSO ให้อัตโนมัติ)
├── (auth)/auth/callback/      # รับ code จาก SSO แล้วแลก token
├── (protected)/               # ครอบด้วย SessionGuard → AppShell → RequirePermission
│   ├── dashboard/
│   ├── job-admin/
│   ├── permissions/           # ตารางสิทธิ์ของผู้ใช้ที่ login
│   ├── profile/
│   ├── table-demo/
│   └── [...slug]/             # placeholder สำหรับเมนูใน utils/links.ts ที่ยังไม่มีหน้าจริง
├── api/legacy-onsite/[...path]/   # route handler ของ proxy API ระบบเดิม (dev only)
├── layout.tsx                 # Root layout (font Kanit, Providers, AntdRegistry)
├── globals.css                # Tailwind v4 + theme token
└── antd-overrides.css

components/                    # ทุกโฟลเดอร์มี index.ts เป็น barrel — import ผ่าน barrel เท่านั้น
├── auth/      Login, SsoCallback, SessionGuard, RequirePermission, UserProfile, UserPermissions
├── layout/    AppShell (sidebar + navbar + พื้นที่เนื้อหา), Providers
├── navbar/    Navbar + Clock / Notifications / SessionTimer / ThemeToggle / UserMenu
├── sidebar/   Sidebar + Header / Main / Nav / MobileNav
├── table/     TableTemplate, DraggableColumnsTable, TableColumnSettings, ClampedCell, tablePrefs
├── select/    SelectSearch, SelectCp
├── datepicker/ DatePicker, DatePickerRange
├── dialog/    ChangePasswordDialog
└── ui/        shadcn primitives — ห้ามแก้เพื่อใส่ business logic

config/env.ts     รวมการอ่าน environment variable ทุกตัวไว้ที่เดียว
functions/        ฟังก์ชัน pure (format วันที่, เช็ก active link)
hooks/            use-mobile, usePermission, useTableScrollHeight, useVisibleNavSections
lib/              sso.ts (PKCE), storage.ts (wrapper storage แบบมี namespace), utils.ts (cn)
services/         รวม API call ทุกตัว — ห้าม fetch กระจายใน component
store/            useAppStore (session + permissions), useLegacyOnsiteStore (dev only)
utils/            links (เมนู sidebar), messages, permissions, navigationPermissions
tests/            unit test รันด้วย node --test
proxy.ts          redirect "/" ที่อยู่นอก basePath เข้า basePath
```

## Environment variables

ไฟล์ที่ commit ไว้: `.env.development`, `.env.uat`, `.env.production` — override เฉพาะเครื่องได้ที่ `.env.local` (ไม่ถูก commit)
ทุกตัวอ่านผ่าน `config/env.ts` เท่านั้น ห้ามอ่าน `process.env` ตรงในโค้ดอื่น

| ตัวแปร | จำเป็น | ความหมาย |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | base URL ของ backend intranet |
| `NEXT_PUBLIC_BASE_PATH` | ✅ | path ที่แอป deploy อยู่ (`.env.*` ตั้งเป็น `/template`) |
| `NEXT_PUBLIC_SSO_BASE_URL` | ✅ | base URL ของ nexus-intralogin |
| `NEXT_PUBLIC_SSO_CLIENT_ID` | ✅ | client id ที่ลงทะเบียนไว้กับ SSO |
| `NEXT_PUBLIC_SSO_API_BASE_URL` | – | ดีฟอลต์ `{API_URL}/jib-sso/v1` |
| `NEXT_PUBLIC_SSO_LOGOUT_URL` | – | ดีฟอลต์ `{SSO_BASE_URL}/api/auth/logout` |
| `NEXT_PUBLIC_SSO_REDIRECT_URI` | – | ดีฟอลต์ `{BASE_PATH}/auth/callback` |
| `NEXT_PUBLIC_SSO_APP_NAME` | – | ดีฟอลต์ `template` |
| `NEXT_PUBLIC_SSO_SCOPE` | – | ดีฟอลต์ `openid profile` |
| `NEXT_PUBLIC_ONSITE_API_BASE_URL` | – | ดีฟอลต์ `{API_URL}/api-onsite/api/v1` |
| `NEXT_DEV_ALLOWED_ORIGINS` | – | dev เท่านั้น — host ที่ยิงเข้า dev server ได้ (คั่นด้วย comma) |
| `NEXT_PUBLIC_DEV_AUTH_BYPASS` | – | **dev เท่านั้น** ดูหัวข้อถัดไป |
| `NEXT_PUBLIC_ONSITE_API_AUTH_MODE` | – | **dev เท่านั้น** ดูหัวข้อถัดไป |

`NEXT_PUBLIC_APP_VERSION` / `NEXT_PUBLIC_APP_ENV` ถูกตั้งไว้ใน `.env.*` แต่ยังไม่มีโค้ดอ้างถึง

> secret ฝั่ง server ห้ามใส่ prefix `NEXT_PUBLIC_` เพราะจะหลุดไปอยู่ใน bundle ฝั่ง client

## สวิตช์สำหรับงาน dev

ทั้งสองตัวล็อกไว้ว่าทำงานเฉพาะตอนไม่ใช่ production build

**`NEXT_PUBLIC_DEV_AUTH_BYPASS=true`** — ข้าม SSO แล้ว seed session ปลอม (สิทธิ์ `*`) ให้ทันที ใช้ตอนต่อ SSO ไม่ได้แต่อยากดู layout ภายใน
ปิดกลับเป็น `false` แล้วควร **ล้าง session storage ของ origin นั้นด้วย** ไม่งั้น token ปลอมที่ค้างอยู่จะถูกเอาไปยิง `/userinfo` จริงแล้วโดนปฏิเสธ

**`NEXT_PUBLIC_ONSITE_API_AUTH_MODE=legacy`** — ให้ `onsiteAPI` ยิงผ่าน route handler `app/api/legacy-onsite/[...path]/` แทนการใช้ token ของ SSO โดยใส่ token ของระบบ Onsite เดิมเองในหน้าข้อมูลผู้ใช้ (เก็บใน `useLegacyOnsiteStore`) ตัว proxy จำกัดไว้แน่น: เฉพาะ resource ใน allow-list, บล็อค cross-origin, ไม่ตาม redirect, timeout 12 วินาที และบังคับว่า `NEXT_PUBLIC_ONSITE_API_BASE_URL` ต้องเป็น URL ของ API เดิมเท่านั้น

## Auth / SSO flow

1. ยังไม่มี session → `SessionGuard` พาไป `/login`
2. `components/auth/Login.tsx` เรียก `lib/sso.ts#beginSsoAuthorization` สร้าง `state` / `nonce` / `codeVerifier` (PKCE S256) เก็บใน sessionStorage อายุ 10 นาที แล้ว redirect ไปหน้า authorize ของ SSO
3. SSO ส่งกลับมาที่ `/auth/callback` พร้อม `code` → `readSsoCallback` ตรวจ `state` ให้ตรง → `exchangeSsoAuthorizationCode` แลก token → `getSsoUserInfo` ดึงข้อมูลผู้ใช้
4. `useAppStore#setSsoSession` เก็บ `accessToken` / `userData` / `permissions` / `refreshToken` / `expiresAt` ลง sessionStorage ผ่าน wrapper ใน `lib/storage.ts` (prefix ด้วย namespace ของ basePath กัน key ชนกับแอปอื่นบน domain เดียวกัน)
5. `SessionGuard` เฝ้า `expiresAt` ทุกวินาทีและตอน window focus — หมดอายุแล้ว logout ออก SSO และกลับไปหน้า login
6. `services/apiServices.ts` ทำ refresh token แบบ single-flight: หลายรีเควสต์ที่เจอ token หมดอายุพร้อมกันจะรอ refresh รอบเดียว ถ้า refresh ไม่ผ่านจะ logout แล้วเด้งไป login

## ระบบสิทธิ์

สิทธิ์เป็น string สามรูปแบบ — `*` (ทุกสิทธิ์), `<resource>.*` (ทุก action ของ resource นั้น) และ `<resource>.<action>` แบบตรงตัว
action ที่รองรับ: `view` / `create` / `edit` / `approve` / `print` / `cancel`

- เมนู sidebar กรองด้วย `filterNavSections` ตาม `resource` ที่ประกาศไว้ใน `utils/links.ts`
- การเข้าถึง URL ตรง ๆ กันด้วย `RequirePermission` ที่ใช้ `getRoutePermission` จากชุดเดียวกัน
- ในหน้าใช้ hook `usePermission` เพื่อซ่อน/ปิดปุ่มตามสิทธิ์
- ทั้งหมดนี้เป็นการกันที่ฝั่ง UI เท่านั้น — backend ยังต้องตรวจสิทธิ์อีกชั้นเสมอ

## เพิ่มหน้าใหม่

1. สร้าง `app/(protected)/<ชื่อ>/page.tsx` (`export default function`)
2. เพิ่มเมนูใน `utils/links.ts` พร้อมระบุ `resource` ถ้าหน้านั้นต้องมีสิทธิ์
3. แยก component ของหน้าไปไว้ใน `components/<feature>/` แล้ว export ผ่าน `index.ts`
4. หน้ารายการให้ทำตามแพตเทิร์นใน §8 ของ `AGENTS.md` (หัวหน้า + ตัวกรอง + `TableTemplate`)

---

> Next.js เวอร์ชันนี้มี breaking change จากที่คุ้นเคย ให้เปิดเอกสารใน `node_modules/next/dist/docs/01-app/` ก่อนเขียนโค้ดที่แตะ framework API แทนการเดาจากความจำ
