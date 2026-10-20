"use client"

import { useEffect } from "react"

import { usePathname, useRouter } from "next/navigation"

import { ShieldCheck } from "lucide-react"

import { logoutSso } from "@/services/apiSSOService"
import { useAppStore } from "@/store/useAppStore"

import type { ReactNode } from "react"

export default function SessionGuard({ children }: { children: ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const accessToken = useAppStore(( state ) => state.accessToken)
    const isInitialized = useAppStore(( state ) => state.isInitialized)
    const hasLoggedOut = useAppStore(( state ) => state.hasLoggedOut)
    const expiresAt = useAppStore(( state ) => state.expiresAt)
    const initializeSession = useAppStore(( state ) => state.initializeSession)
    const logout = useAppStore(( state ) => state.logout)

    useEffect(() => { void initializeSession() }, [ initializeSession ])

    useEffect(() => {
        if ( isInitialized && !accessToken ) {
            const returnTo = `${pathname}${window.location.search}${window.location.hash}`
            router.replace(hasLoggedOut ? "/login?loggedOut=1" : `/login?returnTo=${encodeURIComponent(returnTo)}`)
        }
    }, [ accessToken, hasLoggedOut, isInitialized, pathname, router ])

    useEffect(() => {
        if ( !accessToken || expiresAt === null ) return
        let hasStartedLogout = false
        const checkExpiration = () => {
            if ( Date.now() < expiresAt || hasStartedLogout ) return
            hasStartedLogout = true
            void logoutSso(accessToken).catch(() => undefined).finally(() => {
                logout()
                router.replace("/login?loggedOut=1")
            })
        }
        checkExpiration()
        const timer = window.setInterval(checkExpiration, 1000)
        window.addEventListener("focus", checkExpiration)
        return () => {
            window.clearInterval(timer)
            window.removeEventListener("focus", checkExpiration)
        }
    }, [ accessToken, expiresAt, logout, router ])

    if ( !isInitialized || !accessToken ) {
        return (
            <div
                role="status"
                aria-live="polite"
                aria-busy="true"
                className="flex min-h-svh flex-col items-center justify-center gap-6 bg-linear-to-br from-background via-accent/30 to-background"
            >
                <div className="relative flex size-16 items-center justify-center">
                    <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary/15 border-t-primary" />
                    <div className="absolute inset-1.5 animate-pulse rounded-full bg-primary/5" />
                    <div className="relative flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm ring-1 ring-inset ring-primary/15">
                        <ShieldCheck className="size-5" aria-hidden="true" />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-1 text-center">
                    <span className="text-sm font-medium text-foreground"> กำลังตรวจสอบการเข้าสู่ระบบ </span>
                    <span className="text-xs text-muted-foreground"> กรุณารอสักครู่ </span>
                </div>
            </div>
        )
    }
    return children
}
