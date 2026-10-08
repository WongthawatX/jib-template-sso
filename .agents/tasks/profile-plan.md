# Implementation Plan — Redesign `components/auth/UserProfile.tsx`

Scope: make the `/profile` page look polished. Edit in place on the current working tree. No worktree, no branch, no commit. No new dependencies, no new shadcn components, no edits under `components/ui/`, no markdown docs.

---

## Findings from exploration (ground truth — do not re-derive)

### Current state of the target file

`components/auth/UserProfile.tsx` as it exists on disk is a `"use client"` component: an `<h1>` plus a flat `<dl className="grid gap-4 sm:grid-cols-2">` with six label/value pairs. There is **no `fontageium` typo** in the file today (the brief mentioned one; it is not there — do not go looking for it). It is exported `default` and re-exported as `UserProfile` from `components/auth/index.ts`, so the barrel needs no change.

### Confirmed `userDetail` shape

`userDetail` is `SsoUserInfo | null`, defined in `services/apiSSOService.ts`:

```ts
export type SsoUserInfo = {
    sub: string;                 // required
    user_id?: string;
    employee_id?: string;
    preferred_username?: string;
    name?: string;
    email?: string;
    phone?: string;              // exists, NOT currently rendered
    department?: string;
    branch?: string;
    system_role?: string;
    roles?: string[];
    permissions?: Permission[];  // Permission = string | MenuPermission
}
```

- Every field the current component reads exists. Safe to keep all of them.
- **`phone` exists and is unused — surface it.** It is the one genuinely useful addition.
- **`position` and `company` DO NOT exist.** Referencing them fails `tsc`. Do not add them.
- `user_id` exists but is redundant with `sub`; skip it.
- **Do not surface `permissions`.** `Permission` is a `string | MenuPermission` union and rendering it meaningfully needs `getMenuLabel` + the `PERMISSION_ACTIONS` CRUD matrix from `utils/permissions.ts`. That is a separate feature, out of scope for a visual redesign.
- `roles?: string[]` is always an array (`getSsoUserInfo` normalises it to `[]`), so `roles.length` is safe after an optional check.

### Surrounding shell — padding and container are already handled

`app/(protected)/layout.tsx` → `SessionGuard` → `AppShell`. `AppShell` renders:

```
<main className="... p-2 lg:pl-0">
  <Card className="... border-0 py-0 ring-0">     // full-height card, bg-card surface
    <ScrollArea ...>
      <div className="space-y-2 p-5"> { children } </div>
```

Consequences the implementation must respect:

- Page content already sits on a `bg-card` surface with `p-5` padding. **Remove the `py-4` from the component** — it double-pads. The root element should contribute only vertical rhythm (`flex flex-col gap-4` or `space-y-4`), no outer padding.
- Nested `<Card>` on a `bg-card` parent is distinguished only by its `ring-1 ring-foreground/10` (see `components/ui/card.tsx`). This is exactly what `app/(protected)/dashboard/page.tsx` does (`<Card className="p-5">`), so it is the established look. For extra separation on the identity band use `bg-muted/40`, which reads correctly in both themes.
- Content is inside a `ScrollArea` whose viewport is forced to `display: block`. Horizontal overflow would create a scrollbar, so every long value needs `min-w-0` + wrapping (details below).

### Heading ownership decision

Nothing else on the page renders a title: `Navbar` shows only the logo, clock, session timer, theme toggle and user menu; the sidebar renders nav links only; no route in `app/` renders a page heading. So exactly one `<h1>` is needed and there is no duplication risk.

**Decision: the `<h1>` stays inside `UserProfile`.** `app/(protected)/profile/page.tsx` remains a thin one-liner that renders `<UserProfile />`. Reason: the component is used by this one route, this is what the file does today, and keeping the title in one place makes a duplicate impossible.

### Avatar URL — reuse the navbar expression verbatim

`components/navbar/NavbarUserMenu.tsx` builds it as:

```ts
const username = userDetail?.preferred_username ?? userDetail?.employee_id ?? userDetail?.sub
const avatarUrl = process.env.NEXT_PUBLIC_API_URL && username
    ? `${process.env.NEXT_PUBLIC_API_URL}/intranet-api/storage/view?bucket=images&object=${encodeURIComponent(`JIBHR/img_hr/${username}.jpg`)}`
    : undefined
```

Use this **character-for-character**, including reading `process.env.NEXT_PUBLIC_API_URL` directly rather than `env.API_BASE_URL` from `@/config/env`. Reason: an identical URL string means the profile avatar and the navbar avatar hit the same browser cache entry instead of two near-identical requests.

