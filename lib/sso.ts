import { APP_BASE_PATH, env } from "@/config/env"
import { sessionStorageStore } from "@/lib/storage"
import { AUTH_MESSAGES } from "@/utils/messages"

const AUTHORIZATION_STORAGE_KEY = "ssoAuthorization"
const AUTHORIZATION_TTL_MS = 10 * 60 * 1000

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
        throw new Error(AUTH_MESSAGES.INSECURE_ORIGIN)
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
        app_name: env.SSO_APP_NAME,
    }).toString()

    saveAuthorization(authorization)
    window.location.assign(authorizeUrl.toString())
}

function saveAuthorization(authorization: SsoAuthorization): void {
    const value = JSON.stringify(authorization)
    sessionStorageStore.setItem(AUTHORIZATION_STORAGE_KEY, value)
    if ( sessionStorageStore.getItem(AUTHORIZATION_STORAGE_KEY) !== value ) {
        throw new Error(AUTH_MESSAGES.SESSION_STORAGE_BLOCKED)
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
        if ( !authorization ) throw new Error(AUTH_MESSAGES.AUTHORIZATION_EXPIRED)
        if ( !state || state !== authorization.state ) throw new Error(AUTH_MESSAGES.STATE_MISMATCH)
        if ( error ) {
            throw new Error(error === "access_denied" ? AUTH_MESSAGES.LOGIN_CANCELED : AUTH_MESSAGES.SSO_PROVIDER_FAILED)
        }
        if ( !code ) throw new Error(AUTH_MESSAGES.AUTHORIZATION_CODE_MISSING)
        return { authorization, code }
    } catch ( error ) {
        clearSsoAuthorization()
        throw error
    }
}
