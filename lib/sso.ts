import { APP_BASE_PATH, env } from "@/config/env"
import { sessionStorageStore } from "@/lib/storage"
import { createSsoAuthorizationRequest } from "@/services/apiSSOService"

const AUTHORIZATION_STORAGE_KEY = "ssoAuthorization"
const AUTHORIZATION_TTL_MS = 10 * 60 * 1000
const SSO_APP_NAME = "template"

export type SsoAuthorization = {
    state: string;
    nonce: string;
    codeVerifier: string;
    redirectUri: string;
    returnTo: string;
    createdAt: number;
    expiresAt: number;
}

function createRandomValue(byteLength: number): string {
    const bytes = crypto.getRandomValues(new Uint8Array(byteLength))
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("")

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "")
}

async function createCodeChallenge(codeVerifier: string): Promise<string> {
    const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(codeVerifier),
    )
    const binary = Array.from(new Uint8Array(digest), (byte) => String.fromCharCode(byte)).join("")

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "")
}

function getAbsoluteUrl(value: string, fallbackPath: string): string {
    return new URL(value || fallbackPath, window.location.origin).toString()
}

export function getSafeReturnTo(returnTo: string): string {
    if ( !returnTo.startsWith("/") || returnTo.startsWith("//") || /[\\\u0000-\u0020]/.test(returnTo) ) return "/dashboard"
    const url = new URL(returnTo, "https://app.invalid")
    if ( url.origin !== "https://app.invalid" || /^\/(login|auth)(\/|$)/.test(url.pathname) ) return "/dashboard"
    return `${url.pathname}${url.search}${url.hash}`
}

export async function beginSsoAuthorization(returnTo: string): Promise<void> {
    if ( !window.isSecureContext || !window.crypto?.subtle ) {
        throw new Error("กรุณาเปิดผ่าน localhost หรือ HTTPS เพื่อเข้าสู่ระบบอย่างปลอดภัย")
    }
    const state = createRandomValue(32)
    const nonce = createRandomValue(32)
    const codeVerifier = createRandomValue(64)
    const codeChallenge = await createCodeChallenge(codeVerifier)
    const redirectUri = getAbsoluteUrl(env.SSO_REDIRECT_URI, `${APP_BASE_PATH}/auth/callback`)
    const ssoBaseUrl = new URL(getAbsoluteUrl(env.SSO_BASE_URL, "/nexus-intralogin"))
    ssoBaseUrl.pathname = ssoBaseUrl.pathname.replace(/\/$/, "").replace(/\/signin$/, "")
    ssoBaseUrl.search = ""
    ssoBaseUrl.hash = ""
    const authorization: SsoAuthorization = {
        state,
        nonce,
        codeVerifier,
        redirectUri,
        returnTo: getSafeReturnTo(returnTo),
        createdAt: Date.now(),
        expiresAt: Date.now() + AUTHORIZATION_TTL_MS,
    }

    if ( !env.SSO_API_BASE_URL ) {
        const authorizeUrl = new URL(ssoBaseUrl)
        authorizeUrl.pathname = `${ssoBaseUrl.pathname.replace(/\/$/, "")}/authorize`
        authorizeUrl.search = new URLSearchParams({
            client_id: env.SSO_CLIENT_ID,
            redirect_uri: redirectUri,
            response_type: "code",
            scope: env.SSO_SCOPE,
            state,
            nonce,
            code_challenge: codeChallenge,
            code_challenge_method: "S256",
            app_name: SSO_APP_NAME,
        }).toString()

        saveAuthorization(authorization)
        window.location.assign(authorizeUrl.toString())
        return
    }

    const result = await createSsoAuthorizationRequest({
        clientId: env.SSO_CLIENT_ID,
        redirectUri,
        scope: env.SSO_SCOPE,
        state,
        nonce,
        codeChallenge,
    })

    saveAuthorization(authorization)

    if ( result.action === "redirect" ) {
        const target = new URL(result.redirectUrl, window.location.origin)
        const callback = new URL(redirectUri)
        if ( target.origin !== callback.origin || target.pathname !== callback.pathname ) {
            clearSsoAuthorization()
            throw new Error("SSO ส่ง callback URL ไม่ตรงกับที่ตั้งค่าไว้")
        }
        window.location.assign(target.toString())
        return
    }

    const signinUrl = new URL(ssoBaseUrl)
    signinUrl.pathname = `${ssoBaseUrl.pathname.replace(/\/$/, "")}/signin`
    signinUrl.searchParams.set("authorizationRequestId", result.authorizationRequestId)
    signinUrl.searchParams.set("app_name", SSO_APP_NAME)
    const expiresInSeconds = Math.max(1, Math.min(result.expiresIn ?? 300, 600))
    authorization.expiresAt = Date.now() + expiresInSeconds * 1_000
    signinUrl.searchParams.set("expiresIn", String(expiresInSeconds))
    signinUrl.searchParams.set("expiresAt", String(authorization.expiresAt))

    saveAuthorization(authorization)
    window.location.assign(signinUrl.toString())
}