`AvatarImage` (from `components/ui/avatar.tsx`, on `@base-ui/react/avatar`) renders a plain `<img>`, **not** `next/image`. That is what makes this safe: the host `api-uat-intranet.jibcomputer.group` is not declared in `next.config.ts` `images.remotePatterns` (only `placehold.co` is), so routing it through `next/image` would throw at runtime. Do not use `next/image` for the employee photo.

### Change-password entry point decision — LEAVE IT OUT

`ChangePasswordDialog` is used in exactly one place: `components/navbar/NavbarUserMenu.tsx` (grepped the whole repo; the only other hits are the two barrel re-exports in `components/dialog/index.ts` and `components/navbar/index.ts`).

That dropdown already contains, adjacent to each other: `ข้อมูลผู้ใช้` → `router.push("/profile")`, `เปลี่ยนรหัสผ่าน` → opens the dialog, and `ออกจากระบบ`. The navbar is persistent on every protected page, including `/profile`.

**Decision: do not add a change-password button to the profile page.** The action is already reachable from the same always-visible menu that links here — one click, two items apart. Adding a second entry point duplicates it, pulls `ChangePasswordDialog` plus `useState` into a component that otherwise needs no local state, and the dialog force-logs-out on success (`logout()` + `router.replace("/login?passwordChanged=1")`), which is a jarring side effect to invite from a read-only info page. Keeping it out also keeps this task to pure presentation.

### Verified available primitives and icon names

`components/ui/`: `avatar`, `button`, `card`, `collapsible`, `dialog`, `dropdown-menu`, `field`, `input`, `label`, `scroll-area`, `separator`, `sheet`, `sidebar`, `skeleton`, `tooltip`. **No `badge`** — build badge-like chips from a `<span>` + Tailwind.

`cn` (v0.4.0, re-exported from `@/lib/utils`) has full `tailwind-merge` parity, so passing `className="size-20"` to `<Avatar>` correctly overrides its built-in `size-8`.

Icon names checked against `node_modules/lucide-react/dist/lucide-react.d.ts` (lucide-react 1.47.0) — **all of these exist**: `IdCardIcon`, `MailIcon`, `PhoneIcon`, `Building2Icon`, `StoreIcon`, `ShieldCheckIcon`, `AtSignIcon`, `UserIcon`, `BadgeCheckIcon`. The type `LucideIcon` is also exported and is the right type for an icon-in-data-object field.

### Loading / hydration decision

`SessionGuard` (`components/auth/SessionGuard.tsx`) wraps the entire `(protected)` subtree and returns a full-screen spinner whenever `!isInitialized || !accessToken`. Initial store state is `isInitialized: false, accessToken: ""`, so:

- the server renders the spinner branch,
- the client's first (hydrating) render renders the same spinner branch → **markup matches, React logs no hydration error**,
- `initializeSession()` runs in a `useEffect`, flips the state, and only then do `AppShell`'s children — including `UserProfile` — mount.

So `UserProfile` never participates in hydration, and **no `isMounted` / `useEffect` mount-flag dance is needed.** Do not add one; it would be dead code. Also: `setSsoSession` always sets `accessToken` and `userDetail` together and `logout` clears both, so whenever `SessionGuard` lets children render, `userDetail` is non-null in practice.

**Decision:** keep it to one guard — when `userDetail` is `null`, render a `Skeleton`-based placeholder that mirrors the real layout's shape; otherwise render the real content. This covers the `null` type branch required by `tsc`, gives a correct loading shape if the gating ever changes, and adds no state or effects.

---

## Target composition

One file, `components/auth/UserProfile.tsx`, containing the default-exported `UserProfile` plus two module-local (not exported, not barrelled) helpers — allowed by AGENTS.md §2/§8 for single-use sub-components:

- `ProfileField({ label, value, icon })` — one `<div>` wrapping `<dt>`/`<dd>`.
- `ProfileSkeleton()` — the `userDetail === null` placeholder.

Visual structure:

1. **Root** `<section className="flex flex-col gap-4">` with `aria-labelledby="profile-heading"`, containing `<h1 id="profile-heading" className="text-lg font-medium"> ข้อมูลผู้ใช้ </h1>` (keeps the existing page title text and size).
2. **Identity card** — `<Card className="gap-0">` wrapping a band `<div className="flex flex-col items-center gap-4 bg-muted/40 p-5 text-center sm:flex-row sm:text-left">`:
   - `<Avatar className="size-20 shadow-sm ring-2 ring-card sm:size-24">` with `<AvatarImage src={avatarUrl} alt={displayName} className="object-fill" />` (same `object-fill` as the navbar) and `<AvatarFallback className="bg-primary/15 text-lg font-medium text-primary">` showing initials, or `<UserIcon aria-hidden="true" />` when initials come out empty.
   - `<div className="flex min-w-0 flex-col items-center gap-1 sm:items-start">`: `<h2 className="text-xl font-semibold break-words">{ displayName }</h2>`, then a secondary line `<p className="text-sm text-muted-foreground break-words">` showing `รหัสพนักงาน · { employeeId }`, then a chip row `<div className="flex flex-wrap justify-center gap-1.5 pt-1 sm:justify-start">`.
   - Chips (badge-like spans, no `badge` component exists): role chip in primary tone — `inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20` with `<BadgeCheckIcon className="size-3" aria-hidden="true" />`; plus neutral chips for `department` and `branch` — same shape but `bg-muted text-muted-foreground ring-border`. Render a chip only when its value is truthy (`{ department ? <span…> : null }`), so no empty pills appear.
