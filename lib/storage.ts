import { APP_BASE_PATH } from "@/config/env"

const rawBase = APP_BASE_PATH

export const STORAGE_NS = rawBase.replace(/^\/+|\/+$/g, "").replace(/\//g, "_") || "app"

const PREFIX = `${STORAGE_NS}:`

const k = (key: string) => `${PREFIX}${key}`

export const storage = {
    getItem(key: string): string | null {
        try {
            return localStorage.getItem(k(key))
        } catch {
            return null
        }
    },

    setItem(key: string, value: string): void {
        try {
            localStorage.setItem(k(key), value)
        } catch {
            /* quota exceeded or storage disabled */
        }
    },

    removeItem(key: string): void {
        try {
            localStorage.removeItem(k(key))
        } catch {
            /* ignore */
        }
    },

    /**
     * Remove ONLY keys belonging to this app's namespace.
     * Sibling apps on the same origin keep their data.
     */
    clear(): void {
        try {
            const toRemove: string[] = []
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (key && key.startsWith(PREFIX)) toRemove.push(key)
            }
            toRemove.forEach((key) => localStorage.removeItem(key))
        } catch {
            /* ignore */
        }
    },
}

export const sessionStorageStore = {
    getItem(key: string): string | null {
        try {
            return sessionStorage.getItem(k(key))
        } catch {
            return null
        }
    },

    setItem(key: string, value: string): void {
        try {
            sessionStorage.setItem(k(key), value)
        } catch {
            /* storage disabled */
        }
    },

    removeItem(key: string): void {
        try {
            sessionStorage.removeItem(k(key))
        } catch {
            /* ignore */
        }
    },

    clear(): void {
        try {
            const toRemove: string[] = []
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i)
                if (key && key.startsWith(PREFIX)) toRemove.push(key)
            }
            toRemove.forEach((key) => sessionStorage.removeItem(key))
        } catch {
            /* ignore */
        }
    },
}

export const getStoredAccessToken = (): string =>
    sessionStorageStore.getItem("accessToken") ?? storage.getItem("accessToken") ?? ""

