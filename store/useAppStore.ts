import { jwtDecode } from "jwt-decode"
import { create } from "zustand"

import { DEV_AUTH_BYPASS } from "@/config/env"
import { getStoredAccessToken, sessionStorageStore, storage } from "@/lib/storage"
import { getSsoUserInfo } from "@/services/apiSSOService"

import type { SsoUserInfo } from "@/services/apiSSOService"
import type { Permission } from "@/utils/permissions"

type UserDetail = SsoUserInfo & {
    id: string;
    username: string;
    fullname: string;
    full_name: string;
    role: string;
}

type AppState = {
    userDetail: UserDetail | null;
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

// dev bypass: ผู้ใช้ปลอม role admin (เห็นทุกเมนู) + สิทธิ์ครบทุก action ทุกเมนู
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
    permissions: [ 1, 2, 3, 4 ].map(( menu_id ) => ({
        menu_id,
        views: 1,
        creates: 1,
        edits: 1,
        deletes: 1,
        approves: 1,
        printed: 1,
    })),
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
        const permissions = user.permissions ?? []
        const userDetail: UserDetail = {
            ...user,
            id: user.user_id ?? user.sub,
            username: user.preferred_username ?? user.employee_id ?? user.sub,
            fullname: user.name ?? "",
            full_name: user.name ?? "",
            role: user.system_role ?? user.roles?.[0] ?? "user",
        }
        for ( const key of [ "accessToken", "userData", "permissions", "refreshToken", "expiresAt" ] ) {
            storage.removeItem(key)
        }
        sessionStorageStore.setItem("accessToken", token)
        sessionStorageStore.setItem("userData", JSON.stringify(userDetail))
        sessionStorageStore.setItem("permissions", JSON.stringify(permissions))
        sessionStorageStore.setItem("expiresAt", JSON.stringify(expiresAt))
        if ( refreshToken ) sessionStorageStore.setItem("refreshToken", refreshToken)
        else sessionStorageStore.removeItem("refreshToken")
        sessionVersion += 1
        set({ accessToken: token, userDetail, permissions, expiresAt, isInitialized: true })
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