3. **Contact card** — `<Card>` with `<CardHeader>`/`<CardTitle>` → `ข้อมูลติดต่อ`, `<CardContent>` holding a `<dl>` with `อีเมล` (`MailIcon`, value `email`) and `เบอร์โทรศัพท์` (`PhoneIcon`, value `phone`).
4. **Organisation card** — `<Card>` with title `ข้อมูลองค์กร`, `<dl>` holding `รหัสพนักงาน` (`IdCardIcon`), `ชื่อผู้ใช้` (`AtSignIcon`, `preferred_username`), `แผนก` (`Building2Icon`), `สาขา` (`StoreIcon`), `บทบาท` (`ShieldCheckIcon`, `system_role ?? roles?.[0]`).

`<dl>` grid: `className="grid grid-cols-1 gap-x-6 sm:grid-cols-2"`. Each `ProfileField` is `<div className="flex min-w-0 flex-col gap-1 border-b border-border/60 py-3 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0">` — if that selector feels fragile, drop the per-row border and instead place a `<Separator />` between the two `<dl>` blocks inside each card. Pick one; do not do both.

Inside `ProfileField`:

```tsx
<dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
    <Icon className="size-3.5" aria-hidden="true" />
    { label }
</dt>
<dd className={cn("min-w-0 text-sm break-words", !value && "text-muted-foreground")}> { value || "-" } </dd>
```

- Keeps the `<dl>`/`<dt>`/`<dd>` semantics (correct markup for label/value pairs) and the `"-"` empty fallback.
- `break-words` + `min-w-0` (not `truncate`) so long emails wrap instead of being hidden, and nothing overflows horizontally at 360px.
- `cn()` for the conditional muted colour — never a template literal with a ternary (AGENTS.md §8).
- All icons carry `aria-hidden="true"` so they are not announced.

Derived values at the top of the component (after the selector, before the return):

```ts
const displayName = userDetail?.name || "ผู้ใช้งาน"
const employeeId = userDetail?.employee_id ?? userDetail?.preferred_username ?? userDetail?.sub
const displayRole = userDetail?.system_role ?? userDetail?.roles?.[0]
```

Initials helper at module scope with an explicit return type (AGENTS.md §15):

```ts
const getInitials = ( name: string ): string =>
    name.trim().split(/\s+/).slice(0, 2).map(( part ) => part.charAt(0)).join("").toUpperCase()
```

Style rules that apply to the whole file: 4-space indent, no statement semicolons (semicolons only after `type` fields), double quotes, trailing commas in multi-line literals, spaces inside destructuring/JSX-expression braces (`<span> { value } </span>`) and inside condition/callback parens (`if ( !value ) …`, `( part ) => …`), `useState<T>` generics if any state is ever added (none is needed here), no `any`, theme tokens only, Tailwind v4 utilities only, no inline styles.

Import order (blank line between groups, per AGENTS.md §6):

```
"use client"

import { AtSignIcon, BadgeCheckIcon, Building2Icon, IdCardIcon, MailIcon, PhoneIcon, ShieldCheckIcon, StoreIcon, UserIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Separator } from "../ui/separator"        // only if the Separator variant is chosen
import { Skeleton } from "../ui/skeleton"

import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/useAppStore"

import type { LucideIcon } from "lucide-react"
```

(No React import is needed — no hooks beyond the Zustand selector, and JSX needs no import in React 19.)

---

## Implementation Plan

- [ ] 1. Rewrite `components/auth/UserProfile.tsx` with the identity + detail-card composition described above.
      Keep `"use client"`, keep the single Zustand selector `useAppStore(( state ) => state.userDetail)`, keep `export default function UserProfile()` so `components/auth/index.ts` needs no change. Add the module-local `ProfileField` sub-component (the `<dt>`/`<dd>` pair with its `LucideIcon` and the `value || "-"` fallback), the `getInitials` helper, and the derived `displayName` / `employeeId` / `displayRole` / `username` / `avatarUrl` values — `avatarUrl` built with the verbatim `NavbarUserMenu` expression. Drop the `py-4` from the root element. Reference only the `SsoUserInfo` fields confirmed above; add `phone`, do not add `position`/`company`/`permissions`.
      Files: `components/auth/UserProfile.tsx`
      Verify: `node ./node_modules/typescript/bin/tsc --noEmit` — exits 0 with no errors (this is the check that catches an invented `userDetail` field or a non-existent lucide export).

