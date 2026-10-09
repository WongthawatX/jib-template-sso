import { jwtDecode } from "jwt-decode"
import { create } from "zustand"

import { DEV_AUTH_BYPASS } from "@/config/env"
import { getStoredAccessToken, sessionStorageStore, storage } from "@/lib/storage"
import { getSsoUserInfo } from "@/services/apiSSOService"

import { normalizePermissions } from "@/utils/permissions"

import type { SsoUserInfo } from "@/services/apiSSOService"
import type { Permission } from "@/utils/permissions"

type AppState = {
    userDetail: SsoUserInfo | null;
    accessToken: string;
    expiresAt: number | null;
    permissions: Permission[];
    isInitialized: boolean;
    setSsoSession: ( token: string, user: SsoUserInfo, refreshToken?: string, expiresIn?: number ) => void;
    initializeSession: () => Promise<void>;
    logout: () => void;
}

let initialization: Promise<void> | null = null
let sessionVersion = 0

// dev bypass: สิทธิ์จำลอง "*" แบบ Procon; production รับสิทธิ์จาก SSO เท่านั้น
const DEV_MOCK_TOKEN = "dev-mock-access-token"
const DEV_SESSION_TTL_SECONDS = 8 * 60 * 60
const DEV_MOCK_USER: SsoUserInfo = {
    sub: "dev-user",
    user_id: "dev-user",
    employee_id: "EMP0001",
    preferred_username: "dev.user",
    name: "Dev User (Bypass)",
    email: "dev.user@jib.local",
    department: "IT",
    branch: "HQ",
    system_role: "admin",
    roles: [ "admin" ],
    permissions: [ "*" ],
}

const getExpiration = ( token: string, expiresIn?: number ): number | null => {
    const candidates: number[] = []
    if ( typeof expiresIn === "number" && Number.isFinite(expiresIn) ) candidates.push(Date.now() + expiresIn * 1000)
    try {
        const { exp } = jwtDecode<{ exp?: number }>(token)
        if ( typeof exp === "number" && Number.isFinite(exp) ) candidates.push(exp * 1000)
    } catch {
        // Opaque access tokens use expires_in from the token endpoint.
    }
    return candidates.length ? Math.min(...candidates) : null
}

export const useAppStore = create<AppState>(( set, get ) => ({
    userDetail: null,
    accessToken: "",
    expiresAt: null,
    permissions: [],
    isInitialized: false,

    setSsoSession: ( token, user, refreshToken, expiresIn ) => {
        const expiresAt = getExpiration(token, expiresIn)
        if ( expiresAt !== null && expiresAt <= Date.now() ) throw new Error("SSO session expired")
        const permissions = normalizePermissions(user.permissions)
        for ( const key of [ "accessToken", "userData", "permissions", "refreshToken", "expiresAt" ] ) {
            storage.removeItem(key)
        }
        sessionStorageStore.setItem("accessToken", token)
        sessionStorageStore.setItem("userData", JSON.stringify(user))
        sessionStorageStore.setItem("permissions", JSON.stringify(permissions))
        sessionStorageStore.setItem("expiresAt", JSON.stringify(expiresAt))
        if ( refreshToken ) sessionStorageStore.setItem("refreshToken", refreshToken)
        else sessionStorageStore.removeItem("refreshToken")
        sessionVersion += 1
        set({ accessToken: token, userDetail: user, permissions, expiresAt, isInitialized: true })
    },

    initializeSession: async () => {
        // dev bypass: seed session ปลอมทันที ไม่แตะ SSO backend (กันไว้ไม่ให้ยิง network/validate token ปลอม)
        if ( DEV_AUTH_BYPASS ) {
            if ( !get().accessToken ) get().setSsoSession(DEV_MOCK_TOKEN, DEV_MOCK_USER, undefined, DEV_SESSION_TTL_SECONDS)
            return
        }
        if ( get().isInitialized ) return
        if ( initialization ) return initialization
        const version = sessionVersion
        initialization = (async () => {
            const token = getStoredAccessToken()
            if ( !token ) {
                set({ isInitialized: true })
                return
            }
            try {
                const savedExpiry: unknown = JSON.parse(sessionStorageStore.getItem("expiresAt") ?? "null")
                const expiresAt = typeof savedExpiry === "number" ? savedExpiry : getExpiration(token)
                if ( expiresAt !== null && expiresAt <= Date.now() ) throw new Error("SSO session expired")
                // Validate with SSO; decoding a JWT does not verify its signature.
                const user = await getSsoUserInfo(token)
                if ( version !== sessionVersion ) return
                get().setSsoSession(
                    token, user, sessionStorageStore.getItem("refreshToken") ?? undefined,
                    expiresAt === null ? undefined : (expiresAt - Date.now()) / 1000,
                )
            } catch {
                if ( version === sessionVersion ) get().logout()
            }
        })().finally(() => { initialization = null })
        return initialization
    },

    logout: () => {
        sessionVersion += 1
        storage.clear()
        sessionStorageStore.clear()
        set({ userDetail: null, accessToken: "", permissions: [], expiresAt: null, isInitialized: true })
    },
}))
