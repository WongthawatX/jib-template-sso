import { SessionGuard } from "@/components/auth"
import { AppShell } from "@/components/layout"

import type { ReactNode } from "react"

export default function ProtectedLayout({ children }: { children: ReactNode }) {
    return <SessionGuard><AppShell>{ children }</AppShell></SessionGuard>
}
