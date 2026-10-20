"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

import { APP_BASE_PATH } from "@/config/env"
import { useAppStore } from "@/store/useAppStore"
import { getRoutePermission } from "@/utils/navigationPermissions"
import { hasPermission } from "@/utils/permissions"

import type { ReactNode } from "react"

/** กันหน้าและ URL ตรงด้วยสิทธิ์ชุดเดียวกับ Sidebar (API ตรวจสิทธิ์ที่ backend อีกชั้น) */
export default function RequirePermission({ children }: { children: ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const permissions = useAppStore(( state ) => state.permissions)
    const isInitialized = useAppStore(( state ) => state.isInitialized)
    const routePath = APP_BASE_PATH && pathname.startsWith(APP_BASE_PATH + "/")
        ? pathname.slice(APP_BASE_PATH.length) : pathname
    const requirement = getRoutePermission(routePath)
    const isAllowed = !requirement || hasPermission( permissions, requirement.resource, requirement.action )

    useEffect(() => {
        if ( isInitialized && !isAllowed ) router.replace("/dashboard")
    }, [ isAllowed, isInitialized, router ])

    if ( !isInitialized || !isAllowed ) return null
    return children
}