- [ ] 2. Add the `userDetail === null` branch as a `Skeleton`-based placeholder in the same file.
      A module-local `ProfileSkeleton()` mirroring the real layout: one `Card` with a `size-20 rounded-full` Skeleton plus two or three short text-line Skeletons, then one or two `Card`s each holding a `grid gap-x-6 sm:grid-cols-2` of label/value Skeleton pairs. `UserProfile` does `if ( !userDetail ) return <ProfileSkeleton />` after the selector. Do **not** add an `isMounted` state or a `useEffect` — `SessionGuard` already guarantees the component mounts only after client-side session init, so there is no hydration mismatch to defend against (see the decision section).
      Files: `components/auth/UserProfile.tsx`
      Verify: `node ./node_modules/typescript/bin/tsc --noEmit` — exits 0.

- [ ] 3. Add page metadata to the route wrapper; leave it otherwise untouched.
      `app/(protected)/profile/page.tsx` keeps returning just `<UserProfile />` (the `<h1>` lives in the component, per the heading decision) and gains `export const metadata: Metadata = { title: "ข้อมูลผู้ใช้" }` with `import type { Metadata } from "next"`. It is a Server Component, so this is valid. Do not add padding, a container, or a second heading here. Skip this item entirely if it turns out the route is not statically analysable for metadata — it is cosmetic.
      Files: `app/(protected)/profile/page.tsx`
      Verify: `node ./node_modules/typescript/bin/tsc --noEmit` — exits 0.

- [ ] 4. Lint both changed files and fix every finding.
      Files: `components/auth/UserProfile.tsx`, `app/(protected)/profile/page.tsx`
      Verify: `npm run lint` — no errors or warnings for the two changed files (fallback if `npx`/`npm` scripts are blocked: `node ./node_modules/eslint/bin/eslint.js components/auth/UserProfile.tsx "app/(protected)/profile/page.tsx"`).

- [ ] 5. Run the full production build to confirm nothing breaks at compile or prerender time.
      This is the step that fails loudly on a mistyped lucide icon or an unsupported `components/ui` prop, so it is mandatory before declaring done.
      Files: none (verification only)
      Verify: `npm run build` — completes successfully, `/profile` appears in the route output, no errors.

- [ ] 6. Re-read the final `components/auth/UserProfile.tsx` against the AGENTS.md §5/§6 style checklist and fix any drift.
      Confirm: 4-space indent, zero statement-ending semicolons, double quotes everywhere, trailing commas in multi-line arrays/objects, spaces inside destructuring and JSX-expression braces, spaces inside condition/callback parens, no line much over 140 chars, `cn()` used for every conditional class, theme tokens only (no hex/named colours), no inline `style`, every decorative icon `aria-hidden="true"`, `<AvatarImage alt={displayName}>` meaningful, headings in order (`h1` page title → `h2` user name → card titles), `<dl>/<dt>/<dd>` preserved, `"-"` fallback preserved.
      Files: `components/auth/UserProfile.tsx`
      Verify: `node ./node_modules/typescript/bin/tsc --noEmit` and `npm run lint` both clean after any touch-up.

---

## Traps to avoid (project-specific)

- **`next/image` does not prepend `basePath`.** Not needed in this task (no local image is used), but if one is ever added: `src={`${APP_BASE_PATH}/JIB_LOGO_BLUE.jpg`}` with `APP_BASE_PATH` from `@/config/env` — exactly as `components/navbar/Navbar.tsx` does.
- **Do not put the employee photo through `next/image`.** Its host is not in `next.config.ts` `images.remotePatterns`. Use `AvatarImage`, which is a plain `<img>`.
- **`public/` filenames are uppercase** and limited to: `JIB_BG.jpg`, `JIB_BLUE.png`, `JIB_LOGO.png`, `JIB_LOGO_BLACK.jpg`, `JIB_LOGO_BLUE.jpg`, `JIB_LOGO_WHITE.png`, `favicon.svg`, `icon/`. Do not reference anything else. (This task needs none of them.)
- **No `badge` component exists.** Build chips from `<span>` + Tailwind.
- **Do not edit anything under `components/ui/`**, do not install packages, do not add a toast library, do not create markdown docs.
- **Do not touch** the navbar, sidebar, store, auth flow, or `next.config.ts`.
- **Do not run `next dev` / `next start`** as a verification step — they are long-running. `npm run build` is the build check.
