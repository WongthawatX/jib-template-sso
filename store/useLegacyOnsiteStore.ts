import { jwtDecode } from "jwt-decode"
import { create } from "zustand"

import { USE_LEGACY_ONSITE_API } from "@/config/env"
import { sessionStorageStore } from "@/lib/storage"
import { useAppStore } from "@/store/useAppStore"

const STORAGE_KEY = "legacyOnsiteSession"

type LegacySession = {
    token: string;
    ownerSub: string;
}

type LegacyOnsiteState = {
    isConnected: boolean;
    initializeSession: () => void;
    connect: ( token: string ) => void;
    disconnect: () => void;
}

const isValidToken = ( token: string ): boolean => {
    try {
        const { exp } = jwtDecode<{ exp?: number }>(token)
        return typeof exp === "number" && Number.isFinite(exp) && exp * 1000 > Date.now()
    } catch {
        return false
    }
}

export function getLegacyOnsiteToken(): string {
    if ( !USE_LEGACY_ONSITE_API ) return ""
    try {
        const saved: unknown = JSON.parse(sessionStorageStore.getItem(STORAGE_KEY) ?? "null")
        if ( !saved || typeof saved !== "object" ) return ""
        const session = saved as Partial<LegacySession>
        const ownerSub = useAppStore.getState().userDetail?.sub
        if ( !ownerSub || session.ownerSub !== ownerSub || typeof session.token !== "string" || !isValidToken(session.token) ) {
            useLegacyOnsiteStore.getState().disconnect()
            return ""
        }
        return session.token
    } catch {
        useLegacyOnsiteStore.getState().disconnect()
        return ""
    }
}

export const useLegacyOnsiteStore = create<LegacyOnsiteState>(( set ) => ({
    isConnected: false,
    initializeSession: () => set({ isConnected: Boolean(getLegacyOnsiteToken()) }),
    connect: ( value ) => {
        if ( !USE_LEGACY_ONSITE_API ) throw new Error("การใช้ token ระบบเดิมเปิดได้เฉพาะโหมดพัฒนา")
        const ownerSub = useAppStore.getState().userDetail?.sub
        if ( !ownerSub ) throw new Error("กรุณาเข้าสู่ระบบ SSO ก่อน")
        const token = value.trim().replace(/^Bearer\s+/i, "")
        if ( token === useAppStore.getState().accessToken ) throw new Error("กรุณาใช้ token จาก Login ระบบ Onsite เดิม ไม่ใช่ token จาก SSO")
        if ( /\s/.test(token) || !isValidToken(token) ) throw new Error("Token ไม่ถูกต้องหรือหมดอายุ กรุณา Login ระบบเดิมเพื่อรับ token ใหม่")
        const session = JSON.stringify({ token, ownerSub })
        sessionStorageStore.setItem(STORAGE_KEY, session)
        if ( sessionStorageStore.getItem(STORAGE_KEY) !== session ) throw new Error("ไม่สามารถเก็บ token ใน session storage ได้")
        set({ isConnected: true })
    },
    disconnect: () => {
        sessionStorageStore.removeItem(STORAGE_KEY)
        set({ isConnected: false })
    },
}))