function saveAuthorization(authorization: SsoAuthorization): void {
    const value = JSON.stringify(authorization)
    sessionStorageStore.setItem(AUTHORIZATION_STORAGE_KEY, value)
    if ( sessionStorageStore.getItem(AUTHORIZATION_STORAGE_KEY) !== value ) {
        throw new Error("กรุณาอนุญาต session storage ในเบราว์เซอร์ แล้วลองอีกครั้ง")
    }
}

export function getSsoAuthorization(): SsoAuthorization | null {
    const rawAuthorization = sessionStorageStore.getItem(AUTHORIZATION_STORAGE_KEY)

    if ( !rawAuthorization ) return null

    try {
        const authorization: unknown = JSON.parse(rawAuthorization)

        if (
            typeof authorization !== "object" ||
            authorization === null ||
            !("state" in authorization) ||
            !("nonce" in authorization) ||
            !("codeVerifier" in authorization) ||
            !("redirectUri" in authorization) ||
            !("returnTo" in authorization) ||
            !("createdAt" in authorization) ||
            !("expiresAt" in authorization) ||
            typeof authorization.state !== "string" ||
            typeof authorization.nonce !== "string" ||
            typeof authorization.codeVerifier !== "string" ||
            typeof authorization.redirectUri !== "string" ||
            typeof authorization.returnTo !== "string" ||
            typeof authorization.createdAt !== "number" ||
            typeof authorization.expiresAt !== "number" ||
            Date.now() >= authorization.expiresAt
        ) {
            clearSsoAuthorization()
            return null
        }

        return { ...authorization, returnTo: getSafeReturnTo(authorization.returnTo) } as SsoAuthorization
    } catch {
        clearSsoAuthorization()
        return null
    }
}

export function clearSsoAuthorization(): void {
    sessionStorageStore.removeItem(AUTHORIZATION_STORAGE_KEY)
}

export function readSsoCallback(params: Pick<URLSearchParams, "get">): { authorization: SsoAuthorization; code: string } {
    const authorization = getSsoAuthorization()
    const state = params.get("state")
    const code = params.get("code")
    const error = params.get("error")
    try {
        if ( !authorization ) throw new Error("ข้อมูลการเข้าสู่ระบบหมดอายุ กรุณาเริ่มใหม่")
        if ( !state || state !== authorization.state ) throw new Error("ตรวจสอบ state ไม่สำเร็จ กรุณาเริ่มใหม่")
        if ( error ) {
            throw new Error(error === "access_denied" ? "ยกเลิกการเข้าสู่ระบบแล้ว" : "ระบบ SSO ไม่สามารถเข้าสู่ระบบได้ กรุณาลองอีกครั้ง")
        }
        if ( !code ) throw new Error("ไม่พบ Authorization Code จากระบบ SSO")
        return { authorization, code }
    } catch ( error ) {
        clearSsoAuthorization()
        throw error
    }
}
